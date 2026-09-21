import { fetchClient } from './fetchClient'

export async function getRiskPrediction(projectId) {
  const res = await fetchClient(`/projects/${projectId}/risk`)
  return res.data
}

export async function getRiskHistory(projectId) {
  const res = await fetchClient(`/projects/${projectId}/risk/history`)
  return res.data
}

export async function getRiskStages(projectId) {
  const res = await fetchClient(`/projects/${projectId}/risk/stages`)
  return res.data
}

export async function getRiskFactors(projectId) {
  const res = await fetchClient(`/projects/${projectId}/risk/factors`)
  return res.data
}

// [MOCKED] if the ML service isn't running
export async function rerunPrediction(projectId) {
  // If the ML service is not fully wired on the backend, this can stay a mock.
  // We'll call the real backend endpoint anyway; if the backend stubs it, that's fine.
  const res = await fetchClient(`/projects/${projectId}/risk/predict`, { method: 'POST' })
  return res.data
}
