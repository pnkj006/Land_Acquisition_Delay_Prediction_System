/**
 * @fileoverview Audit Controller
 */
const auditService = require('../services/audit.service');
const { sendSuccess } = require('../utils/response');
const { getPagination, paginationMeta } = require('../utils/pagination');

exports.getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filters = {
      userId: req.query.userId,
      resource: req.query.resource,
      resourceId: req.query.resourceId,
      action: req.query.action
    };

    const result = await auditService.getAuditLogs(filters, page, limit, skip);
    const meta = paginationMeta(result.total, page, limit);

    return sendSuccess(res, { items: result.items, meta });
  } catch (error) {
    next(error);
  }
};
