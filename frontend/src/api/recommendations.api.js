import { fetchClient } from './fetchClient'
import { getRiskPrediction } from './risk.api'


// Note: TYPE_KEYWORDS kept for UI categorisation since backend only provides title and priority
const TYPE_KEYWORDS = [
  ['Legal', ['legal', 'court', 'dispute', 'litigation']],
  ['Compensation', ['compensation', 'disbursement', 'installment']],
  ['Approval', ['approval', 'authority', 'clearance']],
  ['Documentation', ['documentation', 'records', 'survey']],
  ['R&R', ['r&r', 'gram sabha', 'rehabilitation']],
  ['Field Operations', ['verification', 'field']],
]

function deriveType(title) {
  const text = String(title).toLowerCase()
  for (const [type, words] of TYPE_KEYWORDS) {
    if (words.some((word) => text.includes(word))) return type
  }
  return 'General'
}

export const RECOMMENDATION_STATUSES = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  COMPLETED: 'COMPLETED',
  DISMISSED: 'DISMISSED',
}

function mapRecommendation(rec, risk = null) {
  const topFactor = risk?.riskFactors?.[0]

  return {
    ...rec,

    id: rec.id,
    projectId: rec.project_id,

    title: rec.recommendation,
    recommendation: rec.recommendation,
    type: deriveType(rec.recommendation),
    status: rec.status,

    priority: rec.priority,

    risk: risk
      ? {
          topFactor: topFactor?.feature ?? '—',
          delayProbability: Number(
            (Number(risk.probability ?? 0) * 100).toFixed(2)
          ),
          riskScore: Number(
            Number(risk.riskScore ?? 0).toFixed(2)
          ),
          riskLevel: risk.riskLevel,
          prediction: risk.prediction,
          impact: topFactor?.impact ?? '—',
          shapValue: topFactor?.shap_value ?? null,
        }
      : null,

    project: rec.project
      ? {
          id: rec.project.project_id,
          project_id: rec.project.project_id,

          // Use the actual project name if backend provides it.
          name:
            rec.project.name ??
            rec.project.project_name ??
            rec.project.location ??
            rec.project.project_id,

          project_name:
            rec.project.name ??
            rec.project.project_name ??
            rec.project.location ??
            rec.project.project_id,

          district: rec.project.district,

          type:
            rec.project.project_type ??
            'Project',

          project_type:
            rec.project.project_type ??
            'Project',

          stage: rec.project.current_stage,

          current_stage: rec.project.current_stage,

          location: rec.project.location,

          riskScore: rec.project.risk_score,

          risk_score: rec.project.risk_score,
        }
      : null,
  }
}

export async function getRecommendations(projectId) {
  const res = await fetchClient(`/projects/${projectId}/recommendations`)
  return { data: res.data.map(mapRecommendation) }
}

export async function getAllRecommendations() {
  const res = await fetchClient('/recommendations')

  const recommendations = await Promise.all(
    res.data.map(async (rec) => {
      try {
        const projectId = rec.project?.project_id

        if (!projectId) {
          return mapRecommendation(rec, null)
        }

        const risk = await getRiskPrediction(projectId)

        console.log(`ML RISK FOR RECOMMENDATION ${projectId}:`, risk)

        return mapRecommendation(rec, risk)
      } catch (error) {
        console.error(
          `Failed to fetch ML risk for ${rec.project?.project_id}:`,
          error
        )

        return mapRecommendation(rec, null)
      }
    })
  )

  return {
    data: recommendations,
  }
}

export async function updateRecommendationStatus(recId, status) {
  const res = await fetchClient(`/recommendations/${recId}`, {
    method: 'PATCH',
    body: { status }
  })
  return { data: mapRecommendation(res.data) }
}
export async function generateRecommendations(projectId) {
  const res = await fetchClient(`/projects/${projectId}/recommendations/generate`, {
    method: 'POST',
  })

  return res.data
}
