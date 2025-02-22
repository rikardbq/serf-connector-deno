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
    MIGRATION_APPLIED,
    MIGRATION_DUPLICATE_ENTRY,
    MIGRATION_FAILED,
    MIGRATION_STATE_WRITE_ERROR,
    MIGRATIONS_NO_MIGRATIONS,
    MIGRATIONS_PATH_NOT_SET,
    writeMigrationsState,
} from "util";
import Connector from "./connector.ts";
import { type Migration, type MigrationRes, Sub } from "./util/types.ts";
import { requestCallSymbol } from "./util/symbols.ts";

export default class Migrator {
    private migrationsPath: string;
    private appliedMigrations: string[];
    private migrations: Migration[] = [];

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
     * @param {string} name
     * @param {string | string[]} query
     * @returns {Migrator} self instance
     */
    migration(name: string, query: string | string[]) {
        const migration = generateMigrationObject(name, query);

        if (
            this.migrations.some(
                ({ name }: Migration) => migration.name === name,
            )
        ) {
            const { message, cause } = MIGRATION_DUPLICATE_ENTRY;
            throw Error(`Duplicate \"${migration.name}\". ${message}`, {
                cause,
            });
        }

        this.migrations.push(migration);

        return this;
    }

    /**
     * @param {Connector} connector
     * @param {string[]} appliedMigrations
     * @param {Migration[]} migrations
     *
     * recursively run self until un-applied migrations are applied resulting in below
     * @returns {Promise<void>} empty promise
     */
    private async apply(
        connector: Connector,
        appliedMigrations: string[],
        migrations: Migration[],
    ): Promise<void> {
        if (migrations.length === 0) {
            return;
        }

        const [migrationToApply, ...restMigrations] = migrations;
        const response = await connector[requestCallSymbol](
            Sub.MIGRATE,
            migrationToApply,
            { pathParam: "/m" },
        );
        const data = response?.data as MigrationRes;

        if (data?.state === true) {
            console.info(MIGRATION_APPLIED);
            console.table(migrationToApply);

            const stateFilePath = getStateFilePath(this.migrationsPath);
            const appliedMigrationsState = [
                ...appliedMigrations,
                migrationToApply.name,
            ];
            try {
                await writeMigrationsState(
                    stateFilePath,
                    appliedMigrationsState,
                );

                return await this.apply(
                    connector,
                    appliedMigrationsState,
                    restMigrations,
                );
            } catch (_error) {
                console.error(MIGRATION_STATE_WRITE_ERROR);
                console.error(
                    `------------\n${stateFilePath}\n------------\n${
                        JSON.stringify(
                            migrationToApply.name,
                        )
                    }`,
                );
            }
        } else {
            console.error(MIGRATION_FAILED);
            console.table(migrationToApply);
            throw Error(MIGRATION_FAILED);
        }
    }

    /**
     * @param {Connector} connector
     * @returns {Promise<void>}
     */
    async run(connector: Connector): Promise<void> {
        try {
            const migrationsToApply = this.migrations.filter(
                ({ name }: Migration) => !this.appliedMigrations.includes(name),
            );

            if (migrationsToApply.length > 0) {
                await this.apply(
                    connector,
                    this.appliedMigrations,
                    migrationsToApply,
                );
            } else {
                console.info(MIGRATIONS_NO_MIGRATIONS);
            }
        } catch (error) {
            console.error(error);
        }
    }
}
