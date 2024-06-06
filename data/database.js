const sqlite3 = require('sqlite3').verbose();
const DBSource = require('./systemDB.db');
const { queries, table_list } = require('./quries.js');

// SQLite database initialization
const db = new sqlite3.Database(DBSource, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to SQLite Database');
        // Loop through table_list to check if tables exist
        for (let table of table_list) {
            let check_query = `SELECT EXISTS (SELECT name FROM sqlite_master WHERE type='table' AND name='${table}') AS result`;
            db.get(check_query, [], (err, row) => {
                if (err) {
                    console.error(err.message);
                } else {
                    if (row.result === 1) {
                        console.log(`Table '${table}' already exists`);
                    } else {
                        console.log(`Table '${table}' does not exist`);
                        // Run the creation query for this table
                        // Note: You need to have corresponding creation queries for each table in queries array
                        let index = table_list.indexOf(table);
                        if (index !== -1 && queries[index]) {
                            db.run(queries[index], (err) => {
                                if (err) {
                                    console.error(`Error creating table '${table}': ${err.message}`);
                                } else {
                                    console.log(`Table '${table}' created successfully`);
                                }
                            });
                        } else {
                            console.error(`No creation query found for table '${table}'`);
                        }
                    }
                }
            });
        }
    }
});

module.exports = db;