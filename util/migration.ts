// util/migration.ts
import { ensureFile } from "@std/fs";
import { format } from "@std/path/format";
import { parse as parseJsonc } from "@std/jsonc";
import type { Migration, MigrationsState } from "./types.ts";
import { MIGRATION_DUPLICATE_ENTRY } from "util";

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
        return parseJsonc(await Deno.readTextFile(filePath)) as MigrationsState;
    } catch (_error) {
        await Deno.writeTextFile(
            filePath,
            STATE_FILE_HEADER +
                JSON.stringify({ "__applied_migrations__": [] }),
        );

        return parseJsonc(await Deno.readTextFile(filePath)) as MigrationsState;
    }
};

const trimFileEnding = (fileName: string, ending: string) =>
    fileName.replaceAll(ending, "");

export const readMigrations = async (migrationsPath: string) => {
    const migrations: Migration[] = [];
    for await (const dirEntry of Deno.readDir(migrationsPath)) {
        const entryName = dirEntry.name;

        if (dirEntry.isFile && entryName.includes(".sql")) {
            const fileContent = await Deno.readTextFile(
                format({ dir: migrationsPath, base: entryName }),
            );
            const trimmedFileName = trimFileEnding(entryName, ".sql");

            if (migrations.some((x) => x.name === trimmedFileName)) {
                const { message, cause } = MIGRATION_DUPLICATE_ENTRY;
                throw Error(`Duplicate \"${trimmedFileName}\". ${message}`, {
                    cause,
                });
            }

            migrations.push(
                generateMigrationObject(trimmedFileName, fileContent),
            );
        }
    }

    return migrations;
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
    // const formattedQuery = bundledQuery
    // .replaceAll(/\r*\n*/g, "");
    // .replaceAll(
    //     /(\s)\1+|\n+\r*/g,
    //     "",
    // );
    const formattedName = name.replaceAll(/\s+/g, "_");

    return {
        name: formattedName,
        query: bundledQuery,
    };
};
