export const MIGRATION_STATE_WRITE_ERROR =
    "Could not write to migrations state file!\nMake sure to add the migration to the list of applied migrations manually!";
export const MIGRATIONS_PATH_NOT_SET = {
    message:
        'migrationsPath must be set, example: Migratator.init("./migrations");',
    cause: "Path to migrations folder not set",
};
export const MIGRATION_DUPLICATE_ENTRY = {
    message:
        'Migration name must be unique! EXAMPLE: "202411291040__migration_name"',
    cause: "Duplicate entry",
};
export const MIGRATION_APPLIED = "Successfully applied migration!";
export const MIGRATION_FAILED = "Failed to apply migration!";
export const MIGRATIONS_NO_MIGRATIONS = "No migrations to run";
