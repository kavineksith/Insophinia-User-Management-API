const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../data/database.js');

// Set JWT secret key
process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');

// Token Generation
function generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRATION || '1h',
        algorithm: 'HS256'
    });
}

// Token Verification
function verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256']
    });
}

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    const query = `SELECT jwtToken FROM blacklist WHERE jwtToken = ?`;
    const params = [token];
    if (!token) {
        return res.sendStatus(401).json({ error: 'Token isn\'t found' });
    } else {
        db.get(query, params, (err, jwtToken) => {
            if (err) {
                console.error(err.message);
                throw err;
            } else {
                if (token == jwtToken) {
                    return res.sendStatus(401).json({ error: 'Token is Blacklisted' });
                }

                try {
                    const user = verifyToken(token);
                    req.user = user;
                    next();
                } catch (error) {
                    if (error.name === 'TokenExpiredError') {
                        // If token is expired, generate a new token and attach user to request
                        refreshAuthToken(req, res, next);
                    } else {
                        res.sendStatus(403);
                    }
                }
            }
        });
    }
};

// Function to generate a new token for the user
const refreshAuthToken = (req, res, next) => {
    const user = {
        // Assuming you have a function to fetch user details
        id: getUserIdFromRequest(req),
        // Other user details
    };
    const newToken = generateToken(user);
    req.user = user;
    // Set the new token in response header
    res.set('Authorization', `Bearer ${newToken}`);
    next();
};

// Function to fetch user details from request
const getUserIdFromRequest = (req) => {
    // Assuming the user ID is stored in the token payload
    const token = req.headers['authorization']?.split(' ')[1];
    if (token) {
        try {
            const decodedToken = jwt.decode(token);
            return decodedToken.id; // Assuming 'id' is the key for user ID in the token payload
        } catch (error) {
            console.error('Error decoding token:', error);
            return null; // Return null or handle error as needed
        }
    }
    return null; // Return null if no token is present in the request headers
};

module.exports = { generateToken, verifyToken, authenticateToken, refreshAuthToken, getUserIdFromRequest };
