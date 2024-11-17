// main.ts
/**
 * Connector for sqlite_server
 * ---
 * Sets up connections according to ruleset where
 *  - request body to sqlite_server is signed using the username + password hash.
 *  - header is provided with username hash [ u_ ]
 *  - adding the correct subjects to claims MUTATE or FETCH, sent as [ M_, F_ ]
 */
import {
    type Dat,
    decodeJWT,
    generateClaims,
    generateJWS,
    generateSHA256,
    Sub,
    verifyJWT,
} from "util";

type Error = { statusText: string; message: string };

const syntheticResponseObject = (error: Error) => ({
    payload: null,
    error: error.statusText ?? error.message ??
        "Something went wrong (unspecified error)",
});

const handleResponse = async (
    res: Response,
    username_password_hash: Uint8Array,
) => {
    const json = await res.json();

    if (json.error) {
        return json;
    }

    await verifyJWT(
        json.payload as string,
        username_password_hash,
    );

    const decoded = decodeJWT(json.payload);

    return {
        data: JSON.parse(decoded.dat as string),
    };
};

type ConnectorInitArgs = {
    database: string;
    username: string;
    password: string;
};

export class Connector {
    private username_password_hash: Uint8Array;
    private call: (
        sub: Sub,
        q: string,
        ...qa: (number | string)[]
    ) => Promise<Response>;

    private constructor(
        full_addr: string,
        username_hash: string,
        username_password_hash: Uint8Array,
    ) {
        this.username_password_hash = username_password_hash;
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

        return new Connector(
            full_addr,
            username_hash,
            encoder.encode(username_password_hash),
        );
    }

    /**
     * @param {string} full_addr
     * @param {string} username_hash
     * @param {string} username_password_hash
     * @returns {(q: string, ...qa: (number | string)[]) => Promise<any>} function that accepts query string and query varargs and returns thenable / awaitable fetch response
     */
    private exec(
        full_addr: string,
        username_hash: string,
        username_password_hash: Uint8Array,
    ): typeof this.call {
        const endpoint = full_addr;
        const headers = {
            "content-type": "application/json",
            u_: username_hash,
        };

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
            const jws = await generateJWS(claims, username_password_hash);

            const body = JSON.stringify({
                payload: jws,
            });

            return await fetch(
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
        try {
            return await handleResponse(await this.call(Sub.FETCH, query, ...query_args), this.username_password_hash);
        } catch (error) {
            return syntheticResponseObject(error as Error);
        }
    }

    /**
     * @param {string} query
     * @param {(number | string)[]} query_args
     * @returns {JSON} json data
     */
    async mutate(query: string, ...query_args: (number | string)[]) {
        try {
            return await handleResponse(await this.call(Sub.MUTATE, query, ...query_args), this.username_password_hash);
        } catch (error) {
            return syntheticResponseObject(error as Error);
        }
    }
}

/**
 * EXAMPLE USAGE:
const connection = await Connector.init(
    "http://localhost:8080",
    { database: "testing", username: "rikardbq", password: "test_pass" },
);

const data = await connection.query(
    "SELECT * FROM users5;",
);

console.log(data);
 */
