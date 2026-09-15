/**
 * @fileoverview Shared pagination helpers.
 * Every list endpoint
 * so the envelope shape stays identical everywhere.
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Reads page/limit from req.query, clamps to valid ranges,
 * and computes the Prisma `skip` value.
 */
exports.getPagination = (query = {}) => {
  let page = Number.parseInt(query.page, 10);
  let limit = Number.parseInt(query.limit, 10);

  if (!Number.isInteger(page) || page < 1) page = DEFAULT_PAGE;
  if (!Number.isInteger(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Builds the pagination metadata block for the response envelope.
 */
exports.buildPaginationMeta = (page, limit, total) => ({
  page: Number(page),
  limit: Number(limit),
  total,
  totalPages: Math.ceil(total / limit) || 0,
});