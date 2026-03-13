'use strict';

const db = require('../../data/database');

const createUserRoles = async (userRoles) => {
    if (!Array.isArray(userRoles) || userRoles.length === 0) {
        const err = new Error('userRoles must be a non-empty array');
        err.status = 400;
        throw err;
    }

    await Promise.all(
        userRoles.map(({ userId, roleId }) => {
            if (!userId || !roleId) {
                throw Object.assign(new Error('Each entry requires userId and roleId'), { status: 400 });
            }
            return db.run(
                'INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)',
                [userId, roleId],
            );
        }),
    );
};

const updateUserRoles = async (userRoles) => {
    if (!Array.isArray(userRoles) || userRoles.length === 0) {
        const err = new Error('userRoles must be a non-empty array');
        err.status = 400;
        throw err;
    }

    await Promise.all(
        userRoles.map(({ userId, oldRoleId, newRoleId }) => {
            if (!userId || !oldRoleId || !newRoleId) {
                throw Object.assign(new Error('Each entry requires userId, oldRoleId, newRoleId'), { status: 400 });
            }
            return db.run(
                'UPDATE user_roles SET role_id = ? WHERE user_id = ? AND role_id = ?',
                [newRoleId, userId, oldRoleId],
            );
        }),
    );
};

const deleteUserRoles = async (userRoles) => {
    if (!Array.isArray(userRoles) || userRoles.length === 0) {
        const err = new Error('userRoles must be a non-empty array');
        err.status = 400;
        throw err;
    }

    await Promise.all(
        userRoles.map(({ userId, roleId }) => {
            if (!userId || !roleId) {
                throw Object.assign(new Error('Each entry requires userId and roleId'), { status: 400 });
            }
            return db.run(
                'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?',
                [userId, roleId],
            );
        }),
    );
};

const readUserRoles = async () => {
    return db.all(`
        SELECT ur.user_id, u.email, ur.role_id, r.role_name, ur.assigned_at
        FROM user_roles ur
        JOIN users u ON ur.user_id = u.user_id
        JOIN roles r ON ur.role_id = r.role_id
        ORDER BY u.email, r.role_name
    `);
};

const readUserRole = async (userId, roleId) => {
    return db.get(
        `SELECT ur.user_id, u.email, ur.role_id, r.role_name, ur.assigned_at
         FROM user_roles ur
         JOIN users u ON ur.user_id = u.user_id
         JOIN roles r ON ur.role_id = r.role_id
         WHERE ur.user_id = ? AND ur.role_id = ?`,
        [userId, roleId],
    );
};

module.exports = {
    createUserRoles,
    updateUserRoles,
    deleteUserRoles,
    readUserRoles,
    readUserRole,
};
