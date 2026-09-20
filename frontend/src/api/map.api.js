import apiClient from './apiClient';

const API_BASE = '/map';

export const CUTTACK_CENTER = { lat: 20.4625, lng: 85.8828 };

export async function getProjectMapMarkers(params = {}) {
  const res = await apiClient.get(`${API_BASE}/projects`, { params });
  return res.data.data;
}
