const { generateToken } = require('../../middleware/tokenManage.js');
const { hashPassword } = require('../../middleware/hashPassword.js');
const { getUserByEmailAndPassword } = require('../../models/auth/profileModel.js');

const loginControl = (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = hashPassword(password);

    getUserByEmailAndPassword(email, hashedPassword, (err, user) => {
        if (err) {
            console.error('Error during login:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (!user) {
            // User not found or invalid credentials
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // User is authenticated, generate a JWT token
        const token = generateToken({ id: user.id, email: user.email });

        // Respond with the token
        res.status(200).json({ token });
    });
};

module.exports = { loginControl };
