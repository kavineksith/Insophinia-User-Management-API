'use strict';

const express = require('express');
const router  = express.Router();

const { authenticateToken } = require('../../middleware/tokenManage');
const { logoutControl }     = require('../../controllers/auth/logoutController');

/**
 * POST /auth/logout
 * Requires a valid access token. Blacklists it and revokes refresh token.
 */
router.post('/logout', authenticateToken, logoutControl);

module.exports = router;
