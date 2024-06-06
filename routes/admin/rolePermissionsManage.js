const express = require('express');
const router = express.Router();
const permissionController = require('../../controllers/admin/rolePermissionController.js');

router.route('/role-permissions')
    .post(permissionController.createRolePermissionsController)
    .get(permissionController.readRolePermissionsController)
    .put(permissionController.updateRolePermissionsController)
    .delete(permissionController.deleteRolePermissionsController);

router.route('/role-permissions/:role_id/:permission_id')
    .get(permissionController.readRolePermissionController);

module.exports = router;
