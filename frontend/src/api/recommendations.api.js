import { fetchClient } from './fetchClient'
import { ACTION_STATUS, PRIORITY_LEVELS } from '../utils/constants'

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
  IN_PROGRESS: 'IN_PROGRESS',
  ACCEPTED: 'ACCEPTED',
  COMPLETED: 'COMPLETED',
  DISMISSED: 'DISMISSED',
}

function mapRecommendation(rec) {
  return {
    ...rec,
    id: rec.id,
    projectId: rec.project_id,
    type: deriveType(rec.title),
    status: rec.status, // PENDING, ACCEPTED, etc.
    project: rec.project ? {
      id: rec.project.project_id,
      name: rec.project.location,
      district: rec.project.district,
      type: rec.project.project_type,
      stage: rec.project.current_stage,
      riskScore: rec.project.risk_score,
    } : null,
  }
}

export async function getRecommendations(projectId) {
  const res = await fetchClient(`/projects/${projectId}/recommendations`)
  return { data: res.data.map(mapRecommendation) }
}

export async function getAllRecommendations() {
  const res = await fetchClient(`/recommendations`)
  return { data: res.data.map(mapRecommendation) }
}

export async function updateRecommendationStatus(recId, status) {
  const res = await fetchClient(`/recommendations/${recId}`, {
    method: 'PATCH',
    body: { status }
  })
  return { data: mapRecommendation(res.data) }
}
