'use strict';

const { rotateRefreshToken } = require('../../middleware/tokenManage');
const { auditLog }           = require('../../middleware/eventLogger');

/**
 * POST /auth/refresh
 * Cookie: refreshToken=<tokenId>
 *
 * Issues a new access token + rotated refresh token.
 * Detects reuse (replay attacks) and revokes ALL sessions for the user.
 */
const refreshControl = async (req, res, next) => {
    try {
        const oldRefreshId = req.cookies?.refreshToken;

        if (!oldRefreshId) {
            return res.status(401).json({ error: 'No refresh token provided' });
        }

        const { accessToken, newRefreshId, user } = await rotateRefreshToken(oldRefreshId, {
            userAgent: req.headers['user-agent'],
            ip       : req.ip,
        });

        auditLog('TOKEN_REFRESHED', { userId: user.user_id, ip: req.ip });

        // Set the new refresh token cookie
        res.cookie('refreshToken', newRefreshId, {
            httpOnly: true,
            secure  : process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge  : 7 * 24 * 60 * 60 * 1000,
            path    : '/auth/refresh',
        });

        return res.status(200).json({
            accessToken,
            expiresIn : process.env.JWT_ACCESS_EXPIRES || '15m',
            tokenType : 'Bearer',
        });
    } catch (err) {
        if (err.status === 401) {
            return res.status(401).json({ error: err.message });
        }
        next(err);
    }
};

module.exports = { refreshControl };
