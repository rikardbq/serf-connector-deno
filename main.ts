// main.ts
/**
 * Connector for sqlite_server
 * ---
 * Sets up connections according to ruleset where
 *  - request body to sqlite_server is signed using the username + password hash.
 *  - header is provided with username hash [ u_ ]
 *  - adding the correct subjects to claims MUTATE or FETCH, sent as [ M_, F_ ]
 */
import * as jose from "jose";

const generateSHA256 = async (input: string, encoder: TextEncoder) => {
    const text_as_buffer = encoder.encode(input);
    const hash_buffer = await globalThis.crypto.subtle.digest(
        "SHA-256",
        text_as_buffer,
    );
    const hash_arr = Array.from(new Uint8Array(hash_buffer));
    const hash = hash_arr
        .map((item) => item.toString(16).padStart(2, "0"))
        .join("");

    return hash;
};

enum Iss {
    CLIENT = "C_",
    SERVER = "S_",
}

enum Sub {
    MUTATE = "M_",
    FETCH = "F_",
}

type Dat = {
    base_query: string;
    parts: (number | string)[] | [];
};

type Claims = {
    iss: Iss;
    sub: Sub;
    dat: string;
    iat: number;
    exp: number;
};

/**
 * @param {Sub} sub
 * @param {Dat} dat
 * @returns {Claims} JWT claims
 */
const generateClaims = (sub: Sub, dat: Dat): Claims => {
    const now = Math.floor(Date.now() / 1000);

    return {
        iss: Iss.CLIENT,
        sub,
        dat: JSON.stringify(dat),
        iat: now,
        exp: now + 30,
    };
};

type ConnectorInitArgs = {
    database: string;
    username: string;
    password: string;
};

export class Connector {
    private call: (
        sub: Sub,
        q: string,
        ...qa: (number | string)[]
    ) => Promise<Response>;

    private constructor(
        full_addr: string,
        username_hash: string,
        username_password_hash: string,
    ) {
        this.call = this.exec(full_addr, username_hash, username_password_hash);
    }

    /**
     * @param {string} addr
     * @param {ConnectorInitArgs} connector_init_args
     * @returns {Connector} new instance of Connector
     */
    static async init(
        addr: string,
        {
            database,
            username,
            password,
        }: ConnectorInitArgs,
    ): Promise<Connector> {
        const encoder = new TextEncoder();

        const database_hash = await generateSHA256(database, encoder);
        const username_hash = await generateSHA256(username, encoder);
        const username_password_hash = await generateSHA256(
            username + password,
            encoder,
        );
        const full_addr = `${addr}/${database_hash}`;

        return new Connector(full_addr, username_hash, username_password_hash);
    }

    /**
     * @param {string} full_addr
     * @param {string} username_hash
     * @param {string} username_password_hash
     * @returns {(q: string, ...qa: (number | string)[]) => Promise<Response>} function that accepts query string and query varargs and returns thenable / awaitable fetch response
     */
    private exec(
        full_addr: string,
        username_hash: string,
        username_password_hash: string,
    ): typeof this.call {
        const endpoint = full_addr;
        const headers = {
            "content-type": "application/json",
            u_: username_hash,
        };
        const encoder = new TextEncoder();

        return async function (
            sub: Sub,
            query: string,
            ...query_args: (number | string)[]
        ) {
            const dat: Dat = {
                "base_query": query,
                "parts": query_args,
            };

            const claims = generateClaims(sub, dat);
            const jwk = encoder.encode(username_password_hash);
            const jws = await new jose.SignJWT(claims)
                .setProtectedHeader({ alg: "HS256" })
                .sign(jwk);

            const body = JSON.stringify({
                payload: jws,
            });

            return fetch(
                new Request(endpoint, {
                    method: "POST",
                    body,
                    headers,
                }),
            );
        };
    }

    /**
     * @param {string} query
     * @param {(number | string)[]} query_args
     * @returns {JSON} json data
     */
    async query(query: string, ...query_args: (number | string)[]) {
        return (await this.call(Sub.FETCH, query, ...query_args)).json();
    }

    /**
     * @param {string} query
     * @param {(number | string)[]} query_args
     * @returns {JSON} json dataI
     */
    async mutate(query: string, ...query_args: (number | string)[]) {
        return (await this.call(Sub.MUTATE, query, ...query_args)).json();
    }
}

/**
 * EXAMPLE USAGE:
 *
const connection = await Connector.init(
    "http://localhost:8080",
    { database: "testing", username: "rikardbq", password: "test_pass" },
);

console.log(
    await connection.query(
        "SELECT * FROM users5 WHERE id = ? AND name = ?;",
        1,
        "hello",
    ),
);
*/
