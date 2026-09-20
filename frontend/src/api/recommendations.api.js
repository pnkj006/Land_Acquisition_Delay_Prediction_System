import apiClient from './apiClient';

export async function getRecommendations(projectId) {
  const res = await apiClient.get(`/projects/${projectId}/recommendations`);
  return res.data.data;
}

export async function updateRecommendationStatus(projectId, recId, payload) {
  const res = await apiClient.patch(`/recommendations/${recId}`, payload);
  return res.data.data;
}

/* ------------------------------------------------------------------ */
/* Workspace extensions — ADDITIVE ONLY.                              */
/* getRecommendations() above is untouched, so Project Details and     */
/* the Dashboard keep working byte-for-byte.                           */
/* ------------------------------------------------------------------ */

/** Statuses used by the recommendations workspace (matches the backend's
 * RecommendationStatus enum: Pending/Accepted/Completed/Dismissed, plus the
 * legacy 'In Progress' already present in the demo data). */
export const RECOMMENDATION_STATUSES = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  ACCEPTED: 'Accepted',
  COMPLETED: 'Completed',
  DISMISSED: 'Dismissed',
}

/**
 * Presentation metadata only: the mock data model has no explicit category
 * field, so a type is derived from the recommendation's own title keywords
 * (same precedent as FIELD_UPDATE_TYPES in constants.js). Unmatched titles
 * are typed 'General' — nothing is invented beyond the title itself.
 */
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

/** Legacy demo data uses ACTION_STATUS 'Done' — normalised to 'Completed'. */
function normalizeStatus(status) {
  return status === ACTION_STATUS.DONE ? RECOMMENDATION_STATUSES.COMPLETED : status
}

/* Materialised workspace store: unique ids per project (the original mock
 * reuses R1/R2 across projects), so Accept/Dismiss/Complete only ever affect
 * one recommendation. Populated once by getAllRecommendations(). */
const store = { loaded: false, items: [] }

export async function getAllRecommendations() {
  if (store.loaded) return simulateRequest({ data: store.items })

  const projectsRes = await getProjects({ page: 1, pageSize: 100 })
  const projects = projectsRes.data

  const grouped = await Promise.all(
    projects.map(async (project) => {
      const res = await getRecommendations(project.id)
      return res.data.map((rec) => ({
        ...rec,
        id: `${project.id}-${rec.id}`,
        projectId: project.id,
        type: deriveType(rec.title),
        status: normalizeStatus(rec.status),
        project: {
          id: project.id,
          name: project.name,
          district: project.district,
          type: project.type,
          stage: project.stage,
          riskLevel: project.riskLevel,
        },
      }))
    }),
  )
  const items = grouped.flat()

  // Real risk-model context per project (SHAP factors + prediction), cached —
  // demonstrates the Risk Factors → Recommendation → Action flow. No impact
  // deltas are fabricated; the prediction's CURRENT values are shown as the
  // target of the corrective action.
  const predictions = {}
  await Promise.all(
    projects.map(async (project) => {
      try {
        const res = await getRiskPrediction(project.id)
        predictions[project.id] = res.data
      } catch {
        predictions[project.id] = null
      }
    }),
  )

  store.items = items.map((item) => {
    const prediction = predictions[item.projectId]
    const topFactor = prediction?.shapFactors?.[0]?.factor ?? null
    return {
      ...item,
      risk: prediction
        ? {
            topFactor,
            delayProbability: prediction.delayProbability,
            expectedDelayDays: prediction.expectedDelayDays,
          }
        : null,
    }
  })
  store.loaded = true
  return simulateRequest({ data: store.items })
}

/** Updates one recommendation's status in the materialised workspace store. */
export async function updateRecommendationStatus(recId, status) {
  const item = store.items.find((r) => r.id === recId)
  if (!item) throw new Error('Recommendation not found')
  return simulateRequest({ data: { ...item, status } }).then((res) => {
    item.status = res.data.status
    return res
  })
}
