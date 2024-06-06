const db = require('../../data/database.js');

const createRolePermissions = async (rolePermissions) => {
    try {
        const insertQuery = `INSERT INTO roles_permissions (role_id, permission_id) VALUES (?, ?)`;
        rolePermissions.forEach(async (rolePermission) => {
            const { roleId, permissionId } = rolePermission;
            await db.run(insertQuery, [roleId, permissionId]);
        });
    } catch (error) {
        throw new Error('Error creating role permissions:', error);
    }
};

const updateRolePermissions = async (rolePermissions) => {
    try {
        const updateQuery = `UPDATE roles_permissions SET permission_id = ? WHERE role_id = ?`;
        rolePermissions.forEach(async (rolePermission) => {
            const { roleId, newPermissionId } = rolePermission;
            await db.run(updateQuery, [newPermissionId, roleId]);
        });
    } catch (error) {
        throw new Error('Error updating role permissions:', error);
    }
};

const deleteRolePermissions = async (rolePermissions) => {
    try {
        const deleteQuery = `DELETE FROM roles_permissions WHERE role_id = ? AND permission_id = ?`;
        rolePermissions.forEach(async (rolePermission) => {
            const { roleId, permissionId } = rolePermission;
            await db.run(deleteQuery, [roleId, permissionId]);
        });
    } catch (error) {
        throw new Error('Error deleting role permissions:', error);
    }
};

const readRolePermissions = async () => {
    try {
        const query = `SELECT * FROM roles_permissions`;
        return await db.all(query);
    } catch (error) {
        throw new Error('Error getting role permissions:', error);
    }
};

const readRolePermission = async (roleId, permissionId) => {
    try {
        const query = `SELECT * FROM roles_permissions WHERE role_id = ? AND permission_id = ?`;
        const params = [roleId, permissionId];
        return await db.all(query, params);
    } catch (error) {
        throw new Error('Error getting role permission:', error);
    }
};

module.exports = {
    createRolePermissions,
    updateRolePermissions,
    deleteRolePermissions,
    readRolePermissions,
    readRolePermission
};
