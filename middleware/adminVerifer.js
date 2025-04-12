const db = require('../data/database.js');

const isAdmin = async (req, res, next) => {
    try {
        const userId = getUserIdFromRequest(req); // Extract user ID from request
        if (!userId) {
            return res.sendStatus(401); // Unauthorized if user ID is not found
        }

        // Query the database to check if the user has the admin role
        const query = `
            SELECT EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_id = ? AND role_id = (SELECT id FROM roles WHERE name = 'admin')
            ) AS is_admin;
        `;
        const params = [userId];
        const { is_admin } = await db.get(query, params);

        if (is_admin) {
            next(); // Proceed to the next middleware if user is admin
        } else {
            res.sendStatus(403); // Forbidden if user is not admin
        }
    } catch (error) {
        console.error('Error checking admin role:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = isAdmin;