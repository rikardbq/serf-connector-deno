### sqlite_server_connector

This is a database driver that handles querying, mutating and migrations for [sqlite_server](https://github.com/rikardbq/sqlite_server)

### usage

```typescript
// connector usage
// ---------------

const connection = await Connector.init("http://localhost:8080", {
    database: "test_db",
    username: "test_user",
    password: "test_pass",
});

await connection.mutate(
    "CREATE TABLE IF NOT EXISTS testing_table (id INTEGER PRIMARY KEY NOT NULL,im_data TEXT);"
);
await connection.mutate(
    "INSERT INTO testing_table(im_data) VALUES (?);",
    "Some data in here hellooooooo"
);

const data = await connection.query("SELECT * FROM testing_table WHERE im_data = ? AND id = ?;", "Some data in here hellooooooo", 1);

console.log(data);
```

---

```typescript
// migrator usage
// --------------
// migrations are unique by name, this may change in the future with a checksum of the entire migration.
// future changes may also include parsing .sql files to avoid inline JS checksum changing if formatting changes the JS indentation or something similar.

const conn = await Connector.init("http://localhost:8080", {
    database: "test_db",
    username: "test_user",
    password: "test_pass",
});

const withMigrations = (m: Migrator) => {
    return m
        .migration(
            "create_table",
            "CREATE TABLE IF NOT EXISTS testing_table (id INTEGER PRIMARY KEY NOT NULL,im_data TEXT);"
        )
        .migration(
            "first one",
            "INSERT INTO testing_table(im_data) VALUES('hello data world');",
        )
        .migration(
            "the second one",
            [
                "ALTER TABLE testing_table ADD COLUMN im_data_too TEXT;",
                "INSERT INTO testing_table(im_data, im_data_too) VALUES('IM DATA','IM DATA TOO');",
            ],
        )
        .migration(
            "the third one",
            `
            ALTER TABLE testing_table ADD COLUMN im_data_also TEXT;
            INSERT INTO testing_table(im_data, im_data_too, im_data_also) VALUES('ello m8','data 123','dataaaaaa');
            `,
        )
        .migration(
            "mambo number 4",
            "INSERT INTO testing_table(im_data, im_data_too, im_data_also) VALUES('test', 'test_too', 'test_also');"
        );
};

// supplied migrations path, this is where the state tracker file lives and also (in the future) .sql files
const migrator = withMigrations(
    await Migrator.init("./migrations")
);

await migrator.run(conn);

console.log(
    await conn.query("SELECT * FROM testing_table;"),
    await conn.query("SELECT * FROM __migrations_tracker_t__"),
);
```