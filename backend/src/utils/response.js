/**
 * @fileoverview Helpers so every controller returns the exact same envelope.
 */

/**
 * sendSuccess(res, data, message, statusCode)
 */
exports.sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

/**
 * sendError(res, message, code, statusCode, details)
 */
exports.sendError = (res, message = 'Something went wrong', code = 'ERROR', statusCode = 500, details = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: { code, details },
  });
};

/**
 * sendPaginated(res, items, page, limit, total, message)
 */
exports.sendPaginated = (res, items, page, limit, total, message = 'Records retrieved successfully') => {
  return res.status(200).json({
    success: true,
    message,
    data: items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  });
};