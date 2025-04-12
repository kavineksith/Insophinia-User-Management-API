const express = require('express');
const router = express.Router();
const userRoleController = require('../../controllers/admin/userRoleController.js');

router.route('/user-roles')
    .post(userRoleController.createUserRolesController)
    .get(userRoleController.readUserRolesController)
    .put(userRoleController.updateUserRolesController)
    .delete(userRoleController.deleteUserRolesController);

router.route('/user-roles/:user_id/:role_id')
    .get(userRoleController.readUserRoleController);

module.exports = router;
