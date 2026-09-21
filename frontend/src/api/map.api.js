import { fetchClient } from './fetchClient';

const API_BASE = '/map';

export const CUTTACK_CENTER = { lat: 20.4625, lng: 85.8828 };

export async function getProjectMapMarkers(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${API_BASE}?${query}` : API_BASE;
  
  const res = await fetchClient(url);
  
  const rawData = res?.data?.data || [];
  const markers = rawData.map(m => ({
    id: m.internal_id,
    projectId: m.project_id,
    lat: m.latitude,
    lng: m.longitude,
    location: m.location,
    stage: m.current_stage || '—',
    riskScore: m.risk_score,
    riskLevel: m.risk_level,
  }));
  
  return {
    data: markers,
    center: CUTTACK_CENTER,
    total: res?.data?.total || markers.length,
    truncated: res?.data?.truncated || false
  };
}
