'use strict';

const db                         = require('../../data/database');
const { verifyPassword }         = require('../../middleware/hashPassword');
const { auditLog }               = require('../../middleware/eventLogger');

const MAX_ATTEMPTS       = parseInt(process.env.MAX_LOGIN_ATTEMPTS      || '5',  10);
const LOCKOUT_MINUTES    = parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15', 10);
const LOCKOUT_SECONDS    = LOCKOUT_MINUTES * 60;

/**
 * Authenticate a user by email + password.
 *
 * BUG FIXED: Original code called hashPassword(password) then compared hashes —
 * this is always wrong because bcrypt salts produce different hashes every time.
 * Must use bcrypt.compare(plaintext, storedHash).
 *
 * Security additions:
 *  - Account lockout after N failed attempts
 *  - Timing-safe response (same error message whether user missing or pw wrong)
 *  - Only returns safe fields (no password hash)
 */
async function authenticateUser(email, password) {
    const now = Math.floor(Date.now() / 1000);

    // Fetch user (case-insensitive via COLLATE NOCASE on column)
    const user = await db.get(
        `SELECT user_id, email, password_hash, is_active,
                failed_login_attempts, locked_until
         FROM users WHERE email = ?`,
        [email.toLowerCase()],
    );

    // Constant-time failure — don't reveal whether the user exists
    if (!user) {
        // Run a dummy compare to prevent timing attacks that reveal existence
        await verifyPassword(password, '$2a$12$dummyhashfortimingattackprevention0000000000000000000000');
        return null;
    }

    // Check account status
    if (!user.is_active) {
        return null; // Treat disabled accounts as "not found"
    }

    // Check lockout
    if (user.locked_until && user.locked_until > now) {
        const remainingSec = user.locked_until - now;
        const err = new Error(`Account locked. Try again in ${Math.ceil(remainingSec / 60)} minute(s).`);
        err.status = 429;
        throw err;
    }

    // Verify password
    const valid = await verifyPassword(password, user.password_hash);

    if (!valid) {
        const newAttempts = user.failed_login_attempts + 1;

        if (newAttempts >= MAX_ATTEMPTS) {
            const lockedUntil = now + LOCKOUT_SECONDS;
            await db.run(
                'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE user_id = ?',
                [newAttempts, lockedUntil, user.user_id],
            );
            auditLog('ACCOUNT_LOCKED', { userId: user.user_id, email: user.email });
        } else {
            await db.run(
                'UPDATE users SET failed_login_attempts = ? WHERE user_id = ?',
                [newAttempts, user.user_id],
            );
        }
        return null;
    }

    // Successful auth — reset failed attempts
    await db.run(
        'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE user_id = ?',
        [user.user_id],
    );

    return { id: user.user_id, email: user.email };
}

module.exports = { authenticateUser };
