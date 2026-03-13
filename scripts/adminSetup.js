#!/usr/bin/env node
'use strict';

/**
 * Run once to bootstrap the SSO platform:
 *   node scripts/adminSetup.js
 *
 * Creates:
 *   - Core roles: admin, user
 *   - Core permissions: create/read/update/delete for user + apikey resources
 *   - Admin user from environment variables (or interactive prompts)
 *   - Assigns admin role + all permissions to that user
 */

require('dotenv').config();

const readline = require('readline');
const db       = require('../data/database');
const { hashPassword } = require('../middleware/hashPassword');

const ROLES = ['admin', 'user'];

const PERMISSIONS = [
    'create:user', 'read:user',   'update:user',   'delete:user',
    'create:apikey', 'read:apikey', 'update:apikey', 'delete:apikey',
    'read:roles', 'manage:roles',
    'read:permissions', 'manage:permissions',
];

// Role → permissions mapping
const ROLE_PERMISSIONS = {
    admin: PERMISSIONS,                              // All permissions
    user : ['create:apikey', 'read:apikey', 'update:apikey', 'delete:apikey'],
};

async function prompt(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

async function run() {
    // Wait for DB to finish initializing
    await db.ready();

    console.log('\n╔════════════════════════════════════╗');
    console.log('║   SSO Platform — Admin Bootstrap   ║');
    console.log('╚════════════════════════════════════╝\n');

    // ── 1. Insert roles ───────────────────────────────────────────────────────
    console.log('► Setting up roles...');
    for (const roleName of ROLES) {
        await db.run('INSERT OR IGNORE INTO roles (role_name) VALUES (?)', [roleName]);
    }
    console.log(`  ✓ Roles: ${ROLES.join(', ')}`);

    // ── 2. Insert permissions ─────────────────────────────────────────────────
    console.log('► Setting up permissions...');
    for (const perm of PERMISSIONS) {
        await db.run('INSERT OR IGNORE INTO permissions (permission_name) VALUES (?)', [perm]);
    }
    console.log(`  ✓ ${PERMISSIONS.length} permissions inserted`);

    // ── 3. Map role → permissions ─────────────────────────────────────────────
    console.log('► Assigning permissions to roles...');
    for (const [roleName, perms] of Object.entries(ROLE_PERMISSIONS)) {
        const role = await db.get('SELECT role_id FROM roles WHERE role_name = ?', [roleName]);
        for (const permName of perms) {
            const perm = await db.get('SELECT permission_id FROM permissions WHERE permission_name = ?', [permName]);
            if (role && perm) {
                await db.run(
                    'INSERT OR IGNORE INTO roles_permissions (role_id, permission_id) VALUES (?, ?)',
                    [role.role_id, perm.permission_id],
                );
            }
        }
    }
    console.log('  ✓ Role-permission mappings complete');

    // ── 4. Create admin user ──────────────────────────────────────────────────
    console.log('\n► Admin user setup');

    const existingAdmin = await db.get(
        `SELECT u.user_id FROM users u
         JOIN user_roles ur ON u.user_id = ur.user_id
         JOIN roles r ON ur.role_id = r.role_id
         WHERE LOWER(r.role_name) = 'admin'
         LIMIT 1`,
    );

    if (existingAdmin) {
        console.log('  ⚠ An admin user already exists. Skipping user creation.\n');
        process.exit(0);
    }

    let firstName, lastName, email, password;

    // Accept from env or prompt interactively
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
        firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
        lastName  = process.env.ADMIN_LAST_NAME  || 'User';
        email     = process.env.ADMIN_EMAIL;
        password  = process.env.ADMIN_PASSWORD;
        console.log(`  Using ADMIN_EMAIL from environment: ${email}`);
    } else {
        firstName = await prompt('  First name [Admin]: ') || 'Admin';
        lastName  = await prompt('  Last name  [User]:  ') || 'User';
        email     = await prompt('  Email address: ');
        password  = await prompt('  Password (min 8 chars, upper+lower+digit+special): ');

        if (!email || !password) {
            console.error('\n  ✗ Email and password are required.\n');
            process.exit(1);
        }
    }

    const passwordRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRe.test(password)) {
        console.error('\n  ✗ Password must be ≥8 chars and include uppercase, lowercase, digit, special char.\n');
        process.exit(1);
    }

    const passwordHash = await hashPassword(password);
    const { lastID: userId } = await db.run(
        `INSERT INTO users (first_name, last_name, email, password_hash, contact_number, country)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [firstName, lastName, email.toLowerCase(), passwordHash, '0000000000', 'N/A'],
    );

    // Assign admin role
    const adminRole = await db.get('SELECT role_id FROM roles WHERE role_name = ?', ['admin']);
    await db.run('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, adminRole.role_id]);

    console.log(`\n  ✓ Admin user created (id=${userId}, email=${email})`);
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  Bootstrap complete! Run: npm start      ║');
    console.log('╚══════════════════════════════════════════╝\n');
    process.exit(0);
}

run().catch((err) => {
    console.error('\n[Bootstrap ERROR]', err.message);
    process.exit(1);
});
