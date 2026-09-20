/**
 * @fileoverview Alert Controller — passes req.user for scope filtering.
 */
const alertService = require('../services/alert.service');
const { sendSuccess, sendError } = require('../utils/response');
const { getPagination, paginationMeta } = require('../utils/pagination');

exports.getAlerts = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filters = {
      severity: req.query.severity,
      isRead: req.query.isRead,
    };

    const result = await alertService.getAlerts(req.user, filters, page, limit, skip);
    const meta = paginationMeta(result.total, page, limit);

    return sendSuccess(res, { items: result.items, meta });
  } catch (error) {
    next(error);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const alertId = parseInt(req.params.alertId);
    if (isNaN(alertId)) {
      return sendError(res, 'Invalid alert ID', 'INVALID_PARAM', 400);
    }

    const updatedAlert = await alertService.markRead(alertId, req.user);
    return sendSuccess(res, updatedAlert);
  } catch (error) {
    next(error);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    const result = await alertService.markAllRead(req.user);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
