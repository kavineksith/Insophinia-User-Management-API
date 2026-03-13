'use strict';

const rateLimit = require('express-rate-limit');

const jsonTooManyRequests = (_req, res) => {
    res.status(429).json({
        error      : 'Too many requests. Please try again later.',
        retryAfter : '15 minutes',
    });
};

// ── Global limiter: 200 requests per 15 min per IP ───────────────────────────
const globalLimiter = rateLimit({
    windowMs        : 15 * 60 * 1000,
    max             : 200,
    standardHeaders : true,   // Return rate limit info in `RateLimit-*` headers
    legacyHeaders   : false,
    handler         : jsonTooManyRequests,
    keyGenerator    : (req) => req.ip,
    skip            : (req) => req.method === 'OPTIONS',
});

// ── Auth limiter: 10 attempts per 15 min per IP ──────────────────────────────
// Strict protection against brute-force / credential-stuffing attacks
const authLimiter = rateLimit({
    windowMs        : 15 * 60 * 1000,
    max             : 10,
    standardHeaders : true,
    legacyHeaders   : false,
    handler         : jsonTooManyRequests,
    keyGenerator    : (req) => req.ip,
});

// ── API key limiter: 500 requests per 15 min per IP ──────────────────────────
const apiLimiter = rateLimit({
    windowMs        : 15 * 60 * 1000,
    max             : 500,
    standardHeaders : true,
    legacyHeaders   : false,
    handler         : jsonTooManyRequests,
    keyGenerator    : (req) => req.ip,
});

module.exports = { globalLimiter, authLimiter, apiLimiter };
