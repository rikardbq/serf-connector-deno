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

export type FetchResponse = object[];

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

export type DatKind = Query | Migration | FetchResponse | MutationResponse | MigrationResponse;

export type Claims = {
    iss: Iss;
    sub: Sub;
    dat: DatKind;
    iat: number;
    exp: number;
};
