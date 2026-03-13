'use strict';

const express = require('express');
const router  = express.Router();

const { authenticateToken } = require('../../middleware/tokenManage');
const { isAdmin }           = require('../../middleware/adminVerifer');
const userRoleController    = require('../../controllers/admin/userRoleController');

router.use(authenticateToken, isAdmin);

router.route('/user-roles')
    .post(userRoleController.createUserRolesController)
    .get(userRoleController.readUserRolesController)
    .put(userRoleController.updateUserRolesController)
    .delete(userRoleController.deleteUserRolesController);

router.route('/user-roles/:user_id/:role_id')
    .get(userRoleController.readUserRoleController);

module.exports = router;
