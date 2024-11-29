### ideas
- use user defined migrations folder
- creating a migrator requires implementor to supply the folder themselves
- migration folder will contain .sql files that will be read and parsed, or contain JSON files
- migrator will use this folder to write to in order to keep track of migrations
- naming is numeric and should possibly just be the date and or timestamp
- drop support for programmatic values in mutation queries
- migrator just has to read the files in migrations folder, only add file contents of migrations that still havent been tracked by "applied_migrations.json" file or some other file tracking last applied migration and make a bundled request to migrate endpoint

