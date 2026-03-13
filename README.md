# Insophinia — User Management & SSO Platform
### API Reference — Version 2.0.0

| | |
|---|---|
| **Framework** | Node.js + Express.js v4 |
| **Database** | SQLite 3 (WAL mode) |
| **Auth** | JWT (HS256) + Refresh Tokens |
| **Security** | RBAC, bcrypt-12, rate limiting |
| **License** | MIT |
| **Status** | Production-Ready |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Installation & Configuration](#3-installation--configuration)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [API Endpoints](#5-api-endpoints)
6. [Request & Response Examples](#6-request--response-examples)
7. [Security Reference](#7-security-reference)
8. [Middleware Stack](#8-middleware-stack)
9. [Bugs Fixed from v1.0](#9-bugs-fixed-from-v10)
10. [Conclusion & Disclaimer](#10-conclusion--disclaimer)

---

## 1. Overview

The Insophinia SSO Platform is a hardened, production-grade Single Sign-On API built with Node.js and Express.js. Version 2.0 is a ground-up security and reliability rewrite of the original platform, resolving all known bugs and elevating the security posture to enterprise standards.

### 1.1 What's New in v2.0

| Category | Improvement |
|---|---|
| Password verification | Fixed critical bcrypt bug — now uses `compare()` correctly |
| Token blacklisting | JTI-based blacklisting replaces broken full-token comparison |
| Refresh tokens | Full rotation with replay-attack detection and revocation |
| Token delivery | Refresh token in HttpOnly Secure cookie — inaccessible to JS |
| Account security | Lockout after configurable failed attempts with timed unlock |
| API key storage | Keys hashed with bcrypt-12 — never stored or returned in plaintext |
| Database layer | All queries fully promisified — no more silent async failures |
| Input validation | Validation + sanitization middleware on every mutating endpoint |
| Error handling | Stack traces never exposed in production responses |
| Audit trail | Structured audit log for every auth event and admin action |
| Rate limiting | Three-tier limiters: global, auth (strict), and API |
| Startup safety | JWT secrets must exist in `.env` — server refuses to start otherwise |

---

## 2. Architecture

### 2.1 Project Structure

```
sso-platform/
├── app.js                         Entry point — Express setup & middleware stack
├── .env.example                   Environment variable template
├── data/
│   └── database.js                Promisified SQLite + auto-migration + WAL mode
├── middleware/
│   ├── tokenManage.js             JWT access tokens + refresh token rotation
│   ├── hashPassword.js            Async bcrypt hash and compare
│   ├── keyManage.js               API/secret key generation with hashed storage
│   ├── authorizationManage.js     RBAC permission middleware factory
│   ├── adminVerifer.js            isAdmin gate middleware
│   ├── requestLimiter.js          Three-tier rate limiters
│   ├── validate.js                Input validators and body sanitizer
│   ├── corsOptions.js             Origin whitelist from environment
│   ├── eventLogger.js             Request logger + structured audit log
│   └── errorLogger.js             Global error handler (safe in production)
├── models/
│   ├── auth/profileModel.js       Login auth with lockout logic
│   ├── admin/userProfileModel.js  User CRUD — never exposes password hash
│   ├── admin/rolePermissionModel.js
│   ├── admin/userRoleModel.js
│   └── user/userModel.js          API key metadata (hashes only)
├── controllers/
│   ├── auth/   loginController, logoutController, refreshController
│   ├── admin/  profileController, rolePermissionController, userRoleController
│   └── user/   userController (API key management)
├── routes/
│   ├── auth/   loginRoute, logoutRoute, refreshRoute
│   ├── admin/  adminOperations, rolePermissionsManage, userRolesManage
│   └── api/    userOperations
└── scripts/
    └── adminSetup.js              First-run bootstrap: roles, permissions, admin user
```

### 2.2 Database Schema

All tables are created automatically on first start via an idempotent migration in `database.js`.

| Table | Key Columns | Purpose |
|---|---|---|
| `users` | `user_id`, `email`, `password_hash`, `is_active`, `failed_login_attempts`, `locked_until` | Core user accounts with lockout state |
| `roles` | `role_id`, `role_name` | Named roles (admin, user, …) |
| `permissions` | `permission_id`, `permission_name` | Granular permission strings |
| `user_roles` | `user_id`, `role_id` (composite PK) | Many-to-many user ↔ role mapping |
| `roles_permissions` | `role_id`, `permission_id` (composite PK) | Many-to-many role ↔ permission mapping |
| `api_keys` | `key_id`, `api_key_hash`, `secret_key_hash`, `key_prefix`, `user_id` | Hashed API credentials |
| `token_blacklist` | `jti`, `expires_at` | Revoked access token JTIs (auto-purged) |
| `refresh_tokens` | `token_id`, `user_id`, `expires_at`, `revoked` | Refresh token store with rotation tracking |
| `audit_log` | `user_id`, `action`, `ip_address`, `metadata` | Immutable security audit trail |

---

## 3. Installation & Configuration

### 3.1 Requirements

- Node.js v18 or later
- npm v9 or later
- SQLite 3 (included via `sqlite3` npm package)

### 3.2 Setup Steps

**Step 1** — Install dependencies:

```bash
npm install
```

**Step 2** — Create your environment file:

```bash
cp .env.example .env
```

**Step 3** — Generate strong JWT secrets and paste them into `.env`:

```bash
# Run twice — once for each secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Step 4** — Bootstrap admin user, roles, and permissions *(run once only)*:

```bash
npm run setup-admin
```

> This script creates the `admin` and `user` roles, all 12 default permissions, maps them to roles, and creates your first admin user — either interactively or from `ADMIN_EMAIL` / `ADMIN_PASSWORD` environment variables.

**Step 5** — Start the server:

```bash
npm start
```

### 3.3 Environment Variables

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | *(required)* | HS256 signing secret for access tokens — min 64 bytes hex |
| `JWT_REFRESH_SECRET` | *(required)* | Signing secret for refresh token metadata |
| `JWT_ACCESS_EXPIRES` | `15m` | Access token lifetime (e.g. `15m`, `1h`) |
| `JWT_REFRESH_EXPIRES` | `7d` | Refresh token lifetime |
| `PORT` | `8080` | HTTP server port |
| `HOST` | `127.0.0.1` | Bind address (use `0.0.0.0` behind a proxy) |
| `NODE_ENV` | `development` | Set to `production` to hide stack traces and enforce secure cookies |
| `DB_PATH` | `./sso.db` | Path to SQLite database file |
| `ALLOWED_ORIGINS` | *(none)* | Comma-separated CORS origin whitelist |
| `BCRYPT_ROUNDS` | `12` | bcrypt work factor for passwords and API keys |
| `MAX_LOGIN_ATTEMPTS` | `5` | Failed attempts before account lockout |
| `LOCKOUT_DURATION_MINUTES` | `15` | Duration of account lockout in minutes |

---

## 4. Authentication & Authorization

### 4.1 Token Flow

The platform uses a two-token authentication model designed to keep credentials off the JavaScript heap.

- **Access Token** — a short-lived JWT (default: 15 minutes) delivered in the JSON response body. Include it in every protected request as a `Bearer` token in the `Authorization` header.
- **Refresh Token** — a long-lived opaque UUID (default: 7 days) delivered exclusively as an `HttpOnly Secure SameSite=Strict` cookie. JavaScript in the browser can never read this value, protecting it from XSS attacks.

### 4.2 Login Flow

```
POST /auth/login
Content-Type: application/json

{ "email": "user@example.com", "password": "YourP@ssw0rd" }

── Response ───────────────────────────────────────────────────────────
HTTP 200 OK
Set-Cookie: refreshToken=<uuid>; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh

{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "expiresIn":   "15m",
  "tokenType":   "Bearer"
}
```

### 4.3 Authenticated Requests

```
GET /profiles
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### 4.4 Token Refresh

When the access token expires, call the refresh endpoint. The browser sends the `HttpOnly` cookie automatically. The server validates the refresh token, revokes it, issues a new pair *(rotation)*, and returns a fresh access token.

```
POST /auth/refresh
# (Cookie sent automatically by the browser)

── Response ───────────────────────────────────────────────────────────
HTTP 200 OK
{ "accessToken": "eyJ...", "expiresIn": "15m", "tokenType": "Bearer" }
```

> **Replay attack protection:** if an already-used refresh token is presented again, the platform immediately revokes **all** active sessions for that user and logs a security event.

### 4.5 Logout

```
POST /auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...

── Response ───────────────────────────────────────────────────────────
HTTP 200 OK
{ "message": "Logged out successfully" }
```

Logout blacklists the access token's JTI and revokes the refresh token in the database. The `HttpOnly` cookie is also cleared from the client.

### 4.6 Role-Based Access Control (RBAC)

Every protected route is guarded by one or more of these middleware layers, applied at the route level:

| Middleware | What it does |
|---|---|
| `authenticateToken` | Verifies JWT signature and expiry; checks JTI against blacklist |
| `isAdmin` | Confirms the user's `role_name` is `"admin"` in the database |
| `requirePermissions([...])` | Checks the user holds **all** listed permission strings via role join |

**Default permissions seeded by the setup script:**

```
create:user    read:user    update:user    delete:user
create:apikey  read:apikey  update:apikey  delete:apikey
read:roles     manage:roles
read:permissions  manage:permissions
```

---

## 5. API Endpoints

**Base URL:** `http://127.0.0.1:8080`

### 5.1 Auth Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public + rate-limited | Authenticate and receive access + refresh tokens |
| `POST` | `/auth/logout` | Bearer token | Revoke access token (JTI) and refresh cookie |
| `POST` | `/auth/refresh` | HttpOnly cookie | Rotate refresh token and issue new access token |

### 5.2 Admin — User Profile Endpoints

> All routes require: `authenticateToken` + `isAdmin`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/profiles` | Admin | Create a new user account |
| `GET` | `/profiles` | Admin | List all users (paginated: `?page=1&limit=20`) |
| `GET` | `/profiles/:id` | Admin | Retrieve a single user by ID |
| `PUT` | `/profiles/:id` | Admin | Update user fields (partial update supported) |
| `DELETE` | `/profiles/:id` | Admin | Permanently delete a user (cannot delete self) |

### 5.3 Admin — Role-Permission Endpoints

> All routes require: `authenticateToken` + `isAdmin`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/permissions/role-permissions` | Admin | Create one or more role-permission mappings |
| `GET` | `/permissions/role-permissions` | Admin | List all role-permission mappings with names |
| `PUT` | `/permissions/role-permissions` | Admin | Update mappings (requires `oldPermissionId`) |
| `DELETE` | `/permissions/role-permissions` | Admin | Delete one or more role-permission mappings |
| `GET` | `/permissions/role-permissions/:role_id/:perm_id` | Admin | Retrieve a specific mapping by IDs |

### 5.4 Admin — User-Role Endpoints

> All routes require: `authenticateToken` + `isAdmin`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/roles/user-roles` | Admin | Assign one or more roles to users |
| `GET` | `/roles/user-roles` | Admin | List all user-role mappings with names |
| `PUT` | `/roles/user-roles` | Admin | Update mappings (requires `oldRoleId`) |
| `DELETE` | `/roles/user-roles` | Admin | Remove one or more user-role assignments |
| `GET` | `/roles/user-roles/:user_id/:role_id` | Admin | Retrieve a specific user-role mapping |

### 5.5 API Key Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/keys` | Auth + `create:apikey` | Generate a new API key + secret *(shown once only)* |
| `GET` | `/api/keys` | Auth + Admin | List all key metadata across all users |
| `GET` | `/api/keys/:email` | Auth *(own or admin)* | List key metadata for a specific email |
| `PUT` | `/api/keys/:email` | Auth + `update:apikey` | Rotate key pair — returns new raw values once |
| `DELETE` | `/api/keys/:email` | Auth + `delete:apikey` | Revoke (soft-delete) all keys for an email |

### 5.6 Utility Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Public | Service info — name, version, status |
| `GET` | `/health` | Public | Health check — confirms DB connectivity |

---

## 6. Request & Response Examples

### 6.1 Create User (Admin)

```json
POST /profiles
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "firstName":     "Jane",
  "lastName":      "Doe",
  "emailAddress":  "jane.doe@example.com",
  "password":      "SecureP@ss1",
  "contactNumber": "+1-555-0100",
  "country":       "USA"
}
```

```json
// Response: 201 Created
{ "message": "User created successfully", "userId": 3 }
```

### 6.2 Generate API Key

```json
POST /api/keys
Authorization: Bearer <access_token>
Content-Type: application/json

{ "email": "jane.doe@example.com" }
```

```json
// Response: 201 Created
{
  "message":   "API key created. Store these values securely — they will not be shown again.",
  "keyId":     7,
  "apiKey":    "ak_a3f9b2c1...",
  "secretKey": "sk_8e4d71a0...",
  "keyPrefix": "ak_a3f9b2"
}
```

### 6.3 Assign Role to User (Admin)

```json
POST /roles/user-roles
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "userRoles": [
    { "userId": 3, "roleId": 2 }
  ]
}
```

```json
// Response: 201 Created
{ "message": "User roles created successfully" }
```

### 6.4 Validation Error Response

```json
// Response: 400 Bad Request
{
  "error": "Validation failed",
  "details": [
    "password must be >= 8 chars and include uppercase, lowercase, digit, and special character",
    "emailAddress must be a valid email"
  ]
}
```

### 6.5 Account Lockout Response

```json
// Response: 429 Too Many Requests
{
  "error": "Account locked. Try again in 14 minute(s)."
}
```

### 6.6 Expired Token Response

```json
// Response: 401 Unauthorized
{
  "error": "Access token expired. Use /auth/refresh."
}
```

---

## 7. Security Reference

| Control | Implementation |
|---|---|
| **Password hashing** | bcrypt with configurable rounds (default: 12) — async to avoid blocking |
| **JWT algorithm** | HS256 with explicit algorithm allowlist — rejects `none`/RS256 downgrade |
| **Token type enforcement** | `type: "access"` embedded in payload — prevents refresh token misuse |
| **Token revocation** | JTI-based blacklist with expiry — auto-purged every 10 minutes |
| **Refresh token security** | `HttpOnly Secure SameSite=Strict` cookie — XSS-proof delivery |
| **Replay attack prevention** | Refresh token rotation — reuse revokes all user sessions immediately |
| **Account lockout** | Configurable threshold + timed lockout — defeats brute-force attacks |
| **Timing attack resistance** | Dummy bcrypt compare when user not found — hides user existence |
| **API key storage** | bcrypt-hashed — raw values shown once, never stored or re-returned |
| **Input validation** | All mutating endpoints validate and sanitize request bodies |
| **Rate limiting** | Global 200 req/15min, Auth 10 req/15min, API 500 req/15min per IP |
| **Request size limit** | 10KB body limit — prevents body-bomb / memory exhaustion attacks |
| **Security headers** | Helmet: CSP, HSTS, X-Frame-Options, X-Content-Type, Referrer-Policy |
| **CORS hardening** | Explicit origin whitelist from `.env` — no wildcard allowed origins |
| **Error information leakage** | Stack traces hidden in production; client receives generic 500 message |
| **Startup validation** | Server exits immediately if `JWT_SECRET` or `JWT_REFRESH_SECRET` absent |
| **Audit logging** | Structured log of all auth events and admin actions with IP + UA |
| **Password exposure prevention** | `password_hash` never included in user query result sets |

---

## 8. Middleware Stack

The middleware applied to every incoming request, in order:

| Module | Scope | Purpose |
|---|---|---|
| `helmet` | Global | Sets 10+ security-related HTTP response headers |
| `cors` | Global | Enforces origin whitelist; handles pre-flight `OPTIONS` |
| `express.json` | Global | Parses JSON bodies; rejects requests over 10KB |
| `cookieParser` | Global | Parses cookies for `HttpOnly` refresh token access |
| `globalLimiter` | Global | 200 requests per IP per 15 minutes |
| `requestLogger` | Global | Logs method, path, IP, UA, and request ID to file |
| `authLimiter` | Auth routes | 10 requests per IP per 15 minutes — login and refresh |
| `sanitizeBody` | Mutating routes | Trims whitespace from all string body fields |
| `validateBody(fn)` | Mutating routes | Runs field-level validator; returns 400 with detail list |
| `authenticateToken` | Protected routes | Verifies JWT; checks JTI blacklist; sets `req.user` |
| `isAdmin` | Admin routes | Queries DB to confirm admin role for `req.user.id` |
| `requirePermissions` | Specific routes | Checks named permissions via RBAC join query |
| `errorHandler` | Global *(last)* | Catches all errors; hides internals in production |

---

## 9. Bugs Fixed from v1.0

The following critical and security bugs were identified in the original codebase and corrected in v2.0:

| # | Location | Bug Description |
|---|---|---|
| 1 | `loginController.js` | bcrypt password comparison always failed — was re-hashing the plaintext instead of calling `bcrypt.compare()` |
| 2 | `ratelimiter.js` | `module.export` typo (missing `"s"`) — rate limiter was never exported and thus never applied |
| 3 | `tokenManage.js` | `res.sendStatus(401).json()` crashes — `sendStatus()` ends the response; `.json()` after it throws "headers already sent" |
| 4 | `logoutController.js` | `res.sendStatus(204).json()` — HTTP 204 No Content cannot have a body; chained `.json()` always crashes |
| 5 | `database.js` | `require("./systemDB.db")` — cannot require a binary file; must pass path string to `sqlite3` constructor |
| 6 | `database.js` | `require("./quries.js")` — filename typo; module never loaded; database never initialized |
| 7 | All models | `await db.all()` / `db.get()` on raw `sqlite3` callbacks returns `undefined` — all model functions silently broken |
| 8 | `rolePermissionModel.js` | `forEach + async` — errors were swallowed; outer `try/catch` never fired; operations ran untracked |
| 9 | `userRoleModel.js` | Same `forEach + async` pattern — bulk operations had no error propagation |
| 10 | `adminProfile.js` | Called `generateAPIKeys()` and `bcrypt` without any imports — crashes immediately on startup |
| 11 | `errorLogger.js` | `require("./logEvents")` — wrong module name (`eventLogger`); crashes on any unhandled error |
| 12 | `authorizationManage.js` | Defined as `function(userId, perms)` but called as `UserAuthorization([...])(req,res,next)` — completely broken signatures |
| 13 | `adminVerifer.js` | Called `getUserIdFromRequest()` which was never imported — always throws `ReferenceError` |
| 14 | `tokenManage.js` | `JWT_SECRET` regenerated on every server restart — invalidates all existing user sessions |
| 15 | `profileModel.js` | Login compared freshly-hashed values — bcrypt re-hash always produces a different result; login never worked |

---

## 10. Conclusion & Disclaimer

Insophinia SSO Platform v2.0 delivers a fully functional, enterprise-grade authentication and authorization API. Every layer — from database schema to HTTP response headers — has been hardened against the most common web security threats including brute-force, replay attacks, XSS token theft, timing attacks, and information leakage.

The platform is suitable as a production SSO backbone for small to medium deployments, or as a foundation for building larger identity management systems. For high-availability production environments, consider adding PostgreSQL as a database backend and deploying behind an HTTPS-terminating reverse proxy such as Nginx or Caddy.

> **⚠️ Disclaimer**
>
> This project is developed for educational purposes. It is not intended for unsupervised industrial or commercial use without independent security review. The authors disclaim liability for any damages arising from deployment of this software in production environments without appropriate due diligence.

---

*Licensed under the [MIT License](https://github.com/kavineksith/Insophinia-User-Management-API/blob/main/LICENSE)*