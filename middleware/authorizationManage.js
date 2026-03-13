'use strict';

const db = require('../data/database');

/**
 * Middleware factory: checks that the authenticated user holds ALL of
 * the specified permission names.
 *
 * Usage in a route:
 *   router.post('/', authenticateToken, requirePermissions(['create:user']), handler)
 *
 * BUG FIXED: Original code was defined as a plain async function(userId, requiredPermissions)
 * and then called as UserAuthorization(['create'])(req,res,next) — the signatures
 * didn't match at all and it referenced undefined `res` / `next`.
 */
const requirePermissions = (requiredPermissions = []) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const rows = await db.all(
                `SELECT p.permission_name
                 FROM user_roles ur
                 JOIN roles_permissions rp ON ur.role_id = rp.role_id
                 JOIN permissions p        ON rp.permission_id = p.permission_id
                 WHERE ur.user_id = ?`,
                [userId],
            );

            const userPermissions = new Set(rows.map((r) => r.permission_name));
            const hasAll = requiredPermissions.every((p) => userPermissions.has(p));

            if (!hasAll) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};

/**
 * Helper (non-middleware) — returns true/false.
 * Useful when you need to check permissions inside a controller.
 */
const userHasPermissions = async (userId, requiredPermissions = []) => {
    const rows = await db.all(
        `SELECT p.permission_name
         FROM user_roles ur
         JOIN roles_permissions rp ON ur.role_id = rp.role_id
         JOIN permissions p        ON rp.permission_id = p.permission_id
         WHERE ur.user_id = ?`,
        [userId],
    );
    const userPermissions = new Set(rows.map((r) => r.permission_name));
    return requiredPermissions.every((p) => userPermissions.has(p));
};

module.exports = { requirePermissions, userHasPermissions };
