/**
 * @fileoverview Import Controller
 */
const importService = require('../services/import.service');
const { sendSuccess, sendError } = require('../utils/response');
const { getPagination, paginationMeta } = require('../utils/pagination');

exports.importProjects = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded', 'FILE_MISSING', 400);
    }

    const result = await importService.importProjects(req.file, req.user.id);
    return sendSuccess(res, result, 'Import completed', 201);
  } catch (error) {
    next(error);
  }
};

exports.listImports = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const result = await importService.listImports(page, limit, skip);
    const meta = paginationMeta(result.total, page, limit);

    return sendSuccess(res, { items: result.items, pagination: paginationMeta(result.total, page, limit) });
  } catch (error) {
    next(error);
  }
};
