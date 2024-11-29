//test.ts

const database = "../something/ÄÄääaaa'''";
const database_lc = database.toLowerCase();
const pattern = /[^a-z0-9_-]+/g;

if (pattern.test(database_lc)) {
    throw new Error(
        "Database name may only contain characters from these patterns: [a-z, 0-9, _-]",
    );
}

const database_formatted = database_lc.replaceAll(pattern, "");

console.log(database_formatted);
