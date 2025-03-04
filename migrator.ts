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
    getOrDefaultMigrationsState,
    getStateFilePath,
    MIGRATION_APPLIED,
    MIGRATION_FAILED,
    MIGRATION_STATE_WRITE_ERROR,
    MIGRATIONS_NO_MIGRATIONS,
    MIGRATIONS_PATH_NOT_SET,
    readMigrations,
    writeMigrationsState,
} from "util";
import Connector from "./connector.ts";
import { type Migration, type MigrationResponse, Sub } from "./util/types.ts";
import { requestCallSymbol } from "./util/symbols.ts";

export default class Migrator {
    private migrationsPath: string;
    private appliedMigrations: string[];

    private constructor(migrationsPath: string, appliedMigrations: string[]) {
        this.migrationsPath = migrationsPath;
        this.appliedMigrations = appliedMigrations;
    }

    /**
     * @param {string} migrationsPath
     * @returns {Promise<Migrator>} Promise containing new instance of Migrator
     */
    static async init(migrationsPath: string): Promise<Migrator> {
        if (!migrationsPath) {
            const { message, cause } = MIGRATIONS_PATH_NOT_SET;
            throw Error(message, { cause });
        }

        await ensureMigrationsState(migrationsPath);

        const { __applied_migrations__: appliedMigrations } =
            await getOrDefaultMigrationsState(migrationsPath);

        return new Migrator(migrationsPath, appliedMigrations);
    }

    /**
     * @returns {Promise<Migration[]>} awaitable array of Migration objects
     */
    private async prepareMigrations() {
        return (await readMigrations(this.migrationsPath)).filter(
            (x) => !this.appliedMigrations.includes(x.name),
        );
    }

    /**
     * @param {Connector} connector
     * @param {Migration} migration
     *
     * @returns {Promise<MigrationResponse>} MigrationResponse promise
     */
    private async apply(
        connector: Connector,
        migration: Migration,
    ): Promise<MigrationResponse> {
        const response = await connector[requestCallSymbol](
            Sub.MIGRATE,
            migration,
            { pathParam: "/m" },
        ) as MigrationResponse;

        if (!response?.state) {
            console.error(MIGRATION_FAILED);
            console.table(migration);

            throw Error(MIGRATION_FAILED);
        }

        console.info(MIGRATION_APPLIED);
        console.table(migration);

        const stateFilePath = getStateFilePath(this.migrationsPath);
        this.appliedMigrations = [
            ...this.appliedMigrations,
            migration.name,
        ];

        try {
            await writeMigrationsState(
                stateFilePath,
                this.appliedMigrations,
            );
        } catch (_error) {
            console.error(MIGRATION_STATE_WRITE_ERROR);
            console.error(
                `------------\n${stateFilePath}\n------------\n${
                    JSON.stringify(
                        migration.name,
                    )
                }`,
            );
        }

        return response;
    }

    /**
     * @param {Connector} connector
     * @returns {Promise<void>}
     */
    async run(connector: Connector): Promise<void> {
        try {
            const migrationsToApply = await this.prepareMigrations();

            if (migrationsToApply.length > 0) {
                for (const migration of migrationsToApply) {
                    await this.apply(
                        connector,
                        migration,
                    );
                }
            } else {
                console.info(MIGRATIONS_NO_MIGRATIONS);
            }
        } catch (error) {
            console.error(error);
        }
    }
}
