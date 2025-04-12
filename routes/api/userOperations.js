const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user/userController.js');

router.route('/')
    .post(userController.createApiSecretKeys)
    .get(userController.readAllApiSecretKeys); //  route and method for Admin only to check all keys.

router.route('/:email')
    .get(userController.readApiSecretKeys)
    .put(userController.updateApiSecretKeys)
    .delete(userController.deleteApiSecretKeys);

module.exports = router;
