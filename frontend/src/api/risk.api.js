import { fetchClient } from './fetchClient'

export async function getRiskPrediction(projectId) {
  const res = await fetchClient(`/projects/${projectId}/risk`)
  return res.data
}

export async function getRiskHistory(projectId) {
  const res = await fetchClient(`/projects/${projectId}/risk/history`)
  console.log('RISK HISTORY RESPONSE:', res)
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

export async function rerunPrediction(projectId) {
  const res = await fetchClient(`/projects/${projectId}/risk/rerun`, {
    method: 'POST',
  })
  return res.data
}