// migrator.ts
/**
 * Migrator for sqlite_server
 * ---
 * Sets up and runs migrations
 *  - runs inline js migrations and keeps state of applied migrations
 *  - leveraging the Connector class for signing the token and making the request to the server
 */
import {
    ensureMigrationsState,
    generateMigrationObject,
    getOrDefaultMigrationsState,
    getStateFilePath,
    writeMigrationsState,
} from "util";
import { Connector } from "./connector.ts";
import { type Migration, Sub } from "./util/types.ts";
import { requestCallSymbol } from "./util/symbols.ts";
import { format } from "@std/path/format";

export class Migrator {
    private migrationsPath: string;
    private appliedMigrations: string[];
    private migrations: Migration[] = [];

    private constructor(migrationsPath: string, appliedMigrations: string[]) {
        this.migrationsPath = migrationsPath;
        this.appliedMigrations = appliedMigrations;
    }

    static async init(
        migrationsPath: string,
    ): Promise<Migrator> {
        if (!migrationsPath) {
            throw Error(
                'migrationsPath must be set, example: Migratator.init("./migrations");',
                { cause: "migrationsPath not set" },
            );
        }

        await ensureMigrationsState(migrationsPath);

        const { __applied_migrations__: appliedMigrations } =
            await getOrDefaultMigrationsState(
                migrationsPath,
            );

        return new Migrator(
            migrationsPath,
            appliedMigrations,
        );
    }

    migration(
        name: string,
        query: string | string[],
    ) {
        const migration = generateMigrationObject(
            name,
            query,
        );

        if (
            this.migrations.some(({ name }: Migration) =>
                migration.name === name
            )
        ) {
            throw Error(
                'Migration name must be unique! EXAMPLE: "202411291040__migration_name"',
                { cause: "Duplicate entry!" },
            );
        }
        if (
            !this.appliedMigrations.some((item: string) =>
                migration.name === item
            )
        ) {
            this.migrations.push(migration);
        }

        return this;
    }

    async run(connector: Connector) {
        try {
            if (this.migrations.length > 0) {
                const response = await connector[requestCallSymbol](
                    Sub.MIGRATE,
                    {
                        migrations: this.migrations,
                    },
                    { pathParam: "/m" },
                );

                if (response.data === true) {
                    console.log(`
                        Successfully applied migrations!
                        ${this.migrations}
                    `);

                    const latestAppliedMigrations = this.migrations.map((
                        { name }: Migration,
                    ) => name);

                    try {
                        await writeMigrationsState(
                            getStateFilePath(this.migrationsPath),
                            {
                                __applied_migrations__: [
                                    ...this.appliedMigrations,
                                    ...latestAppliedMigrations,
                                ],
                            },
                        );
                    } catch (_error) {
                        console.error(
                            `Could not write to applied migrations file!\nMake sure to add the migrations to the list of applied migrations manually!\n==============================\n${latestAppliedMigrations}\n\n==============================`,
                        );
                    }
                }
            } else {
                console.log("No migrations to run");
            }
        } catch (error) {
            console.error(error);
        }
    }
}

const conn = await Connector.init("http://localhost:8080", {
    database: "helloworld",
    username: "rikard",
    password: "123",
});
const withMigrations = (m: Migrator) => {
    return m
        .migration("somegoodpracticenumbering doing this thing", "INSER DOG")
        .migration(
            "somegoodpracticenumbering doing this thing",
            "CREATE TABLE users (test TEXT NOT NULL UNIQUE);ALTER TABLE users ADD COLUMN dog TEXT;",
        )
        .migration(
            "some other thing",
            [
                `
                CREATE TABLE users2 (
                    test TEXT NOT NULL UNIQUE
                );
                `,
                "ALTER TABLE users2 ADD COLUMN giga_dog TEXT;",
            ],
        );
};
const migrator = withMigrations(await Migrator.init("./migrations"));
/**
 * EXAMPLE USAGE
 *
await migrator.run(conn);
 */
