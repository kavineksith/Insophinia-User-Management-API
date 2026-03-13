'use strict';

const {
    createUserRoles,
    updateUserRoles,
    deleteUserRoles,
    readUserRoles,
    readUserRole,
} = require('../../models/admin/userRoleModel');
const { auditLog } = require('../../middleware/eventLogger');

const createUserRolesController = async (req, res, next) => {
    try {
        const { userRoles } = req.body;
        await createUserRoles(userRoles);
        auditLog('USER_ROLES_CREATED', { byAdmin: req.user.id, count: userRoles.length });
        return res.status(201).json({ message: 'User roles created successfully' });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        next(err);
    }
};

const updateUserRolesController = async (req, res, next) => {
    try {
        const { userRoles } = req.body;
        await updateUserRoles(userRoles);
        auditLog('USER_ROLES_UPDATED', { byAdmin: req.user.id });
        return res.status(200).json({ message: 'User roles updated successfully' });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        next(err);
    }
};

const deleteUserRolesController = async (req, res, next) => {
    try {
        const { userRoles } = req.body;
        await deleteUserRoles(userRoles);
        auditLog('USER_ROLES_DELETED', { byAdmin: req.user.id });
        return res.status(200).json({ message: 'User roles deleted successfully' });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        next(err);
    }
};

const readUserRolesController = async (req, res, next) => {
    try {
        const data = await readUserRoles();
        return res.status(200).json(data);
    } catch (err) {
        next(err);
    }
};

const readUserRoleController = async (req, res, next) => {
    try {
        const { user_id, role_id } = req.params;
        const data = await readUserRole(parseInt(user_id, 10), parseInt(role_id, 10));
        if (!data) return res.status(404).json({ error: 'User role not found' });
        return res.status(200).json(data);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createUserRolesController,
    updateUserRolesController,
    deleteUserRolesController,
    readUserRolesController,
    readUserRoleController,
};
