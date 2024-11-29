// main.ts
/**
 * Connector for sqlite_server
 * ---
 * Sets up connections according to ruleset where
 *  - request body to sqlite_server is signed using the username + password hash.
 *  - header is provided with username hash [ u_ ]
 *  - adding the correct subjects to claims MUTATE or FETCH, sent as [ M_, F_ ]
 */
export * from "./connector.ts";
export * from "./migrator.ts";
