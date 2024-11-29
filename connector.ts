// connector.ts
/**
 * Connector for sqlite_server
 * ---
 * Sets up connections according to ruleset where
 *  - request body to sqlite_server is signed using the username + password hash.
 *  - header is provided with username hash [ u_ ]
 *  - adding the correct subjects to claims MUTATE or FETCH, sent as [ M_, F_ ]
 */
import {
    decodeJWT,
    generateClaims,
    generateJWS,
    generateSHA256,
    verifyJWT,
} from "util";
import { type RequestMigration, type RequestQuery, Sub } from "./util/types.ts";
import { requestCallSymbol } from "./util/symbols.ts";

type Error = { statusText?: string; message?: string };

const syntheticResponseObject = (error: Error) => ({
    payload: null,
    error: error.statusText ?? error.message ??
        "Something went wrong (unspecified error)",
});

const handleResponse = async (
    res: Response,
    usernamePasswordHash: Uint8Array,
): Promise<{ data: any }> => {
    const json = await res.json();

    if (json.error) {
        return json;
    }

    await verifyJWT(
        json.payload as string,
        usernamePasswordHash,
    );

    const decoded = decodeJWT(json.payload);

    return {
        data: JSON.parse(decoded.dat as string),
    };
};

type ConnectorInitOptions = {
    database: string;
    username: string;
    password: string;
};

export class Connector {
    [requestCallSymbol]: (
        sub: Sub,
        d: RequestQuery | RequestMigration,
        opt?: {
            pathParam?: string;
        },
    ) => Promise<{ data: any }>;

    private constructor(
        fullAddr: string,
        usernameHash: string,
        usernamePasswordHash: Uint8Array,
    ) {
        this[requestCallSymbol] = this.prepare(
            fullAddr,
            usernameHash,
            usernamePasswordHash,
        );
    }

    /**
     * @param {string} addr
     * @param {ConnectorInitOptions} connector_init_args
     * @returns {Connector} new instance of Connector
     */
    static async init(
        addr: string,
        {
            database,
            username,
            password,
        }: ConnectorInitOptions,
    ): Promise<Connector> {
        const encoder = new TextEncoder();
        const database_lc = database.toLowerCase();
        const pattern = /[^a-z0-9_-]+/g;

        if (pattern.test(database_lc)) {
            throw new Error(
                "Database name may only contain characters from these patterns: [a-z, 0-9, _-]",
            );
        }

        const database_hash = await generateSHA256(database_lc, encoder);
        const usernameHash = await generateSHA256(username, encoder);
        const usernamePasswordHash = await generateSHA256(
            username + password,
            encoder,
        );
        const fullAddr = `${addr}/${database_hash}`;

        return new Connector(
            fullAddr,
            usernameHash,
            encoder.encode(usernamePasswordHash),
        );
    }

    /**
     * @param {string} fullAddr
     * @param {string} usernameHash
     * @param {string} usernamePasswordHash
     * @returns {(q: string, ...qa: (number | string)[]) => Promise<any>} function that accepts query string and query varargs and returns thenable / awaitable fetch response
     */
    private prepare(
        fullAddr: string,
        usernameHash: string,
        usernamePasswordHash: Uint8Array,
    ) {
        const endpoint = fullAddr;
        const headers = {
            "content-type": "application/json",
            u_: usernameHash,
        };

        return async function (
            sub: Sub,
            dat: RequestQuery | RequestMigration,
            opt?: {
                pathParam?: string;
            },
        ) {
            const optionalPathParam = opt?.pathParam ?? "";
            const claims = generateClaims(sub, dat);
            const jws = await generateJWS(claims, usernamePasswordHash);
            const body = JSON.stringify({
                payload: jws,
            });

            return handleResponse(
                await fetch(
                    new Request(endpoint + optionalPathParam, {
                        method: "POST",
                        body,
                        headers,
                    }),
                ),
                usernamePasswordHash,
            );
        };
    }

    /**
     * @param {string} query
     * @param {(number | string)[]} queryArgs
     * @returns {JSON} json data
     */
    async query(query: string, ...queryArgs: (number | string)[]) {
        try {
            return await this[requestCallSymbol](Sub.FETCH, {
                query,
                parts: queryArgs,
            });
        } catch (error) {
            return syntheticResponseObject(error as Error);
        }
    }

    /**
     * @param {string} query
     * @param {(number | string)[]} queryArgs
     * @returns {JSON} json data
     */
    async mutate(query: string, ...queryArgs: (number | string)[]) {
        try {
            return await this[requestCallSymbol](Sub.MUTATE, {
                query,
                parts: queryArgs,
            });
        } catch (error) {
            return syntheticResponseObject(error as Error);
        }
    }
}

/**
 * EXAMPLE USAGE:

const connection = await Connector.init(
    "http://localhost:8080",
    { database: "helloworld", username: "rikard", password: "123" },
);
await connection.mutate(
    `
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY NOT NULL,
        username TEXT NOT NULL UNIQUE,
        first_name TEXT NOT NULL UNIQUE,
        last_name TEXT NOT NULL
    );
    `,
);

const data_mut = await connection.mutate(
    `
    INSERT OR IGNORE INTO users(username, first_name, last_name) VALUES(?, ?, ?);
    `,
    "rikardo22", "Rikard123o", "Bergquisto123123"
);

const data = await connection.query(
    `
    SELECT * FROM users;
    `
);

console.log(data_mut);
console.log(data);
*/
