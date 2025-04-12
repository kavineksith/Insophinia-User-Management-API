const db = require('../data/database.js');

const UserAuthorization = async function isAuthorized(userId, requiredPermissions) {
    const hasPermissions = await userHasPermissions(userId, requiredPermissions);
    if (!hasPermissions) return res.sendStatus(403);
    next();
};

// Function to check user permissions
async function userHasPermissions(userId, requiredPermissions) {
    const query = `
        SELECT permissions.permission
        FROM user_roles
        JOIN roles_permissions ON user_roles.role_id = roles_permissions.role_id
        JOIN permissions ON roles_permissions.permission_id = permissions.id
        WHERE user_roles.user_id = ?;
      `;
    const rows = await db.all(query, [userId]);
    const userPermissions = rows.map(row => row.permission);
    return requiredPermissions.every(permission => userPermissions.includes(permission));
};

module.exports = { UserAuthorization, userHasPermissions };
