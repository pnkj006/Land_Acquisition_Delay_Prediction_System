/**
 * @fileoverview Alert Controller — passes req.user for scope filtering.
 */
const alertService = require('../services/alert.service');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { getPagination } = require('../utils/pagination');

exports.getAlerts = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filters = {
      severity: req.query.severity,
      isRead: req.query.isRead,
    };

    const result = await alertService.getAlerts(req.user, filters, page, limit, skip);
    return res.status(200).json({
      success: true,
      message: 'Alerts retrieved successfully',
      data: result.items,
      unreadCount: result.unreadCount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.total,
        totalPages: Math.ceil(result.total / limit) || 0,
      },
    });
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
