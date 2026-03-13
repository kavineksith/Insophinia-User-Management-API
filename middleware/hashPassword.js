'use strict';

const bcrypt = require('bcryptjs');

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

/**
 * Hash a plaintext password.
 * Uses async genSalt + hash to avoid blocking the event loop.
 */
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(ROUNDS);
    return bcrypt.hash(password, salt);
};

/**
 * Securely compare a plaintext password against a stored hash.
 * Returns true if they match, false otherwise.
 *
 * BUG FIXED: The original code was re-hashing the password and then
 * comparing hash strings — this never works because bcrypt generates
 * a new salt each time. Must always use bcrypt.compare().
 */
const verifyPassword = async (plaintext, hash) => {
    return bcrypt.compare(plaintext, hash);
};

module.exports = { hashPassword, verifyPassword };
