const prisma = require('../config/database')
const { generateRecommendations } = require('./gemini.service')

async function generateProjectRecommendations(projectId) {
  // Find project using your public project_id, e.g. SEED-P1
  const project = await prisma.project.findUnique({
    where: {
      project_id: projectId,
    },
  })

  if (!project) {
    const error = new Error('Project not found')
    error.statusCode = 404
    throw error
  }

  // Get latest completed prediction
  const latestPrediction = await prisma.riskPrediction.findFirst({
    where: {
      project_id: project.id,
      status: 'DONE',
    },
    orderBy: {
      predicted_at: 'desc',
    },
    include: {
      stage_risks: true,
    },
  })

  // Get recent project status history
  const statusHistory = await prisma.projectStatusHistory.findMany({
    where: {
      project_id: project.id,
    },
    orderBy: {
      recorded_at: 'desc',
    },
    take: 5,
  })

  // Build the exact information Gemini is allowed to use
  const projectContext = {
    project: {
      projectId: project.project_id,
      type: project.project_type,
      location: project.location,
      state: project.state,
      district: project.district,

      landAreaHectares: project.land_area_hectares,
      affectedFamilies: project.number_of_affected_families,

      compensationStatus: project.compensation_status,
      approvalTimelineDays: project.approval_timeline_days,
      legalDisputesCount: project.legal_disputes_count,
      possessionStatus: project.possession_status,

      rehabilitationProgress:
        project.rehabilitation_progress_pct,

      stakeholderResponsiveness:
        project.stakeholder_responsiveness,

      historicalPerformance:
        project.historical_performance_score,

      currentStage: project.current_stage,
    },

    risk: latestPrediction
      ? {
          prediction: latestPrediction.prediction,
          probability: latestPrediction.probability,
          riskScore: latestPrediction.risk_score,
          riskLevel: latestPrediction.risk_level,
          riskFactors: latestPrediction.risk_factors,
          modelVersion: latestPrediction.model_version,

          stageRisks: latestPrediction.stage_risks.map((stageRisk) => ({
            stage: stageRisk.stage,
            risk: stageRisk.risk,
          })),
        }
      : null,

    recentStatusHistory: statusHistory.map((history) => ({
      stage: history.stage,
      compensationStatus: history.compensation_status,
      approvalTimelineDays: history.approval_timeline_days,
      legalDisputesCount: history.legal_disputes_count,
      possessionStatus: history.possession_status,
      rehabilitationProgress:
        history.rehabilitation_progress_pct,
      stakeholderResponsiveness:
        history.stakeholder_responsiveness,
      recordedAt: history.recorded_at,
    })),
  }

  // Ask Gemini
  const generated = await generateRecommendations(projectContext)
  const recommendations = await prisma.$transaction(
  generated.map((item) =>
    prisma.recommendation.create({
      data: {
        project_id: project.id,

        prediction_id: latestPrediction
          ? latestPrediction.id
          : null,

        recommendation: item.recommendation,

        priority: item.priority,

        status: 'PENDING',
      },
    })
  )
)

  return {
    project,
    prediction: latestPrediction,
    recommendations: generated,
  }
}

module.exports = {
  generateProjectRecommendations,
}