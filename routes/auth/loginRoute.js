'use strict';

const express = require('express');
const router  = express.Router();

const { authLimiter }        = require('../../middleware/requestLimiter');
const { sanitizeBody, validateBody, validateLoginBody } = require('../../middleware/validate');
const { loginControl }       = require('../../controllers/auth/loginController');

/**
 * POST /auth/login
 * Public — apply strict rate limit + input validation before hitting the controller.
 */
router.post(
    '/login',
    authLimiter,
    sanitizeBody,
    validateBody(validateLoginBody),
    loginControl,
);

module.exports = router;
