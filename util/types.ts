// util/types.ts
export type MigrationsState = {
    __applied_migrations__: string[];
};

export type Migration = {
    name: string;
    query: string | string[];
};

export type Query = {
    query: string;
    parts: (number | string)[] | [];
};

export type Error = {
    statusText?: string | null;
    message?: string | null;
    source?: string | null;
};

export type ResultResponse = {
    payload: string | null;
    error: Error;
};

export type FetchResponse = {
    data: object[];
};

export type MutationResponse = {
    rows_affected: number;
    last_insert_rowid: number;
};

export type MigrationResponse = {
    state: boolean;
};

export enum Iss {
    CLIENT = "CLIENT",
    SERVER = "SERVER",
}

export enum Sub {
    DATA = "DATA",
    FETCH = "FETCH",
    MIGRATE = "MIGRATE",
    MUTATE = "MUTATE",
}

export type DatKind =
    | Query
    | Migration
    | FetchResponse
    | MutationResponse
    | MigrationResponse
    | ResultResponse;

export type Claims = {
    iss: Iss;
    sub: Sub;
    dat: DatKind;
    iat: number;
    exp: number;
};
