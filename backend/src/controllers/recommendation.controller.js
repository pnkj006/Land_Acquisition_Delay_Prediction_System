/**
 * @fileoverview Recommendation Controller
 * Uses assertProjectInScope for scope enforcement.
 */
const prisma = require('../config/database');
const { assertProjectInScope, projectScopeWhere } = require('../utils/scope');
const { sendSuccess, sendError } = require('../utils/response');

exports.getRecommendations = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return sendError(res, 'Invalid project ID', 'INVALID_PARAM', 400);
    }

    // Scope check — produces 404 if not found or out of scope
    await assertProjectInScope(req.user, projectId);

    const recommendations = await prisma.recommendation.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: 'desc' },
    });

    // Sort by priority
    const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
    recommendations.sort((a, b) => {
      const pA = priorityOrder[a.priority] || 4;
      const pB = priorityOrder[b.priority] || 4;
      if (pA !== pB) return pA - pB;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return sendSuccess(res, recommendations);
  } catch (error) {
    next(error);
  }
};

exports.updateRecommendationStatus = async (req, res, next) => {
  try {
    const recommendationId = parseInt(req.params.recommendationId);
    if (isNaN(recommendationId)) {
      return sendError(res, 'Invalid recommendation ID', 'INVALID_PARAM', 400);
    }

    const { status } = req.body;
    const validStatuses = ['PENDING', 'ACCEPTED', 'DISMISSED', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 'Invalid status', 'INVALID_STATUS', 400);
    }

    // Load recommendation with its project
    const recommendation = await prisma.recommendation.findUnique({
      where: { id: recommendationId },
    });

    if (!recommendation) {
      return sendError(res, 'Recommendation not found', 'NOT_FOUND', 404);
    }

    // Scope check through recommendation's project — 404 if out of scope
    await assertProjectInScope(req.user, recommendation.project_id);

    const updatedRecommendation = await prisma.recommendation.update({
      where: { id: recommendationId },
      data: { status },
    });

    return sendSuccess(res, updatedRecommendation);
  } catch (error) {
    next(error);
  }
};
