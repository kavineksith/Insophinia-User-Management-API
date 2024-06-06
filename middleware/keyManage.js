const crypto = require('crypto');

// Function to generate API Key and Secret Key
function generateApiKey() {
    return crypto.randomBytes(16).toString('hex');
}

function generateSecretKey() {
    return crypto.randomBytes(32).toString('hex');
}

module.exports = { generateApiKey, generateSecretKey };