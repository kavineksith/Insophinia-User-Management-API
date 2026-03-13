'use strict';

const {
    createRolePermissions,
    updateRolePermissions,
    deleteRolePermissions,
    readRolePermissions,
    readRolePermission,
} = require('../../models/admin/rolePermissionModel');
const { auditLog } = require('../../middleware/eventLogger');

const createRolePermissionsController = async (req, res, next) => {
    try {
        const { rolePermissions } = req.body;
        await createRolePermissions(rolePermissions);
        auditLog('ROLE_PERMISSIONS_CREATED', { byAdmin: req.user.id, count: rolePermissions.length });
        return res.status(201).json({ message: 'Role permissions created successfully' });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        next(err);
    }
};

const updateRolePermissionsController = async (req, res, next) => {
    try {
        const { rolePermissions } = req.body;
        await updateRolePermissions(rolePermissions);
        auditLog('ROLE_PERMISSIONS_UPDATED', { byAdmin: req.user.id });
        return res.status(200).json({ message: 'Role permissions updated successfully' });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        next(err);
    }
};

const deleteRolePermissionsController = async (req, res, next) => {
    try {
        const { rolePermissions } = req.body;
        await deleteRolePermissions(rolePermissions);
        auditLog('ROLE_PERMISSIONS_DELETED', { byAdmin: req.user.id });
        return res.status(200).json({ message: 'Role permissions deleted successfully' });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        next(err);
    }
};

const readRolePermissionsController = async (req, res, next) => {
    try {
        const data = await readRolePermissions();
        return res.status(200).json(data);
    } catch (err) {
        next(err);
    }
};

const readRolePermissionController = async (req, res, next) => {
    try {
        const { role_id, permission_id } = req.params;
        const data = await readRolePermission(parseInt(role_id, 10), parseInt(permission_id, 10));
        if (!data) return res.status(404).json({ error: 'Role permission not found' });
        return res.status(200).json(data);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createRolePermissionsController,
    updateRolePermissionsController,
    deleteRolePermissionsController,
    readRolePermissionsController,
    readRolePermissionController,
};
