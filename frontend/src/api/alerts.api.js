import apiClient from './apiClient';

const API_BASE = '/alerts';

export async function getAlerts(params = {}) {
  const res = await apiClient.get(API_BASE, { params });
  return res.data.data;
}

export async function markAllAlertsRead() {
  const res = await apiClient.patch(`${API_BASE}/read-all`);
  return res.data.data;
}

export async function markAlertRead(alertId) {
  const res = await apiClient.patch(`${API_BASE}/${alertId}/read`);
  return res.data.data;
}
