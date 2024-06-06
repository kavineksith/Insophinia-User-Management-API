const express = require('express');
const router = express.Router();
const loginController = require('../../controllers/auth/loginController.js');

router.route('/')
    .post(loginController.loginControl);

module.exports = router;