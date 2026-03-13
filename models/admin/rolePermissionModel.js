'use strict';

const db = require('../../data/database');

/**
 * BUG FIXED: forEach + async swallows all errors and bypasses try/catch.
 * All bulk operations now use Promise.all() which correctly propagates errors.
 */

const createRolePermissions = async (rolePermissions) => {
    // Validate input shape
    if (!Array.isArray(rolePermissions) || rolePermissions.length === 0) {
        const err = new Error('rolePermissions must be a non-empty array');
        err.status = 400;
        throw err;
    }

    await Promise.all(
        rolePermissions.map(({ roleId, permissionId }) => {
            if (!roleId || !permissionId) {
                throw Object.assign(new Error('Each entry requires roleId and permissionId'), { status: 400 });
            }
            return db.run(
                'INSERT OR IGNORE INTO roles_permissions (role_id, permission_id) VALUES (?, ?)',
                [roleId, permissionId],
            );
        }),
    );
};

const updateRolePermissions = async (rolePermissions) => {
    if (!Array.isArray(rolePermissions) || rolePermissions.length === 0) {
        const err = new Error('rolePermissions must be a non-empty array');
        err.status = 400;
        throw err;
    }

    await Promise.all(
        rolePermissions.map(({ roleId, oldPermissionId, newPermissionId }) => {
            if (!roleId || !oldPermissionId || !newPermissionId) {
                throw Object.assign(
                    new Error('Each entry requires roleId, oldPermissionId, newPermissionId'),
                    { status: 400 },
                );
            }
            return db.run(
                `UPDATE roles_permissions SET permission_id = ?
                 WHERE role_id = ? AND permission_id = ?`,
                [newPermissionId, roleId, oldPermissionId],
            );
        }),
    );
};

const deleteRolePermissions = async (rolePermissions) => {
    if (!Array.isArray(rolePermissions) || rolePermissions.length === 0) {
        const err = new Error('rolePermissions must be a non-empty array');
        err.status = 400;
        throw err;
    }

    await Promise.all(
        rolePermissions.map(({ roleId, permissionId }) => {
            if (!roleId || !permissionId) {
                throw Object.assign(new Error('Each entry requires roleId and permissionId'), { status: 400 });
            }
            return db.run(
                'DELETE FROM roles_permissions WHERE role_id = ? AND permission_id = ?',
                [roleId, permissionId],
            );
        }),
    );
};

const readRolePermissions = async () => {
    return db.all(`
        SELECT rp.role_id, r.role_name, rp.permission_id, p.permission_name
        FROM roles_permissions rp
        JOIN roles       r ON rp.role_id       = r.role_id
        JOIN permissions p ON rp.permission_id = p.permission_id
        ORDER BY r.role_name, p.permission_name
    `);
};

const readRolePermission = async (roleId, permissionId) => {
    return db.get(
        `SELECT rp.role_id, r.role_name, rp.permission_id, p.permission_name
         FROM roles_permissions rp
         JOIN roles       r ON rp.role_id       = r.role_id
         JOIN permissions p ON rp.permission_id = p.permission_id
         WHERE rp.role_id = ? AND rp.permission_id = ?`,
        [roleId, permissionId],
    );
};

module.exports = {
    createRolePermissions,
    updateRolePermissions,
    deleteRolePermissions,
    readRolePermissions,
    readRolePermission,
};
