const express = require('express');
const router = express.Router();
const profileController = require('../../controllers/admin/profileController.js');

router.route('/')
    .post(profileController.createUserController)
    .get(profileController.readUsersController);

router.route('/:id')
    .get(profileController.readUserController)
    .put(profileController.updateUserController)
    .delete(profileController.deleteUserController);

module.exports = router;