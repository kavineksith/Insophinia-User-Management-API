'use strict';

const { blacklistToken } = require('../../middleware/tokenManage');
const { auditLog }       = require('../../middleware/eventLogger');
const db                 = require('../../data/database');

/**
 * POST /auth/logout
 * Headers: Authorization: Bearer <accessToken>
 *
 * Revokes the access token by adding its JTI to the blacklist,
 * and revokes the refresh token stored in the HttpOnly cookie.
 *
 * BUG FIXED: Original inserted the full raw token text into blacklist and
 * compared `token == jwtToken` against a row object (always false).
 * Now uses JTI-based blacklisting (short string, indexed).
 *
 * BUG FIXED: res.sendStatus(204).json(...) crashes — 204 has no body.
 */
const logoutControl = async (req, res, next) => {
    try {
        // req.user is set by authenticateToken middleware on the route
        const { jti, exp, id: userId, email } = req.user;

        // Blacklist the access token JTI until its natural expiry
        await blacklistToken(jti, exp);

        // Revoke refresh token from cookie (if present)
        const refreshTokenId = req.cookies?.refreshToken;
        if (refreshTokenId) {
            await db.run(
                'UPDATE refresh_tokens SET revoked = 1 WHERE token_id = ? AND user_id = ?',
                [refreshTokenId, userId],
            );
        }

        // Clear the cookie on the client
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure  : process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path    : '/auth/refresh',
        });

        auditLog('LOGOUT', { userId, email, ip: req.ip });

        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        next(err);
    }
};

module.exports = { logoutControl };
