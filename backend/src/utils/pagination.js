/**
 * @fileoverview Shared pagination helpers.
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

exports.getPagination = (query = {}) => {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isInteger(page) || page < 1) page = DEFAULT_PAGE;
  if (!Number.isInteger(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

exports.buildPaginationMeta = (page, limit, total) => ({
  page: Number(page),
  limit: Number(limit),
  total,
  totalPages: Math.ceil(total / limit) || 0,
});

/**
 * paginationMeta(total, page, limit) — alias matching import.controller.js's
 * call signature (total first, then page/limit), kept alongside
 * buildPaginationMeta for backward compatibility with existing callers.
 */
exports.paginationMeta = (total, page, limit) => ({
  page: Number(page),
  limit: Number(limit),
  total,
  totalPages: Math.ceil(total / limit) || 0,
});