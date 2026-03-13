'use strict';

const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db     = require('../data/database');
const { auditLog } = require('./eventLogger');

// ── Secrets loaded from environment — never generated at runtime ─────────────
const ACCESS_SECRET  = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
    throw new Error('[TokenManage] JWT_SECRET and JWT_REFRESH_SECRET must be set in .env');
}

const ACCESS_EXPIRES  = process.env.JWT_ACCESS_EXPIRES  || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

// ── Token generation ─────────────────────────────────────────────────────────

/**
 * Generate a short-lived access token.
 * Embeds a unique JTI for blacklisting on logout.
 */
function generateAccessToken(payload) {
    const jti = uuidv4();
    return {
        token: jwt.sign(
            { ...payload, jti, type: 'access' },
            ACCESS_SECRET,
            { expiresIn: ACCESS_EXPIRES, algorithm: 'HS256' },
        ),
        jti,
    };
}

/**
 * Generate a long-lived refresh token ID.
 * The ID is stored in the DB; the token itself is an opaque UUID.
 */
async function generateRefreshToken(userId, meta = {}) {
    const tokenId  = uuidv4();
    const expiresInSec = 7 * 24 * 60 * 60; // 7 days
    const expiresAt    = Math.floor(Date.now() / 1000) + expiresInSec;

    await db.run(
        `INSERT INTO refresh_tokens (token_id, user_id, expires_at, user_agent, ip_address)
         VALUES (?, ?, ?, ?, ?)`,
        [tokenId, userId, expiresAt, meta.userAgent || null, meta.ip || null],
    );

    return tokenId;
}

// ── Token verification ───────────────────────────────────────────────────────

function verifyAccessToken(token) {
    return jwt.verify(token, ACCESS_SECRET, { algorithms: ['HS256'] });
}

// ── Middleware: authenticate access token ────────────────────────────────────

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization header missing or malformed' });
        }

        const token = authHeader.slice(7);

        // Verify signature & expiry first
        let payload;
        try {
            payload = verifyAccessToken(token);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Access token expired. Use /auth/refresh.' });
            }
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Ensure token is an access token (not a crafted refresh or other)
        if (payload.type !== 'access') {
            return res.status(401).json({ error: 'Invalid token type' });
        }

        // Check blacklist by JTI
        const now = Math.floor(Date.now() / 1000);
        const blacklisted = await db.get(
            'SELECT id FROM token_blacklist WHERE jti = ? AND expires_at > ?',
            [payload.jti, now],
        );
        if (blacklisted) {
            return res.status(401).json({ error: 'Token has been revoked' });
        }

        req.user = payload;
        next();
    } catch (err) {
        next(err);
    }
};

// ── Blacklist a token (used on logout) ───────────────────────────────────────

async function blacklistToken(jti, expiresAt) {
    await db.run(
        'INSERT OR IGNORE INTO token_blacklist (jti, expires_at) VALUES (?, ?)',
        [jti, expiresAt],
    );
}

// ── Refresh token rotation ───────────────────────────────────────────────────

/**
 * Validate a refresh token ID and, if valid, rotate it:
 *  1. Revoke the old refresh token
 *  2. Issue new access + refresh tokens
 */
async function rotateRefreshToken(oldTokenId, meta = {}) {
    const now = Math.floor(Date.now() / 1000);

    const record = await db.get(
        `SELECT token_id, user_id, expires_at, revoked
         FROM refresh_tokens WHERE token_id = ?`,
        [oldTokenId],
    );

    if (!record) throw Object.assign(new Error('Refresh token not found'), { status: 401 });
    if (record.revoked) {
        // Token reuse detected — revoke ALL tokens for this user (security event)
        await db.run('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?', [record.user_id]);
        auditLog('REFRESH_TOKEN_REUSE_DETECTED', { userId: record.user_id });
        throw Object.assign(new Error('Refresh token already used'), { status: 401 });
    }
    if (record.expires_at < now) throw Object.assign(new Error('Refresh token expired'), { status: 401 });

    // Revoke old token
    await db.run('UPDATE refresh_tokens SET revoked = 1 WHERE token_id = ?', [oldTokenId]);

    // Fetch user
    const user = await db.get(
        'SELECT user_id, email, is_active FROM users WHERE user_id = ?',
        [record.user_id],
    );
    if (!user || !user.is_active) throw Object.assign(new Error('User not found or inactive'), { status: 401 });

    // Issue new tokens
    const { token: accessToken, jti } = generateAccessToken({ id: user.user_id, email: user.email });
    const newRefreshId = await generateRefreshToken(user.user_id, meta);

    return { accessToken, jti, newRefreshId, user };
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    authenticateToken,
    blacklistToken,
    rotateRefreshToken,
};
