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

export type FetchRes = object[];

export type MutationRes = {
    rows_affected: number;
    last_insert_rowid: number;
};

export type MigrationRes = {
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

export type DatKind = Query | Migration | FetchRes | MutationRes | MigrationRes;

export type Claims = {
    iss: Iss;
    sub: Sub;
    dat: DatKind;
    iat: number;
    exp: number;
};
