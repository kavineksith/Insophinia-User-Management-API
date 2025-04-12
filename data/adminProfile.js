const db = require('./database.js');

const query = ``;
const values = [];

db.run(query, values, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Admin Profile Created Sucessfully...!!');
    }
});


// Create users table
db.serialize(() => {
    db.run("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, role TEXT, apiKey TEXT, secretKey TEXT)");
    // Create admin user (for demonstration purposes)
    const adminUsername = 'admin';
    const adminPassword = 'adminpassword';
    const adminRole = 'admin';
    const { apiKey, secretKey } = generateAPIKeys();
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);
    db.run("INSERT INTO users (username, password, role, apiKey, secretKey) VALUES (?, ?, ?, ?, ?)", [adminUsername, hashedPassword, adminRole, apiKey, secretKey]);
});