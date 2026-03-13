'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

/**
 * Generate a cryptographically-random API key.
 * Format: "ak_<32 hex chars>" — prefix helps identify key type in logs
 * Returns { raw, hash, prefix } where raw is shown once to the user,
 * and hash is stored in the database.
 */
async function generateApiKey() {
    const raw    = `ak_${crypto.randomBytes(24).toString('hex')}`;
    const prefix = raw.slice(0, 8);                        // e.g. "ak_a3f9b"
    const hash   = await bcrypt.hash(raw, ROUNDS);
    return { raw, hash, prefix };
}

/**
 * Generate a cryptographically-random secret key.
 * Format: "sk_<48 hex chars>"
 * Returns { raw, hash } — raw is shown once, hash stored.
 */
async function generateSecretKey() {
    const raw  = `sk_${crypto.randomBytes(32).toString('hex')}`;
    const hash = await bcrypt.hash(raw, ROUNDS);
    return { raw, hash };
}

/**
 * Verify an API key against its stored hash.
 */
async function verifyApiKey(raw, hash) {
    return bcrypt.compare(raw, hash);
}

module.exports = { generateApiKey, generateSecretKey, verifyApiKey };
