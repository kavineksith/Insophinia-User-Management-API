const db = require('../../data/database.js');

const createUser = async (userData) => {
    try {
        const { firstName, lastName, emailAddress, hashedPassword, contactNumber, country } = userData;
        const query = `INSERT INTO users (firstName, lastName, emailAddress, password, contactNumber, country) VALUES (?, ?, ?, ?, ?, ?)`;
        const params = [firstName, lastName, emailAddress, hashedPassword, contactNumber, country];
        await db.run(query, params);
    } catch (error) {
        throw new Error('Error creating user:', error);
    }
};

const readUsers = async () => {
    try {
        const query = `SELECT * FROM users`;
        return await db.all(query);
    } catch (error) {
        throw new Error('Error getting users:', error);
    }
};

const readUser = async (userId) => {
    try {
        const query = `SELECT * FROM users WHERE UserID = ?`;
        const params = [userId];
        return await db.get(query, params);
    } catch (error) {
        throw new Error('Error getting user:', error);
    }
};

const updateUser = async (userId, userData) => {
    try {
        const { firstName, lastName, emailAddress, hashedPassword, contactNumber, country } = userData;
        const query = `UPDATE users SET firstName = ?, lastName = ?, emailAddress = ?, password = ?, contactNumber = ?, country = ? WHERE UserID = ?`;
        const params = [firstName, lastName, emailAddress, hashedPassword, contactNumber, country, userId];
        await db.run(query, params);
    } catch (error) {
        throw new Error('Error updating user:', error);
    }
};

const deleteUser = async (userId) => {
    try {
        const query = `DELETE FROM users WHERE UserID = ?`;
        const params = [userId];
        await db.run(query, params);
    } catch (error) {
        throw new Error('Error deleting user:', error);
    }
};

module.exports = {
    createUser,
    readUsers,
    readUser,
    updateUser,
    deleteUser
};
