/**
 * @fileoverview Map routes
 */
const express = require('express');
const mapController = require('../controllers/map.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

const router = express.Router();

router.get('/map', authenticate, requireRole('ADMIN', 'PROJECT_MANAGER'), mapController.getMapData);

module.exports = router;
