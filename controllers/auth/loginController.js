'use strict';

const { authenticateUser }                      = require('../../models/auth/profileModel');
const { generateAccessToken, generateRefreshToken } = require('../../middleware/tokenManage');
const { auditLog }                              = require('../../middleware/eventLogger');

/**
 * POST /auth/login
 * Body: { email, password }
 *
 * On success returns:
 *   - accessToken in JSON body (short-lived, 15m)
 *   - refreshToken as HttpOnly Secure cookie (7d, never readable by JS)
 */
const loginControl = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        let user;
        try {
            user = await authenticateUser(email, password);
        } catch (lockErr) {
            // Account lockout — surface the wait time
            return res.status(lockErr.status || 429).json({ error: lockErr.message });
        }

        if (!user) {
            // Generic message — never reveal whether email exists
            auditLog('LOGIN_FAILED', { email, ip: req.ip });
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate tokens
        const { token: accessToken, jti } = generateAccessToken({ id: user.id, email: user.email });
        const refreshTokenId = await generateRefreshToken(user.id, {
            userAgent: req.headers['user-agent'],
            ip       : req.ip,
        });

        auditLog('LOGIN_SUCCESS', { userId: user.id, email: user.email, ip: req.ip });

        // Deliver refresh token as HttpOnly cookie — JS can never read it
        res.cookie('refreshToken', refreshTokenId, {
            httpOnly: true,
            secure  : process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge  : 7 * 24 * 60 * 60 * 1000, // 7 days in ms
            path    : '/auth/refresh',           // Only sent to the refresh endpoint
        });

        return res.status(200).json({
            message    : 'Login successful',
            accessToken,
            expiresIn  : process.env.JWT_ACCESS_EXPIRES || '15m',
            tokenType  : 'Bearer',
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { loginControl };
