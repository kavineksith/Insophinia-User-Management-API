'use strict';

const db = require('../data/database');

/**
 * Middleware: allows only users who have the 'admin' role.
 *
 * BUGS FIXED:
 *  1. Original called getUserIdFromRequest() which was never imported — now reads req.user.id
 *     set by authenticateToken middleware.
 *  2. sqlite3 doesn't support db.get() with async/await natively — database.js now wraps
 *     all methods in Promises so this works correctly.
 *  3. Column name mismatch: table uses role_name, original queried `name`.
 */
const isAdmin = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const row = await db.get(
            `SELECT EXISTS (
                SELECT 1
                FROM user_roles ur
                JOIN roles r ON ur.role_id = r.role_id
                WHERE ur.user_id = ?
                  AND LOWER(r.role_name) = 'admin'
            ) AS is_admin`,
            [userId],
        );

        if (row && row.is_admin === 1) {
            return next();
        }

        return res.status(403).json({ error: 'Admin access required' });
    } catch (err) {
        next(err);
    }
};

module.exports = { isAdmin };
