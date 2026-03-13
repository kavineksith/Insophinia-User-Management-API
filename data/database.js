'use strict';

const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

const DB_PATH = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(__dirname, '..', 'sso.db');

// ── Promise-based SQLite wrapper ─────────────────────────────────────────────
class Database {
    constructor() {
        this.db = null;
        this._ready = this._connect();
    }

    _connect() {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    console.error('[DB] Connection error:', err.message);
                    reject(err);
                    return;
                }
                console.log(`[DB] Connected → ${DB_PATH}`);
                this.db = db;
                resolve();
            });
        }).then(() => this._pragma()).then(() => this._migrate());
    }

    // Harden SQLite settings
    async _pragma() {
        await this.run('PRAGMA journal_mode = WAL');
        await this.run('PRAGMA foreign_keys = ON');
        await this.run('PRAGMA synchronous = NORMAL');
        await this.run('PRAGMA temp_store = MEMORY');
        await this.run('PRAGMA cache_size = -8000'); // 8 MB cache
    }

    async _migrate() {
        const statements = [
            /* users ────────────────────────────────────────────────────── */
            `CREATE TABLE IF NOT EXISTS users (
                user_id               INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name            TEXT    NOT NULL,
                last_name             TEXT    NOT NULL,
                email                 TEXT    UNIQUE NOT NULL COLLATE NOCASE,
                password_hash         TEXT    NOT NULL,
                contact_number        TEXT    NOT NULL,
                country               TEXT    NOT NULL,
                is_active             INTEGER NOT NULL DEFAULT 1,
                failed_login_attempts INTEGER NOT NULL DEFAULT 0,
                locked_until          INTEGER,
                created_at            INTEGER NOT NULL DEFAULT (unixepoch()),
                updated_at            INTEGER NOT NULL DEFAULT (unixepoch())
            )`,

            /* roles ─────────────────────────────────────────────────────── */
            `CREATE TABLE IF NOT EXISTS roles (
                role_id    INTEGER PRIMARY KEY AUTOINCREMENT,
                role_name  TEXT UNIQUE NOT NULL,
                created_at INTEGER NOT NULL DEFAULT (unixepoch())
            )`,

            /* permissions ───────────────────────────────────────────────── */
            `CREATE TABLE IF NOT EXISTS permissions (
                permission_id   INTEGER PRIMARY KEY AUTOINCREMENT,
                permission_name TEXT UNIQUE NOT NULL,
                created_at      INTEGER NOT NULL DEFAULT (unixepoch())
            )`,

            /* user_roles ─────────────────────────────────────────────────── */
            `CREATE TABLE IF NOT EXISTS user_roles (
                user_id     INTEGER NOT NULL,
                role_id     INTEGER NOT NULL,
                assigned_at INTEGER NOT NULL DEFAULT (unixepoch()),
                PRIMARY KEY (user_id, role_id),
                FOREIGN KEY (user_id) REFERENCES users(user_id)  ON DELETE CASCADE,
                FOREIGN KEY (role_id) REFERENCES roles(role_id)  ON DELETE CASCADE
            )`,

            /* roles_permissions ─────────────────────────────────────────── */
            `CREATE TABLE IF NOT EXISTS roles_permissions (
                role_id       INTEGER NOT NULL,
                permission_id INTEGER NOT NULL,
                PRIMARY KEY (role_id, permission_id),
                FOREIGN KEY (role_id)       REFERENCES roles(role_id)            ON DELETE CASCADE,
                FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
            )`,

            /* api_keys ──────────────────────────────────────────────────── */
            `CREATE TABLE IF NOT EXISTS api_keys (
                key_id         INTEGER PRIMARY KEY AUTOINCREMENT,
                api_key_hash   TEXT    NOT NULL,
                secret_key_hash TEXT   NOT NULL,
                key_prefix     TEXT    NOT NULL,
                user_id        INTEGER NOT NULL,
                email          TEXT    NOT NULL,
                is_active      INTEGER NOT NULL DEFAULT 1,
                created_at     INTEGER NOT NULL DEFAULT (unixepoch()),
                last_used_at   INTEGER,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )`,

            /* token_blacklist (stores JTI of revoked access tokens) ──────── */
            `CREATE TABLE IF NOT EXISTS token_blacklist (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                jti            TEXT    UNIQUE NOT NULL,
                expires_at     INTEGER NOT NULL,
                revoked_at     INTEGER NOT NULL DEFAULT (unixepoch())
            )`,

            /* refresh_tokens ─────────────────────────────────────────────── */
            `CREATE TABLE IF NOT EXISTS refresh_tokens (
                token_id    TEXT    PRIMARY KEY,
                user_id     INTEGER NOT NULL,
                expires_at  INTEGER NOT NULL,
                created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
                revoked     INTEGER NOT NULL DEFAULT 0,
                user_agent  TEXT,
                ip_address  TEXT,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )`,

            /* audit_log ─────────────────────────────────────────────────── */
            `CREATE TABLE IF NOT EXISTS audit_log (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    INTEGER,
                action     TEXT    NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                metadata   TEXT,
                created_at INTEGER NOT NULL DEFAULT (unixepoch())
            )`,

            /* indexes ───────────────────────────────────────────────────── */
            `CREATE INDEX IF NOT EXISTS idx_blacklist_jti        ON token_blacklist(jti)`,
            `CREATE INDEX IF NOT EXISTS idx_blacklist_expires    ON token_blacklist(expires_at)`,
            `CREATE INDEX IF NOT EXISTS idx_refresh_token_id     ON refresh_tokens(token_id)`,
            `CREATE INDEX IF NOT EXISTS idx_refresh_user_id      ON refresh_tokens(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email)`,
            `CREATE INDEX IF NOT EXISTS idx_audit_user_id        ON audit_log(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_audit_created_at     ON audit_log(created_at)`,
        ];

        for (const sql of statements) {
            await this.run(sql);
        }

        console.log('[DB] Schema ready');

        // Periodic cleanup of expired blacklist tokens (every 10 minutes)
        setInterval(() => this._cleanExpired(), 10 * 60 * 1000);
    }

    async _cleanExpired() {
        const now = Math.floor(Date.now() / 1000);
        try {
            await this.run('DELETE FROM token_blacklist WHERE expires_at < ?', [now]);
            await this.run('DELETE FROM refresh_tokens WHERE expires_at < ?', [now]);
        } catch (err) {
            console.error('[DB] Cleanup error:', err.message);
        }
    }

    /** Execute a write statement. Returns { lastID, changes } */
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    }

    /** Fetch a single row. Returns row or undefined */
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    /** Fetch all rows. Returns array */
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    /** Await until the DB is fully initialized */
    ready() {
        return this._ready;
    }
}

module.exports = new Database();
