'use strict';

const db = require('../../data/database');

// Safe column list — NEVER include password_hash in reads
const SAFE_COLUMNS = `user_id, first_name, last_name, email, contact_number,
                      country, is_active, created_at, updated_at`;

const createUser = async (userData) => {
    const { firstName, lastName, emailAddress, passwordHash, contactNumber, country } = userData;

    // Check for duplicate email before insert (better error message)
    const existing = await db.get('SELECT user_id FROM users WHERE email = ?', [emailAddress.toLowerCase()]);
    if (existing) {
        const err = new Error('A user with this email already exists');
        err.status = 409;
        throw err;
    }

    const { lastID } = await db.run(
        `INSERT INTO users (first_name, last_name, email, password_hash, contact_number, country)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [firstName.trim(), lastName.trim(), emailAddress.toLowerCase().trim(),
         passwordHash, contactNumber.trim(), country.trim()],
    );
    return lastID;
};

const readUsers = async () => {
    return db.all(`SELECT ${SAFE_COLUMNS} FROM users ORDER BY created_at DESC`);
};

const readUser = async (userId) => {
    return db.get(`SELECT ${SAFE_COLUMNS} FROM users WHERE user_id = ?`, [userId]);
};

const updateUser = async (userId, userData) => {
    // Only update fields that were actually provided (PATCH semantics)
    const fields  = [];
    const params  = [];

    if (userData.firstName    !== undefined) { fields.push('first_name = ?');    params.push(userData.firstName.trim()); }
    if (userData.lastName     !== undefined) { fields.push('last_name = ?');     params.push(userData.lastName.trim()); }
    if (userData.emailAddress !== undefined) { fields.push('email = ?');         params.push(userData.emailAddress.toLowerCase().trim()); }
    if (userData.passwordHash !== undefined) { fields.push('password_hash = ?'); params.push(userData.passwordHash); }
    if (userData.contactNumber!== undefined) { fields.push('contact_number = ?');params.push(userData.contactNumber.trim()); }
    if (userData.country      !== undefined) { fields.push('country = ?');       params.push(userData.country.trim()); }
    if (userData.isActive     !== undefined) { fields.push('is_active = ?');     params.push(userData.isActive ? 1 : 0); }

    if (fields.length === 0) {
        const err = new Error('No fields provided to update');
        err.status = 400;
        throw err;
    }

    fields.push('updated_at = unixepoch()');
    params.push(userId);

    const { changes } = await db.run(
        `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`,
        params,
    );

    if (changes === 0) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }
};

const deleteUser = async (userId) => {
    const { changes } = await db.run('DELETE FROM users WHERE user_id = ?', [userId]);
    if (changes === 0) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }
};

module.exports = { createUser, readUsers, readUser, updateUser, deleteUser };
