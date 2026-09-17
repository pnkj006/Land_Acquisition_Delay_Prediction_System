/**
 * @fileoverview express-validator chains for the Risk module.
 * All risk endpoints are GET requests with no body — validation here
 * only covers optional query params (e.g. pagination on /risk/history).
 */
const { query } = require('express-validator');

exports.riskHistoryQueryValidators = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];