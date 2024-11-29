// migration.ts
import { ensureDir, ensureFile } from "@std/fs";
import { SEPARATOR } from "@std/path/constants";
import { format } from "@std/path/format";
import type { Migration } from "./types.ts";

export const MIGRATIONS_STATE_FILE = "__$gen.serf.state.migrations__.json";
// export const MIGRATIONS_STATE_FILE = "__$gen.serf.applied.migrations__.json";
export const MIGRATIONS_MANIFEST_FILE = "migrations.json";

export const ensureMigrationsManifest = async (path: string) => {
    const filePath = format({ dir: path, base: MIGRATIONS_MANIFEST_FILE });
    await ensureFile(filePath);
};

export const ensureMigrationsState = async (path: string) => {
    const filePath = format({
        dir: path,
        base: MIGRATIONS_STATE_FILE,
    });
    await ensureFile(filePath);
};

export const getOrDefaultMigrationsManifest = async (path: string) => {
    const filePath = format({ dir: path, base: MIGRATIONS_MANIFEST_FILE });

    try {
        return JSON.parse(await Deno.readTextFile(filePath));
    } catch (_) {
        await Deno.writeTextFile(
            filePath,
            JSON.stringify({
                "migrations": [],
            }),
        );

        return JSON.parse(await Deno.readTextFile(filePath));
    }
};

export const getOrDefaultMigrationsState = async (path: string) => {
    const filePath = format({
        dir: path,
        base: MIGRATIONS_STATE_FILE,
    });

    try {
        return JSON.parse(await Deno.readTextFile(filePath));
    } catch (_) {
        await Deno.writeTextFile(
            filePath,
            JSON.stringify({
                "__applied_migrations__": [],
            }),
        );

        return JSON.parse(await Deno.readTextFile(filePath));
    }
};

export const readFile = async (
    filePath: string,
): Promise<any> => {
    return JSON.parse(await Deno.readTextFile(filePath));
};

export const writeFile = async (
    filePath: string,
    obj: any,
) => {
    await Deno.writeTextFile(filePath, JSON.stringify(obj));
};

export const generateMigrationObject = (
    name: string,
    query: string | string[],
): Migration => {
    const bundledQuery = Array.isArray(query) ? query.join("") : query;
    const formattedQuery = bundledQuery
        .replaceAll(
            /(\s)\1+|\n+/g,
            "",
        );
    const formattedName = name.replaceAll(/\s+/g, "_");

    return {
        name: formattedName,
        query: formattedQuery,
    };
};
