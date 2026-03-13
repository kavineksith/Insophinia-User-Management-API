'use strict';

const express = require('express');
const router  = express.Router();

const { authenticateToken } = require('../../middleware/tokenManage');
const { isAdmin }           = require('../../middleware/adminVerifer');
const permController        = require('../../controllers/admin/rolePermissionController');

router.use(authenticateToken, isAdmin);

router.route('/role-permissions')
    .post(permController.createRolePermissionsController)
    .get(permController.readRolePermissionsController)
    .put(permController.updateRolePermissionsController)
    .delete(permController.deleteRolePermissionsController);

router.route('/role-permissions/:role_id/:permission_id')
    .get(permController.readRolePermissionController);

module.exports = router;
