'use strict';

// Load allowed origins from .env — never allow arbitrary origins in production
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

// In development, also allow no-origin (e.g. curl / Postman)
const IS_DEV = process.env.NODE_ENV !== 'production';

const corsOptions = {
    origin(origin, callback) {
        // Allow requests with no origin only in dev (curl, Postman)
        if (!origin && IS_DEV) return callback(null, true);

        if (ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }

        callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    methods          : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders   : ['Authorization', 'Content-Type', 'X-Requested-With'],
    exposedHeaders   : ['X-Request-Id'],
    credentials      : true,        // Required for HttpOnly cookie (refresh token)
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge           : 86_400,      // Pre-flight cached for 24h
};

module.exports = corsOptions;
