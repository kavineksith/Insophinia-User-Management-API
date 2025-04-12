const users = `CREATE TABLE users (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    emailAddress TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    contactNumber INTEGER NOT NULL,
    country TEXT NOT NULL
)`;

const roles = `CREATE TABLE roles (
    RoleID INTEGER PRIMARY KEY AUTOINCREMENT,
    roleName TEXT UNIQUE NOT NULL
)`;

const permissions = `CREATE TABLE permissions (
    PermissionID INTEGER PRIMARY KEY AUTOINCREMENT,
    permissionName TEXT UNIQUE NOT NULL
)`;

const user_roles = `CREATE TABLE user_roles (
    user_id INTEGER,
    role_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(RoleID) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
)`;

const roles_permissions = `CREATE TABLE roles_permissions (
    role_id INTEGER,
    permission_id INTEGER,
    FOREIGN KEY (role_id) REFERENCES roles(RoleID) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(PermissionID) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
)`;

const api_keys = `CREATE TABLE api_keys (
    key_id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_key TEXT NOT NULL,
    secret_key TEXT NOT NULL,
    email TEXT NOT NULL
)`;

const blacklist = `CREATE TABLE blacklist (
    blacklistID INTEGER PRIMARY KEY AUTOINCREMENT,
    jwtToken TEXT NOT NULL
)`;

let queries = [users, roles, permissions, user_roles, roles_permissions, api_keys, blacklist];
let table_list = ['users', 'roles', 'permissions', 'user_roles', 'roles_permissions', 'api_keys', 'blacklist'];

module.exports = { queries, table_list };
