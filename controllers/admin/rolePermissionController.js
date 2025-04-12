const { createRolePermissions, updateRolePermissions, deleteRolePermissions, readRolePermissions, readRolePermission } = require('../../models/admin/rolePermissionModel.js');
const { rateLimitMethod } = require('../../middleware/ratelimiter.js');
const { authenticateToken } = require('../../middleware/tokenManage.js');
const { isAdmin } = require('../../middleware/adminVerifer.js');

const createRolePermissionsController = async (req, res) => {
    authenticateToken(req, res, () => {
        rateLimitMethod(req, res, () => {
            isAdmin(req, res, async () => {
                const rolePermissions = req.body.rolePermissions;
                try {
                    await createRolePermissions(rolePermissions);
                    res.status(201).send('Role permissions created successfully');
                } catch (error) {
                    console.error('Error creating role permissions:', error);
                    res.status(500).json({ error: 'Internal Server Error' });
                }
            });
        });
    });
};

const updateRolePermissionsController = async (req, res) => {
    authenticateToken(req, res, () => {
        rateLimitMethod(req, res, () => {
            isAdmin(req, res, async () => {
                const rolePermissions = req.body.rolePermissions;
                try {
                    await updateRolePermissions(rolePermissions);
                    res.status(200).send('Role permissions updated successfully');
                } catch (error) {
                    console.error('Error updating role permissions:', error);
                    res.status(500).json({ error: 'Internal Server Error' });
                }
            });
        });
    });
};

const deleteRolePermissionsController = async (req, res) => {
    authenticateToken(req, res, () => {
        rateLimitMethod(req, res, () => {
            isAdmin(req, res, async () => {
                const rolePermissions = req.body.rolePermissions;
                try {
                    await deleteRolePermissions(rolePermissions);
                    res.status(200).send('Role permissions deleted successfully');
                } catch (error) {
                    console.error('Error deleting role permissions:', error);
                    res.status(500).json({ error: 'Internal Server Error' });
                }
            });
        });
    });
};

const readRolePermissionsController = async (req, res) => {
    authenticateToken(req, res, () => {
        rateLimitMethod(req, res, () => {
            isAdmin(req, res, async () => {
                try {
                    const rolePermissions = await readRolePermissions();
                    res.status(200).json(rolePermissions);
                } catch (error) {
                    console.error('Error getting role permissions:', error);
                    res.status(500).json({ error: 'Internal Server Error' });
                }
            });
        });
    });
};

const readRolePermissionController = async (req, res) => {
    authenticateToken(req, res, () => {
        rateLimitMethod(req, res, () => {
            isAdmin(req, res, async () => {
                const { role_id, permission_id } = req.params;
                try {
                    const rolePermission = await readRolePermission(role_id, permission_id);
                    if (!rolePermission) {
                        return res.status(404).json({ error: 'Role permission not found' });
                    }
                    res.status(200).json(rolePermission);
                } catch (error) {
                    console.error('Error getting role permission:', error);
                    res.status(500).json({ error: 'Internal Server Error' });
                }
            });
        });
    });
};

module.exports = {
    createRolePermissionsController,
    updateRolePermissionsController,
    deleteRolePermissionsController,
    readRolePermissionsController,
    readRolePermissionController
};
