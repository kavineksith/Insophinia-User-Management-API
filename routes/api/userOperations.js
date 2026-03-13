'use strict';

const express = require('express');
const router  = express.Router();

const { authenticateToken }           = require('../../middleware/tokenManage');
const { isAdmin }                     = require('../../middleware/adminVerifer');
const { requirePermissions }          = require('../../middleware/authorizationManage');
const { apiLimiter }                  = require('../../middleware/requestLimiter');
const userController                  = require('../../controllers/user/userController');

// Every API key route requires authentication + per-IP rate limit
router.use(authenticateToken, apiLimiter);

router.route('/')
    .post(requirePermissions(['create:apikey']), userController.createApiSecretKeys)
    .get(isAdmin, userController.readAllApiSecretKeys);

router.route('/:email')
    .get(userController.readApiSecretKeys)                                          // Self or admin — checked inside controller
    .put(requirePermissions(['update:apikey']), userController.rotateApiSecretKeys)
    .delete(requirePermissions(['delete:apikey']), userController.revokeApiSecretKeys);

module.exports = router;
