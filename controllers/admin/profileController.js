'use strict';

const { createUser, readUsers, readUser, updateUser, deleteUser } = require('../../models/admin/userProfileModel');
const { hashPassword } = require('../../middleware/hashPassword');
const { auditLog }     = require('../../middleware/eventLogger');

/**
 * Middleware chain is handled in the ROUTE layer, not here.
 * Each controller is a clean async function: parse → validate → model → respond.
 */

const createUserController = async (req, res, next) => {
    try {
        const { firstName, lastName, emailAddress, password, contactNumber, country } = req.body;
        const passwordHash = await hashPassword(password);

        const userId = await createUser({ firstName, lastName, emailAddress, passwordHash, contactNumber, country });

        auditLog('USER_CREATED', { byAdmin: req.user.id, newUserId: userId, email: emailAddress });

        return res.status(201).json({ message: 'User created successfully', userId });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        next(err);
    }
};

const readUsersController = async (req, res, next) => {
    try {
        const users = await readUsers();
        // Pagination support (optional query params: ?page=1&limit=20)
        const page  = Math.max(1, parseInt(req.query.page  || '1',  10));
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
        const start = (page - 1) * limit;

        return res.status(200).json({
            data  : users.slice(start, start + limit),
            total : users.length,
            page,
            limit,
        });
    } catch (err) {
        next(err);
    }
};

const readUserController = async (req, res, next) => {
    try {
        const user = await readUser(parseInt(req.params.id, 10));
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.status(200).json(user);
    } catch (err) {
        next(err);
    }
};

const updateUserController = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.id, 10);
        const { firstName, lastName, emailAddress, password, contactNumber, country, isActive } = req.body;

        const updates = { firstName, lastName, emailAddress, contactNumber, country, isActive };
        if (password) updates.passwordHash = await hashPassword(password);

        await updateUser(userId, updates);

        auditLog('USER_UPDATED', { byAdmin: req.user.id, targetUserId: userId });

        return res.status(200).json({ message: 'User updated successfully' });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        next(err);
    }
};

const deleteUserController = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.id, 10);

        // Prevent admin from deleting themselves
        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        await deleteUser(userId);

        auditLog('USER_DELETED', { byAdmin: req.user.id, deletedUserId: userId });

        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ error: err.message });
        next(err);
    }
};

module.exports = {
    createUserController,
    readUsersController,
    readUserController,
    updateUserController,
    deleteUserController,
};
