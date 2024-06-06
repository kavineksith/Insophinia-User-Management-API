const db = require('../../data/database.js');

const getUserByEmailAndPassword = (email, password, callback) => {
    const query = `SELECT UserID, emailAddress FROM users WHERE emailAddress = ? AND password = ?`;
    db.get(query, [email, password], callback);
};

module.exports = { getUserByEmailAndPassword };
