import { Connector, Migrator } from "./main.ts";

// const conn = await Connector.init("http://localhost:8080", {
//     database: "test666",
//     username: "test_user",
//     password: "test_pass",
// });

// const withMigrations = (m: Migrator) => {
//     return m
//         .migration(
//             "create_table",
//             "CREATE TABLE IF NOT EXISTS testing_table (id INTEGER PRIMARY KEY NOT NULL,im_data TEXT);"
//         )
//         .migration(
//             "first one",
//             "INSERT INTO testing_table(im_data) VALUES('hello data world');",
//         )
//         .migration(
//             "the second one",
//             [
//                 "ALTER TABLE testing_table ADD COLUMN im_data_too TEXT;",
//                 "INSERT INTO testing_table(im_data, im_data_too) VALUES('IM DATA','IM DATA TOO');",
//             ],
//         )
//         .migration(
//             "the third one",
//             `
//             ALTER TABLE testing_table ADD COLUMN im_data_also TEXT;
//             INSERT INTO testing_table(im_data, im_data_too, im_data_also) VALUES('ello m8','data 123','dataaaaaa');
//             `,
//         )
//         .migration(
//             "mambo number 4",
//             "INSERT INTO testing_table(im_data, im_data_too, im_data_also) VALUES('test', 'test_too', 'test_also');"
//         );
// };

// // supplied migrations path, this is where the state tracker file lives and also (in the future) .sql files
// const migrator = withMigrations(
//     await Migrator.init("./migrations")
// );
// await migrator.run(conn);

// console.log(
//     await conn.query("SELECT * FROM testing_table;"),
//     await conn.query("SELECT * FROM __migrations_tracker_t__"),
// );

const connection = await Connector.init("http://localhost:8080", {
    database: "test666",
    username: "test_user",
    password: "test_pass",
});

// const withMigration = (m: Migrator) =>
//     m.migration(
//         "a77_test",
//         "ALTER TABLE testing_table ADD COLUMN eighty_hd77 TEXT;",
//     ).migration(
//         "a88_test",
//         "ALTER TABLE testing_table ADD COLUMN eighty_hd88 TEXT;",
//     );
// const migrator = withMigration(await Migrator.init("./migrations"));
// migrator.run(connection);

// migrator.migration(
//     "adhd2 lite",
//     "ALTER TABLE testing_table ADD COLUMN eighty_hd TEXT;",
// );

// await connection.mutate(
//     "CREATE TABLE IF NOT EXISTS testing_table (id INTEGER PRIMARY KEY NOT NULL,im_data TEXT);"
// );
// await connection.mutate(
//     "INSERT INTO testing_table(im_data) VALUES (?);",
//     "Some data in here hellooooooo"
// );

const migrator = await Migrator.init("./migrations");
await migrator.run(connection);

const data = await connection.query("SELECT * FROM testing_table;");
console.log(data);
