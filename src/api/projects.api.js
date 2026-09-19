import { RISK_LEVELS } from '../utils/constants'

// ---------------------------------------------------------------------------
// Mock data. Structured to mirror what a real backend would return so that
// swapping these functions for real HTTP calls (axios/fetch) later requires
// no changes to components or hooks consuming this module.
// ---------------------------------------------------------------------------

export const MOCK_PROJECTS = [
  {
    id: 'P101',
    name: 'NH-27 Phase II',
    type: 'Road',
    district: 'Cuttack District',
    stage: 'Compensation',
    riskLevel: RISK_LEVELS.HIGH,
    delayProbability: 82,
    expectedDelayDays: 145,
    totalLandArea: '48.5 ha',
    affectedFamilies: 312,
    startDate: '2023-04-10',
    targetCompletion: '2025-11-30',
    lat: 20.4625,
    lng: 85.8828,
  },
  {
    id: 'P102',
    name: 'Kathajodi Irrigation Canal Extension',
    type: 'Irrigation',
    district: 'Cuttack District',
    stage: 'Land Acquisition',
    riskLevel: RISK_LEVELS.HIGH,
    delayProbability: 76,
    expectedDelayDays: 120,
    totalLandArea: '22.1 ha',
    affectedFamilies: 154,
    startDate: '2023-06-01',
    targetCompletion: '2025-09-15',
    lat: 20.4756,
    lng: 85.9153,
  },
  {
    id: 'P103',
    name: 'Cuttack-Paradip Rail Link',
    type: 'Rail',
    district: 'Cuttack District',
    stage: 'Approval',
    riskLevel: RISK_LEVELS.MEDIUM,
    delayProbability: 58,
    expectedDelayDays: 75,
    totalLandArea: '61.3 ha',
    affectedFamilies: 428,
    startDate: '2023-01-20',
    targetCompletion: '2026-02-28',
    lat: 20.4396,
    lng: 85.8324,
  },
  {
    id: 'P104',
    name: 'Barang Industrial Corridor',
    type: 'Industrial',
    district: 'Cuttack District',
    stage: 'Notification',
    riskLevel: RISK_LEVELS.MEDIUM,
    delayProbability: 47,
    expectedDelayDays: 58,
    totalLandArea: '35.0 ha',
    affectedFamilies: 96,
    startDate: '2024-02-05',
    targetCompletion: '2026-06-30',
    lat: 20.4012,
    lng: 85.9302,
  },
  {
    id: 'P105',
    name: 'Cuttack Smart City Housing Block C',
    type: 'Urban Development',
    district: 'Cuttack District',
    stage: 'Rehabilitation',
    riskLevel: RISK_LEVELS.LOW,
    delayProbability: 22,
    expectedDelayDays: 12,
    totalLandArea: '15.6 ha',
    affectedFamilies: 210,
    startDate: '2022-11-15',
    targetCompletion: '2025-03-31',
    lat: 20.5023,
    lng: 85.8631,
  },
  {
    id: 'P106',
    name: 'Mahanadi Riverfront Road Widening',
    type: 'Road',
    district: 'Cuttack District',
    stage: 'Possession',
    riskLevel: RISK_LEVELS.LOW,
    delayProbability: 15,
    expectedDelayDays: 5,
    totalLandArea: '9.8 ha',
    affectedFamilies: 41,
    startDate: '2022-08-01',
    targetCompletion: '2024-12-31',
    lat: 20.4681,
    lng: 85.8996,
  },
  {
    id: 'P107',
    name: 'Choudwar Bypass Extension',
    type: 'Road',
    district: 'Cuttack District',
    stage: 'Land Acquisition',
    riskLevel: RISK_LEVELS.HIGH,
    delayProbability: 71,
    expectedDelayDays: 98,
    totalLandArea: '18.4 ha',
    affectedFamilies: 133,
    startDate: '2023-09-12',
    targetCompletion: '2025-12-20',
    lat: 20.5342,
    lng: 85.8517,
  },
  {
    id: 'P108',
    name: 'Niali Rural Water Supply Pipeline',
    type: 'Irrigation',
    district: 'Cuttack District',
    stage: 'Compensation',
    riskLevel: RISK_LEVELS.MEDIUM,
    delayProbability: 52,
    expectedDelayDays: 64,
    totalLandArea: '11.2 ha',
    affectedFamilies: 78,
    startDate: '2023-10-01',
    targetCompletion: '2025-07-31',
    lat: 20.3546,
    lng: 85.8103,
  },
]

function simulateRequest(payload, delay = 400) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(payload), delay)
  })
}

/**
 * Fetch a paginated, filterable list of projects for the logged-in
 * project manager's district.
 */
export async function getProjects({ page = 1, pageSize = 5, search = '', riskLevel = '', stage = '' } = {}) {
  let results = [...MOCK_PROJECTS]

  if (search) {
    const q = search.toLowerCase()
    results = results.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
    )
  }
  if (riskLevel) {
    results = results.filter((p) => p.riskLevel === riskLevel)
  }
  if (stage) {
    results = results.filter((p) => p.stage === stage)
  }

  const total = results.length
  const start = (page - 1) * pageSize
  const paginated = results.slice(start, start + pageSize)

  return simulateRequest({
    data: paginated,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  })
}

export async function getProjectById(projectId) {
  const project = MOCK_PROJECTS.find((p) => p.id === projectId) || MOCK_PROJECTS[0]
  return simulateRequest({ data: project })
}

export async function updateProjectStatus(projectId, payload) {
  return simulateRequest({ success: true, projectId, ...payload })
}
