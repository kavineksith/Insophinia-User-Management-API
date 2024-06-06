const express = require('express');
const router = express.Router();
const logoutController = require('../../controllers/auth/logoutController.js');

router.route('/')
    .post(logoutController.logoutControl);

module.exports = router;