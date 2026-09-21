/**
 * @fileoverview Recommendation Controller
 * Uses assertProjectInScope for scope enforcement.
 */
const prisma = require('../config/database');
const { assertProjectInScope, projectScopeWhere } = require('../utils/scope');
const { sendSuccess, sendError } = require('../utils/response');

exports.getAllRecommendations = async (req, res, next) => {
  try {
    const { childScopeWhere } = require('../utils/scope');
    const scopeWhere = childScopeWhere(req.user, 'project');

    const recommendations = await prisma.recommendation.findMany({
      where: {
        ...scopeWhere,
      },
      include: {
        project: {
          select: {
            project_id: true,
            location: true,
            current_stage: true,
            risk_score: true,
            project_type: true,
            district: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

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

exports.getRecommendations = async (req, res, next) => {
  try {
    const projectIdStr = req.params.projectId;
    
    const project = await prisma.project.findUnique({
      where: { project_id: projectIdStr }
    });
    
    if (!project) {
      return sendError(res, 'Project not found', 'NOT_FOUND', 404);
    }

    // Scope check — produces 404 if not found or out of scope
    await assertProjectInScope(req.user, project.id);

    const recommendations = await prisma.recommendation.findMany({
      where: { project_id: project.id },
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

    const { childScopeWhere } = require('../utils/scope');
    const scopeWhere = childScopeWhere(req.user, 'project');

    // Load recommendation with scope applied
    const recommendation = await prisma.recommendation.findFirst({
      where: { 
        id: recommendationId,
        ...scopeWhere 
      },
    });

    if (!recommendation) {
      return sendError(res, 'Recommendation not found', 'NOT_FOUND', 404);
    }

    const updatedRecommendation = await prisma.recommendation.update({
      where: { id: recommendationId },
      data: { status },
    });

    return sendSuccess(res, updatedRecommendation);
  } catch (error) {
    next(error);
  }
};
