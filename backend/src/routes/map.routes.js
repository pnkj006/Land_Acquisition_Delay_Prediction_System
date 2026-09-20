/**
 * @fileoverview Map routes
 * §6 of the RBAC V7 plan.
 */
const express = require('express');
const mapController = require('../controllers/map.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

const router = express.Router();

// GET /map — projects:read; service applies scope filter
router.get(
  '/',
  authenticate,
  authorize('projects', 'read'),
  mapController.getMapData
);

module.exports = router;
