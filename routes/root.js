'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../data/database');

// ── Welcome ──────────────────────────────────────────────────────────────────
router.get('/', (_req, res) => {
    res.status(200).json({
        service : 'SSO Platform API',
        version : '2.0.0',
        status  : 'operational',
    });
});

// ── Health check ─────────────────────────────────────────────────────────────
router.get('/health', async (_req, res, next) => {
    try {
        await db.get('SELECT 1');
        res.status(200).json({ status: 'ok', db: 'connected' });
    } catch (err) {
        next(err);
    }
});

// ── 404 catch-all (handled centrally in app.js) ──────────────────────────────
module.exports = router;
