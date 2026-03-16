'use strict';

require('dotenv').config();

// ── Validate critical env vars before starting ──────────────────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
    console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
    console.error('[FATAL] Copy .env.example to .env and fill in the values.');
    process.exit(1);
}

const express        = require('express');
const helmet         = require('helmet');
const cors           = require('cors');
const cookieParser   = require('cookie-parser');
const csurf          = require('csurf');

const corsOptions          = require('./middleware/corsOptions');
const { requestLogger }    = require('./middleware/eventLogger');
const errorHandler         = require('./middleware/errorLogger');
const { globalLimiter }    = require('./middleware/requestLimiter');

const app = express();

// ── Trust proxy (needed when behind nginx/load-balancer) ────────────────────
app.set('trust proxy', 1);

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc : ["'self'"],
            scriptSrc  : ["'self'"],
            styleSrc   : ["'self'"],
            imgSrc     : ["'self'", 'data:'],
            connectSrc : ["'self'"],
            fontSrc    : ["'self'"],
            objectSrc  : ["'none'"],
            frameSrc   : ["'none'"],
        },
    },
    hsts              : { maxAge: 31_536_000, includeSubDomains: true, preload: true },
    noSniff           : true,
    xssFilter         : true,
    frameguard        : { action: 'deny' },
    referrerPolicy    : { policy: 'strict-origin-when-cross-origin' },
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
}));

// ── Request parsing ─────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));           // Prevent body-size attacks
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser());

// ── CSRF protection for state-changing requests ────────────────────────────
const csrfProtection = csurf({
    cookie: false, // rely on existing cookie/session mechanisms if present
});

app.use((req, res, next) => {
    // Only apply CSRF protection to methods that are supposed to be unsafe
    const method = req.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
        return next();
    }

    csrfProtection(req, res, (err) => {
        if (err) {
            return next(err);
        }
        // Expose token to downstream handlers if they want to send it to clients
        if (typeof res.locals === 'object') {
            res.locals.csrfToken = req.csrfToken();
        }
        next();
    });
});

// ── Global rate limit & logging ─────────────────────────────────────────────
app.use(globalLimiter);
app.use(requestLogger);

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/',            require('./routes/root'));
app.use('/auth',        require('./routes/auth/loginRoute'));
app.use('/auth',        require('./routes/auth/logoutRoute'));
app.use('/auth',        require('./routes/auth/refreshRoute'));
app.use('/api/keys',    require('./routes/api/userOperations'));
app.use('/profiles',    require('./routes/admin/adminOperations'));
app.use('/permissions', require('./routes/admin/rolePermissionsManage'));
app.use('/roles',       require('./routes/admin/userRolesManage'));

// ── 404 catch-all ───────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Resource not found' });
});

// ── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '127.0.0.1';

app.listen(PORT, HOST, () => {
    const env = process.env.NODE_ENV || 'development';
    console.log(`[${new Date().toISOString()}] SSO Platform running on http://${HOST}:${PORT} [${env}]`);
});

module.exports = app;
