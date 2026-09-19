import { MOCK_PROJECTS } from './projects.api'

function simulateRequest(payload, delay = 350) {
  return new Promise((resolve) => setTimeout(() => resolve(payload), delay))
}

/**
 * Field Updates store — in-memory (same pattern as the other mock API
 * modules). Starts EMPTY: no history is fabricated; records appear when a
 * manager submits an update and persist for the browser session.
 *
 * The existing `updateProjectStatus` (projects.api) used by the dashboard's
 * "Add Field Update" modal is untouched — this module is purely additive.
 */
let FIELD_UPDATES = []
let nextId = 1

/**
 * Returns submitted field updates, newest first, optionally scoped to one
 * project.
 */
export async function getFieldUpdates({ projectId } = {}) {
  let data = [...FIELD_UPDATES].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  )
  if (projectId) {
    data = data.filter((u) => u.projectId === projectId)
  }
  return simulateRequest({ data, total: data.length })
}

/**
 * Records a field update. `previousStage` is derived from the EXISTING
 * project data (the project's stage at submission time) so the feed can show
 * the stage transition. Attachment/location are optional metadata captured
 * client-side; nothing is uploaded anywhere.
 */
export async function submitFieldUpdate(payload) {
  const project = MOCK_PROJECTS.find((p) => p.id === payload.projectId)
  const record = {
    id: `FU-${nextId}`,
    projectId: payload.projectId,
    projectName: project ? project.name : '',
    previousStage: project ? project.stage : null,
    stage: payload.stage,
    updateType: payload.updateType || null,
    note: payload.note || '',
    progress: payload.progress || null,
    attachment: payload.attachment || null,
    location: payload.location || null,
    submittedBy: payload.submittedBy || null,
    submittedAt: new Date().toISOString(),
  }
  nextId += 1
  FIELD_UPDATES = [record, ...FIELD_UPDATES]
  return simulateRequest({ success: true, data: record })
}
