/**
 * @fileoverview Recommendation Controller
 * Handles:
 * - Fetching active recommendations
 * - Fetching recommendations for a project
 * - Updating recommendation status
 * - Generating AI recommendations
 */

const prisma = require('../config/database')

const {
  assertProjectInScope,
  childScopeWhere,
} = require('../utils/scope')

const {
  sendSuccess,
  sendError,
} = require('../utils/response')

const {
  generateProjectRecommendations,
} = require('../services/recommendation.service')

/**
 * GET /recommendations
 *
 * Returns only ACTIVE recommendations.
 *
 * Visible:
 * - PENDING
 * - ACCEPTED
 *
 * Hidden:
 * - DISMISSED
 * - COMPLETED
 */
exports.getAllRecommendations = async (req, res, next) => {
  try {
    const scopeWhere = childScopeWhere(
      req.user,
      'project'
    )

    const recommendations =
      await prisma.recommendation.findMany({
        where: {
          ...scopeWhere,

          status: {
            in: ['PENDING', 'ACCEPTED'],
          },
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

        orderBy: {
          created_at: 'desc',
        },
      })

    const priorityOrder = {
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
    }

    recommendations.sort((a, b) => {
      const priorityA =
        priorityOrder[a.priority] || 4

      const priorityB =
        priorityOrder[b.priority] || 4

      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }

      return (
        new Date(b.created_at) -
        new Date(a.created_at)
      )
    })

    return sendSuccess(
      res,
      recommendations
    )
  } catch (error) {
    next(error)
  }
}

/**
 * GET /projects/:projectId/recommendations
 *
 * Returns active recommendations for one project.
 */
exports.getRecommendations = async (
  req,
  res,
  next
) => {
  try {
    const projectId = req.params.projectId

    const project =
      await prisma.project.findUnique({
        where: {
          project_id: projectId,
        },
      })

    if (!project) {
      return sendError(
        res,
        'Project not found',
        'NOT_FOUND',
        404
      )
    }

    // RBAC scope check
    await assertProjectInScope(
      req.user,
      project.id
    )

    const recommendations =
      await prisma.recommendation.findMany({
        where: {
          project_id: project.id,

          status: {
            in: ['PENDING', 'ACCEPTED'],
          },
        },

        orderBy: {
          created_at: 'desc',
        },
      })

    const priorityOrder = {
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
    }

    recommendations.sort((a, b) => {
      const priorityA =
        priorityOrder[a.priority] || 4

      const priorityB =
        priorityOrder[b.priority] || 4

      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }

      return (
        new Date(b.created_at) -
        new Date(a.created_at)
      )
    })

    return sendSuccess(
      res,
      recommendations
    )
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /recommendations/:recommendationId
 *
 * Changes recommendation status.
 *
 * Allowed:
 * PENDING
 * ACCEPTED
 * DISMISSED
 * COMPLETED
 */
exports.updateRecommendationStatus = async (
  req,
  res,
  next
) => {
  try {
    const recommendationId = Number(
      req.params.recommendationId
    )

    if (Number.isNaN(recommendationId)) {
      return sendError(
        res,
        'Invalid recommendation ID',
        'INVALID_PARAM',
        400
      )
    }

    const { status } = req.body

    const validStatuses = [
      'PENDING',
      'ACCEPTED',
      'DISMISSED',
      'COMPLETED',
    ]

    if (!validStatuses.includes(status)) {
      return sendError(
        res,
        'Invalid recommendation status',
        'INVALID_STATUS',
        400
      )
    }

    const scopeWhere = childScopeWhere(
      req.user,
      'project'
    )

    /**
     * Find recommendation while applying
     * project-level RBAC scope.
     */
    const recommendation =
      await prisma.recommendation.findFirst({
        where: {
          id: recommendationId,
          ...scopeWhere,
        },
      })

    if (!recommendation) {
      return sendError(
        res,
        'Recommendation not found',
        'NOT_FOUND',
        404
      )
    }

    const updatedRecommendation =
      await prisma.recommendation.update({
        where: {
          id: recommendationId,
        },

        data: {
          status,
        },
      })

    return sendSuccess(
      res,
      updatedRecommendation
    )
  } catch (error) {
    next(error)
  }
}

/**
 * POST /projects/:projectId/recommendations/generate
 *
 * Generates AI recommendations using Gemini.
 */
exports.generateRecommendations = async (
  req,
  res,
  next
) => {
  try {
    const projectId = req.params.projectId

    const project =
      await prisma.project.findUnique({
        where: {
          project_id: projectId,
        },
      })

    if (!project) {
      return sendError(
        res,
        'Project not found',
        'NOT_FOUND',
        404
      )
    }

    // RBAC scope check
    await assertProjectInScope(
      req.user,
      project.id
    )

    const result =
      await generateProjectRecommendations(
        projectId
      )

    return sendSuccess(
      res,
      result
    )
  } catch (error) {
    next(error)
  }
}