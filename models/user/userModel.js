'use strict';

const db = require('../../data/database');

const UserModel = {
    /**
     * Store API key + secret as bcrypt hashes.
     * Returns only the key_id — the raw values were given to the caller at
     * generation time and must never be stored or returned again.
     */
    createApiKeySecretKey: async ({ apiKeyHash, secretKeyHash, keyPrefix, userId, email }) => {
        const { lastID } = await db.run(
            `INSERT INTO api_keys (api_key_hash, secret_key_hash, key_prefix, user_id, email)
             VALUES (?, ?, ?, ?, ?)`,
            [apiKeyHash, secretKeyHash, keyPrefix, userId, email],
        );
        return lastID;
    },

    /**
     * Return all keys for an email.
     * Returns only safe metadata — NEVER hashes (they can't be reversed, but
     * leaking them is still pointless and wastes bandwidth).
     */
    getApiKeysByEmail: async (email) => {
        return db.all(
            `SELECT key_id, key_prefix, email, is_active, created_at, last_used_at
             FROM api_keys WHERE email = ? ORDER BY created_at DESC`,
            [email],
        );
    },

    /** Admin: get all key metadata */
    getAllApiKeys: async () => {
        return db.all(
            `SELECT key_id, key_prefix, user_id, email, is_active, created_at, last_used_at
             FROM api_keys ORDER BY created_at DESC`,
        );
    },

    /** Get the stored hashes by key_id so the controller can verify an incoming raw key */
    getHashesById: async (keyId) => {
        return db.get(
            'SELECT api_key_hash, secret_key_hash FROM api_keys WHERE key_id = ? AND is_active = 1',
            [keyId],
        );
    },

    /** Replace key hashes (rotate). key_id identifies which key pair to rotate. */
    rotateApiKey: async ({ keyId, newApiKeyHash, newSecretKeyHash, newKeyPrefix }) => {
        const { changes } = await db.run(
            `UPDATE api_keys
             SET api_key_hash = ?, secret_key_hash = ?, key_prefix = ?, last_used_at = unixepoch()
             WHERE key_id = ?`,
            [newApiKeyHash, newSecretKeyHash, newKeyPrefix, keyId],
        );
        if (changes === 0) throw Object.assign(new Error('API key not found'), { status: 404 });
    },

    /** Soft-delete: mark inactive rather than DELETE (preserves audit history) */
    revokeApiKeyByEmail: async (email) => {
        const { changes } = await db.run(
            'UPDATE api_keys SET is_active = 0 WHERE email = ?',
            [email],
        );
        if (changes === 0) throw Object.assign(new Error('No active keys found for this email'), { status: 404 });
    },

    updateLastUsed: async (keyId) => {
        await db.run('UPDATE api_keys SET last_used_at = unixepoch() WHERE key_id = ?', [keyId]);
    },
};

module.exports = UserModel;
