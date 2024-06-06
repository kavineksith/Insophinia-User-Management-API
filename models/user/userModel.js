const db = require('../../data/database.js');

const UserModel = {
    createApiKeySecretKey: async (apiKey, secretKey, email) => {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO api_keys (api_key, secret_key, email) VALUES (?, ?, ?)`;
            db.run(query, [apiKey, secretKey, email], (err) => {
                if (err) {
                    console.error('Error inserting keys:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    },
    getApiSecretKeysByEmail: async (email) => {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM api_keys WHERE email = ?`;
            db.all(query, [email], (err, rows) => {
                if (err) {
                    console.error('Error retrieving keys:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },
    getAllApiSecretKeys: async () => {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM api_keys`;
            db.all(query, (err, rows) => {
                if (err) {
                    console.error('Error retrieving keys:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },
    updateApiKeySecretKey: async (apiKey, secretKey, email) => {
        return new Promise((resolve, reject) => {
            const query = `UPDATE api_keys SET api_key = ?, secret_key = ? WHERE email = ?`;
            db.run(query, [apiKey, secretKey, email], (err) => {
                if (err) {
                    console.error('Error updating keys:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    },
    deleteApiKeySecretKeyByEmail: async (email) => {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM api_keys WHERE email = ?`;
            db.run(query, [email], (err) => {
                if (err) {
                    console.error('Error deleting keys:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
};

module.exports = UserModel;
