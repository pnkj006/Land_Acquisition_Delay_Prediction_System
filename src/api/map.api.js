import { MOCK_PROJECTS } from './projects.api'

function simulateRequest(payload, delay = 350) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(payload), delay)
  })
}

export const CUTTACK_CENTER = { lat: 20.4625, lng: 85.8828 }

/**
 * Returns lightweight map-marker data for all projects in the district,
 * optionally filtered by risk level / stage.
 */
export async function getProjectMapMarkers({ riskLevel = '', stage = '', district = '' } = {}) {
  let markers = MOCK_PROJECTS.map((p) => ({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    riskLevel: p.riskLevel,
    stage: p.stage,
    district: p.district,
    delayProbability: p.delayProbability,
    expectedDelayDays: p.expectedDelayDays,
  }))

  if (riskLevel) markers = markers.filter((m) => m.riskLevel === riskLevel)
  if (stage) markers = markers.filter((m) => m.stage === stage)
  if (district) markers = markers.filter((m) => m.district === district)

  return simulateRequest({ data: markers, center: CUTTACK_CENTER })
}
