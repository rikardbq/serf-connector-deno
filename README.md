# ! DEPRECATED !
### The following usage information still holds true but the internals aren't working as intended at this moment.
- **ToDo**: Add Protobuf support. Requires a relatively large rewrite.

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

const conn = await Connector.init("http://localhost:8080", {
    database: "test_db",
    username: "test_user",
    password: "test_pass",
});

// supplied migrations path, this is where the state tracker file lives and also .sql files
const migrator = withMigrations(
    await Migrator.init("./migrations")
);

await migrator.run(conn);

console.log(
    await conn.query("SELECT * FROM testing_table;"),
    await conn.query("SELECT * FROM __migrations_tracker_t__"),
);
```