const { createUserRoles, updateUserRoles, deleteUserRoles, readUserRoles, readUserRole } = require('../../models/admin/userRoleModel.js');
const { rateLimitMethod } = require('../../middleware/ratelimiter.js');
const { authenticateToken } = require('../../middleware/tokenManage.js');
const { isAdmin } = require('../../middleware/adminVerifer.js');

const createUserRolesController = async (req, res) => {
    authenticateToken(req, res, () => {
        rateLimitMethod(req, res, () => {
            isAdmin(req, res, async () => {
                const userRoles = req.body.userRoles;
                try {
                    await createUserRoles(userRoles);
                    res.status(201).send('User roles created successfully');
                } catch (error) {
                    console.error('Error creating user roles:', error);
                    res.status(500).json({ error: 'Internal Server Error' });
                }
            });
        });
    });
};

const updateUserRolesController = async (req, res) => {
    authenticateToken(req, res, () => {
        rateLimitMethod(req, res, () => {
            isAdmin(req, res, async () => {
                const userRoles = req.body.userRoles;
                try {
                    await updateUserRoles(userRoles);
                    res.status(200).send('User roles updated successfully');
                } catch (error) {
                    console.error('Error updating user roles:', error);
                    res.status(500).json({ error: 'Internal Server Error' });
                }
            });
        });
    });
};

const deleteUserRolesController = async (req, res) => {
    authenticateToken(req, res, () => {
        rateLimitMethod(req, res, () => {
            isAdmin(req, res, async () => {
                const userRoles = req.body.userRoles;
                try {
                    await deleteUserRoles(userRoles);
                    res.status(200).send('User roles deleted successfully');
                } catch (error) {
                    console.error('Error deleting user roles:', error);
                    res.status(500).json({ error: 'Internal Server Error' });
                }
            });
        });
    });
};

const readUserRolesController = async (req, res) => {
    authenticateToken(req, res, () => {
        rateLimitMethod(req, res, () => {
            isAdmin(req, res, async () => {
                try {
                    const userRoles = await readUserRoles();
                    res.status(200).json(userRoles);
                } catch (error) {
                    console.error('Error getting user roles:', error);
                    res.status(500).json({ error: 'Internal Server Error' });
                }
            });
        });
    });
};

const readUserRoleController = async (req, res) => {
    authenticateToken(req, res, () => {
        rateLimitMethod(req, res, () => {
            isAdmin(req, res, async () => {
                const { user_id, role_id } = req.params;
                try {
                    const userRole = await readUserRole(user_id, role_id);
                    if (!userRole) {
                        return res.status(404).json({ error: 'User role not found' });
                    }
                    res.status(200).json(userRole);
                } catch (error) {
                    console.error('Error getting user role:', error);
                    res.status(500).json({ error: 'Internal Server Error' });
                }
            });
        });
    });
};

module.exports = {
    createUserRolesController,
    updateUserRolesController,
    deleteUserRolesController,
    readUserRolesController,
    readUserRoleController
};
