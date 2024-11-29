// migrator.ts
import {
    ensureMigrationsState,
    generateMigrationObject,
    getOrDefaultMigrationsState,
    MIGRATIONS_STATE_FILE,
    writeFile,
} from "util";
import { Connector } from "./connector.ts";
import { Sub } from "./util/types.ts";
import { requestCallSymbol } from "./util/symbols.ts";
import { format } from "@std/path/format";

class Migrator {
    private migrationsPath: any;
    private appliedMigrations: any;
    private migrations: any = [];

    private constructor(migrationsPath: string, appliedMigrations: any) {
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
        // await ensureMigrationsManifest(migrationsPath);

        const { __applied_migrations__: appliedMigrations } =
            await getOrDefaultMigrationsState(
                migrationsPath,
            );
        // const migrationsManifest = await getOrDefaultMigrationsManifest(migrationsPath);

        return new Migrator(
            migrationsPath,
            appliedMigrations,
        );
    }

    migration(
        name: string,
        query: string | string[],
    ) {
        const migration = generateMigrationObject(name, query);

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

                    const appliedMigrationsFilePath = format({
                        dir: this.migrationsPath,
                        base: MIGRATIONS_STATE_FILE,
                    });

                    try {
                        await writeFile(appliedMigrationsFilePath, {
                            __applied_migrations__: [
                                ...this.appliedMigrations,
                                ...this.migrations,
                            ],
                        });
                    } catch (_error) {
                        console.error(`
                            Could not write to applied migrations file!
                            Make sure to add the following migrations to the list of applied migrations manually!
                            ==============================
                            
                            ${this.migrations}

                            ==============================
                        `);
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
        .migration(
            "somegoodpracticenumbering doing this thing",
            "ALTER TABLE users ADD COLUMN dog TEXT;",
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

await migrator.run(conn);

// !!! USE inline JS HoF-like pattern
// withMigrations(migrator: Migrator) = function {
//  return migrator
//      .migrate("some unique desc", [
//          "ALTER TABLE BLA BLA;",
//          "ALTER BLALALALALLALALALA;"
//      ])
//      .migrate("some unique desc", [
//          "ALTER TABLE BLA BLA;",
//          "ALTER BLALALALALLALALALA;"
//      ]);
//}

// const a = migrator
//     .addMigration(
//         "this is description",
//         `
//         ALTER TABLE users ADD COLUMN ASDFGH TEXT;
//         INSERT INTO users(name) VALUES(?);
//         INSERT INTO users(ASDFGH) VALUES(?);
//         `,
//         "Olle",
//         "someshitttt",
//     )
//     .addMigration(
//         "this is description2",
//         `
//         ALTER TABLE users ADD COLUMN ASDFGH2 TEXT;
//         INSERT INTO users(name) VALUES(?);
//         INSERT INTO users(ASDFGH2) VALUES(?);
//         `,
//         "Olle2",
//         "someshitttt2",
//     )
//     .addMigration(
//         "this is description3",
//         `
//         ALTER TABLE users ADD COLUMN ASDFGH3 TEXT;
//         INSERT INTO users(name) VALUES(?);
//         INSERT INTO users(ASDFGH3) VALUES(?);
//         `,
//         "Olle3",
//         "someshitttt3",
//     );

// await a.run(conn);
