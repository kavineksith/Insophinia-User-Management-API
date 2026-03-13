'use strict';

const express = require('express');
const router  = express.Router();

const { authenticateToken }    = require('../../middleware/tokenManage');
const { isAdmin }              = require('../../middleware/adminVerifer');
const {
    sanitizeBody,
    validateBody,
    validateParams,
    validateCreateUserBody,
    validateUpdateUserBody,
    validateIdParam,
} = require('../../middleware/validate');
const profileController = require('../../controllers/admin/profileController');

// All profile routes: must be authenticated + admin
router.use(authenticateToken, isAdmin);

router.route('/')
    .post(sanitizeBody, validateBody(validateCreateUserBody), profileController.createUserController)
    .get(profileController.readUsersController);

router.route('/:id')
    .get(validateParams(validateIdParam), profileController.readUserController)
    .put(
        validateParams(validateIdParam),
        sanitizeBody,
        validateBody(validateUpdateUserBody),
        profileController.updateUserController,
    )
    .delete(validateParams(validateIdParam), profileController.deleteUserController);

module.exports = router;
