const db = require('../../data/database.js');

const createUserRoles = async (userRoles) => {
    try {
        const insertQuery = `INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`;
        userRoles.forEach(async (userRole) => {
            const { userId, roleId } = userRole;
            await db.run(insertQuery, [userId, roleId]);
        });
    } catch (error) {
        throw new Error('Error creating user roles:', error);
    }
};

const updateUserRoles = async (userRoles) => {
    try {
        const updateQuery = `UPDATE user_roles SET role_id = ? WHERE user_id = ?`;
        userRoles.forEach(async (userRole) => {
            const { userId, newRoleId } = userRole;
            await db.run(updateQuery, [newRoleId, userId]);
        });
    } catch (error) {
        throw new Error('Error updating user roles:', error);
    }
};

const deleteUserRoles = async (userRoles) => {
    try {
        const deleteQuery = `DELETE FROM user_roles WHERE user_id = ? AND role_id = ?`;
        userRoles.forEach(async (userRole) => {
            const { userId, roleId } = userRole;
            await db.run(deleteQuery, [userId, roleId]);
        });
    } catch (error) {
        throw new Error('Error deleting user roles:', error);
    }
};

const readUserRoles = async () => {
    try {
        const query = `SELECT * FROM user_roles`;
        return await db.all(query);
    } catch (error) {
        throw new Error('Error getting user roles:', error);
    }
};

const readUserRole = async (userId, roleId) => {
    try {
        const query = `SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?`;
        const params = [userId, roleId];
        return await db.all(query, params);
    } catch (error) {
        throw new Error('Error getting user role:', error);
    }
};

module.exports = {
    createUserRoles,
    updateUserRoles,
    deleteUserRoles,
    readUserRoles,
    readUserRole
};
