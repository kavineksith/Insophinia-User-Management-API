const { createUser, readUsers, readUser, updateUser, deleteUser } = require('../../models/admin/userProfileModel.js');
const { rateLimitMethod } = require('../../middleware/ratelimiter.js');
const { authenticateToken } = require('../../middleware/tokenManage.js');
const { isAdmin } = require('../../middleware/adminVerifer.js');
const { hashPassword } = require('../../middleware/hashPassword.js');

const createUserController = async (req, res) => {
    authenticateToken(req, res, () => {
        rateLimitMethod(req, res, () => {
            isAdmin(req, res, async () => {
                const { firstName, lastName, emailAddress, password, contactNumber, country } = req.body;
                const hashedPassword = hashPassword(password);
                try {
                    await createUser({ firstName, lastName, emailAddress, hashedPassword, contactNumber, country });
                    res.status(201).json({ message: 'User created successfully' });
                } catch (error) {
                    console.error('Error creating user:', error);
                    res.status(500).json({ error: 'Internal Server Error' });
                }
            });
        });
    });
};

const readUsersController = async (req, res) => {
    authenticateToken(req, res, () => {
        rateLimitMethod(req, res, () => {
            isAdmin(req, res, async () => {
                try {
                    const users = await readUsers();
                    res.status(200).json(users);
                } catch (error) {
                    console.error('Error getting users:', error);
                    res.status(500).json({ error: 'Internal Server Error' });
                }
            });
        });
    });
};

const readUserController = async (req, res) => {
    authenticateToken(req, res, () => {
        rateLimitMethod(req, res, () => {
            isAdmin(req, res, async () => {
                const { id } = req.params;
                try {
                    const user = await readUser(id);
                    if (!user) {
                        return res.status(404).json({ error: 'User not found' });
                    }
                    res.status(200).json(user);
                } catch (error) {
                    console.error('Error getting user:', error);
                    res.status(500).json({ error: 'Internal Server Error' });
                }
            });
        });
    });
};

const updateUserController = async (req, res) => {
    authenticateToken(req, res, () => {
        rateLimitMethod(req, res, () => {
            isAdmin(req, res, async () => {
                const { id } = req.params;
                const { firstName, lastName, emailAddress, password, contactNumber, country } = req.body;
                const hashedPassword = hashPassword(password);
                try {
                    await updateUser(id, { firstName, lastName, emailAddress, hashedPassword, contactNumber, country });
                    res.status(200).json({ message: 'User updated successfully' });
                } catch (error) {
                    console.error('Error updating user:', error);
                    res.status(500).json({ error: 'Internal Server Error' });
                }
            });
        });
    });
};

const deleteUserController = async (req, res) => {
    authenticateToken(req, res, () => {
        rateLimitMethod(req, res, () => {
            isAdmin(req, res, async () => {
                const { id } = req.params;
                try {
                    await deleteUser(id);
                    res.status(200).json({ message: 'User deleted successfully' });
                } catch (error) {
                    console.error('Error deleting user:', error);
                    res.status(500).json({ error: 'Internal Server Error' });
                }
            });
        });
    });
};

module.exports = {
    createUserController,
    readUsersController,
    readUserController,
    updateUserController,
    deleteUserController
};
