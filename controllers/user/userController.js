'use strict';

const { generateApiKey, generateSecretKey } = require('../../middleware/keyManage');
const UserModel = require('../../models/user/userModel');
const { auditLog } = require('../../middleware/eventLogger');

const UserController = {
    /**
     * POST /api/keys
     * Generates a new API key + secret. Raw values returned ONCE only.
     * Hashes stored in DB — cannot be recovered if lost.
     */
    createApiSecretKeys: async (req, res, next) => {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ error: 'email is required' });

            const { raw: rawApi,    hash: apiHash,    prefix } = await generateApiKey();
            const { raw: rawSecret, hash: secretHash }         = await generateSecretKey();

            const keyId = await UserModel.createApiKeySecretKey({
                apiKeyHash   : apiHash,
                secretKeyHash: secretHash,
                keyPrefix    : prefix,
                userId       : req.user.id,
                email,
            });

            auditLog('API_KEY_CREATED', { userId: req.user.id, keyId, email });

            // Raw values shown exactly once — client must store them securely
            return res.status(201).json({
                message  : 'API key created. Store these values securely — they will not be shown again.',
                keyId,
                apiKey   : rawApi,
                secretKey: rawSecret,
                keyPrefix: prefix,
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/keys/:email
     * Returns key metadata only (no hashes, no raw values)
     */
    readApiSecretKeys: async (req, res, next) => {
        try {
            const { email } = req.params;
            // Users can only read their own keys unless they're admin
            if (req.user.email !== email) {
                const { isAdmin: adminCheck } = require('../../middleware/adminVerifer');
                // Defer to isAdmin check via status query
                const row = await require('../../data/database').get(
                    `SELECT EXISTS(
                        SELECT 1 FROM user_roles ur
                        JOIN roles r ON ur.role_id = r.role_id
                        WHERE ur.user_id = ? AND LOWER(r.role_name) = 'admin'
                    ) AS is_admin`,
                    [req.user.id],
                );
                if (!row?.is_admin) {
                    return res.status(403).json({ error: 'You can only view your own API keys' });
                }
            }

            const keys = await UserModel.getApiKeysByEmail(email);
            return res.status(200).json(keys);
        } catch (err) {
            next(err);
        }
    },

    /** GET /api/keys — admin only */
    readAllApiSecretKeys: async (req, res, next) => {
        try {
            const keys = await UserModel.getAllApiKeys();
            return res.status(200).json(keys);
        } catch (err) {
            next(err);
        }
    },

    /**
     * PUT /api/keys/:email
     * Rotates the key pair — generates new hashes.
     * Returns new raw values once only.
     */
    rotateApiSecretKeys: async (req, res, next) => {
        try {
            const { keyId } = req.body;
            if (!keyId) return res.status(400).json({ error: 'keyId is required' });

            const { raw: rawApi,    hash: apiHash,    prefix } = await generateApiKey();
            const { raw: rawSecret, hash: secretHash }         = await generateSecretKey();

            await UserModel.rotateApiKey({
                keyId,
                newApiKeyHash   : apiHash,
                newSecretKeyHash: secretHash,
                newKeyPrefix    : prefix,
            });

            auditLog('API_KEY_ROTATED', { userId: req.user.id, keyId });

            return res.status(200).json({
                message  : 'Keys rotated. Store these new values securely.',
                keyId,
                apiKey   : rawApi,
                secretKey: rawSecret,
                keyPrefix: prefix,
            });
        } catch (err) {
            if (err.status) return res.status(err.status).json({ error: err.message });
            next(err);
        }
    },

    /** DELETE /api/keys/:email */
    revokeApiSecretKeys: async (req, res, next) => {
        try {
            const { email } = req.params;
            await UserModel.revokeApiKeyByEmail(email);
            auditLog('API_KEY_REVOKED', { userId: req.user.id, targetEmail: email });
            return res.status(200).json({ message: 'API keys revoked successfully' });
        } catch (err) {
            if (err.status) return res.status(err.status).json({ error: err.message });
            next(err);
        }
    },
};

module.exports = UserController;
