import apiClient from './apiClient';

export async function getRecommendations(projectId) {
  const res = await apiClient.get(`/projects/${projectId}/recommendations`);
  return res.data.data;
}

export async function updateRecommendationStatus(projectId, recId, payload) {
  const res = await apiClient.patch(`/recommendations/${recId}`, payload);
  return res.data.data;
}
