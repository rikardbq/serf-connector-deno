// util/types.ts
export type MigrationsState = {
    __applied_migrations__: string[];
};

export type Migration = {
    name: string;
    query: string | string[];
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

export type RequestQuery = {
    query: string;
    parts: (number | string)[] | [];
};

export type RequestMigration = {
    migrations: Migration[];
};

export type Claims = {
    iss: Iss;
    sub: Sub;
    dat: string;
    iat: number;
    exp: number;
};
