const db = require('../../data/database.js');

const logoutControl = (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (token) {
        const query = `INSERT INTO blacklist (jwtToken) VALUES (?)`;
        const params = [token];
        db.run(query, params, (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Internal Server Error' });
            } else {
                return res.sendStatus(204).json({ message: 'JWT Token is added to BlackList' });
            }
        });
    } else {
        res.status(400).json({ error: 'No token detected. please enter token' });
    }
};

module.exports = { logoutControl };
