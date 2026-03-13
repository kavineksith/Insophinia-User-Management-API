'use strict';

const express = require('express');
const router  = express.Router();

const { authLimiter }     = require('../../middleware/requestLimiter');
const { refreshControl }  = require('../../controllers/auth/refreshController');

/**
 * POST /auth/refresh
 * Reads HttpOnly cookie 'refreshToken', issues new access + refresh token pair.
 */
router.post('/refresh', authLimiter, refreshControl);

module.exports = router;
