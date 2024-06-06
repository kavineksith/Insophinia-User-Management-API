const { rateLimitMethod } = require('../../middleware/ratelimiter.js');
const { authenticateToken } = require('../../middleware/tokenManage.js');
const { UserAuthorization } = require('../../middleware/authorizationManage.js');
const { generateApiKey, generateSecretKey } = require('../../middleware/keyManage.js');
const { isAdmin } = require('../../middleware/isAdmin.js');
const UserModel = require('../../models/user/userModel.js');

const UserController = {
    
    createApiSecretKeys: async (req, res) => {
        authenticateToken(req, res, async () => {
            rateLimitMethod(req, res, async () => {
                UserAuthorization(['create'])(req, res, async () => {
                    try {
                        const { email } = req.body;
                        const apiKey = generateApiKey();
                        const secretKey = generateSecretKey();
                        await UserModel.createApiKeySecretKey(apiKey, secretKey, email);
                        res.status(201).json({ apiKey, secretKey, email });
                    } catch (err) {
                        console.error('Error generating key ID:', err);
                        res.status(500).json({ error: 'Internal Server Error' });
                    }
                });
            });
        });
    },
    readApiSecretKeys: async (req, res) => {
        authenticateToken(req, res, () => {
            rateLimitMethod(req, res, () => {
                UserAuthorization(['read'])(req, res, async () => {
                    const { email } = req.params;
                    const keys = await UserModel.getApiSecretKeysByEmail(email);
                    res.status(200).json(keys);
                });
            });
        });
    },
    readAllApiSecretKeys: async (req, res) => {
        authenticateToken(req, res, () => {
            rateLimitMethod(req, res, () => {
                isAdmin(req, res, () => {
                    UserAuthorization(['read'])(req, res, async () => {
                        const keys = await UserModel.getAllApiSecretKeys();
                        res.status(200).json(keys);
                    });
                });
            });
        });
    },
    updateApiSecretKeys: async (req, res) => {
        authenticateToken(req, res, () => {
            rateLimitMethod(req, res, () => {
                UserAuthorization(['update'])(req, res, async () => {
                    const { email } = req.params;
                    const { apiKey, secretKey } = req.body;
                    await UserModel.updateApiKeySecretKey(apiKey, secretKey, email);
                    res.status(200).json({ message: 'Keys updated successfully' });
                });
            });
        });
    },
    deleteApiSecretKeys: async (req, res) => {
        authenticateToken(req, res, () => {
            rateLimitMethod(req, res, () => {
                UserAuthorization(['delete'])(req, res, async () => {
                    const { email } = req.params;
                    await UserModel.deleteApiKeySecretKeyByEmail(email);
                    res.status(200).json({ message: 'Keys deleted successfully' });
                });
            });
        });
    }
};

module.exports = UserController;
