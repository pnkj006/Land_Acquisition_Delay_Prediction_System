import apiClient from './apiClient';

export async function getRiskPrediction(projectId) {
  const res = await apiClient.get(`/projects/${projectId}/risk`);
  return res.data.data;
}

export async function getRiskHistory(projectId) {
  const res = await apiClient.get(`/projects/${projectId}/risk/history`);
  return res.data.data;
}

export async function getRiskStages(projectId) {
  const res = await apiClient.get(`/projects/${projectId}/risk/stages`);
  return res.data.data;
}

export async function getRiskFactors(projectId) {
  const res = await apiClient.get(`/projects/${projectId}/risk/factors`);
  return res.data.data;
}

// [MOCKED] if the ML service isn't running
export async function rerunPrediction(projectId) {
  // If the ML service is not fully wired on the backend, this can stay a mock.
  // We'll call the real backend endpoint anyway; if the backend stubs it, that's fine.
  const res = await apiClient.post(`/projects/${projectId}/risk/predict`);
  return res.data.data;
}
