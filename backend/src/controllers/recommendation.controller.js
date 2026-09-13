/**
 * @fileoverview Recommendation Controller
 */
const prisma = require('../config/database');
const auditService = require('../services/audit.service');
const { sendSuccess, sendError } = require('../utils/response');

exports.getRecommendations = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return sendError(res, 'Invalid project ID', 'INVALID_PARAM', 400);
    }

    if (req.user.role === 'PROJECT_MANAGER') {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project || project.project_manager_id !== req.user.id) {
        return sendError(res, 'Forbidden', 'FORBIDDEN', 403);
      }
    }

    const recommendations = await prisma.recommendation.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: 'desc' } // Priority sort handled in JS below (HIGH→MEDIUM→LOW)
    });

    // Simple JS sort to ensure HIGH -> MEDIUM -> LOW
    const priorityOrder = { 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
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

    const recommendation = await prisma.recommendation.findUnique({
      where: { id: recommendationId },
      include: { project: true }
    });

    if (!recommendation) {
      return sendError(res, 'Recommendation not found', 'NOT_FOUND', 404);
    }

    if (req.user.role === 'PROJECT_MANAGER' && recommendation.project.project_manager_id !== req.user.id) {
      return sendError(res, 'Forbidden', 'FORBIDDEN', 403);
    }

    const updatedRecommendation = await prisma.recommendation.update({
      where: { id: recommendationId },
      data: { status }
    });

    await auditService.log(req.user.id, 'UPDATE_RECOMMENDATION', recommendation.project_id, { recommendationId, newStatus: status });

    return sendSuccess(res, updatedRecommendation);
  } catch (error) {
    next(error);
  }
};
