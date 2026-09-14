/**
 * @fileoverview Helpers so every controller returns the exact same envelope.
 */
exports.success = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

exports.paginated = (res, message, items, page, limit, total) => {
  return res.status(200).json({
    success: true,
    message,
    data: {
      items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
};