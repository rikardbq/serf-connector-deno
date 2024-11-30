// util/migration.ts
import { ensureFile } from "@std/fs";
import { format } from "@std/path/format";
import { parse as parseJsonc } from "@std/jsonc";
import type { Migration, MigrationsState } from "./types.ts";

export const STATE_FILE = "__$gen.serf.state.migrations__";
const STATE_FILE_HEADER =
    `/* ${STATE_FILE} */\n/**\n* THIS FILE IS GENERATED!\n* ------\n* Changing this file may lead to inconsistent state \n* between your application migrations and your database!\n**/\n`;

export const getStateFilePath = (path: string) =>
    format({
        dir: path,
        base: STATE_FILE + ".jsonc",
    });

export const ensureMigrationsState = async (path: string) => {
    await ensureFile(getStateFilePath(path));
};

export const getOrDefaultMigrationsState = async (
    path: string,
): Promise<MigrationsState> => {
    const filePath = getStateFilePath(path);

    try {
        return parseJsonc(await Deno.readTextFile(filePath));
    } catch (_error) {
        await Deno.writeTextFile(
            filePath,
            STATE_FILE_HEADER +
                JSON.stringify({ "__applied_migrations__": [] }),
        );

        return parseJsonc(await Deno.readTextFile(filePath));
    }
};

export const writeMigrationsState = async (
    filePath: string,
    migrations: string[],
) => {
    await Deno.writeTextFile(
        filePath,
        STATE_FILE_HEADER +
            JSON.stringify({ "__applied_migrations__": migrations }),
    );
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
