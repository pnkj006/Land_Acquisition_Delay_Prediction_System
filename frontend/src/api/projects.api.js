import { RISK_LEVELS } from '../utils/constants'
import { fetchClient } from './fetchClient'
import { getRiskPrediction } from './risk.api'
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
    riskScore: 50,
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
    riskScore: 50,
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
    riskScore: 50,
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
    riskScore: 50,
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
    riskScore: 50,
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
    riskScore: 50,
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
    riskScore: 50,
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
    riskScore: 50,
    totalLandArea: '11.2 ha',
    affectedFamilies: 78,
    startDate: '2023-10-01',
    targetCompletion: '2025-07-31',
    lat: 20.3546,
    lng: 85.8103,
  },
]

/*function simulateRequest(payload, delay = 400) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(payload), delay)
  })
}*/



function mapProject(p) {
  if (!p) return null

  const riskScore =
    p.risk_score != null
      ? Number(p.risk_score)
      : 0

  return {
    // Basic project information
    id: p.project_id,
    name: p.location || p.project_id,
    type: p.project_type,
    district: p.district,
    stage: p.current_stage || '—',

    // Risk information from backend
    riskScore,

    riskLevel:
      riskScore >= 70
        ? RISK_LEVELS.HIGH
        : riskScore >= 40
          ? RISK_LEVELS.MEDIUM
          : RISK_LEVELS.LOW,

    // Until the projects endpoint provides a separate
    // delay_probability field, use risk score as the displayed
    // percentage.
    delayProbability: riskScore / 100,

    // Project information
    totalLandArea:
      p.land_area_hectares != null
        ? `${p.land_area_hectares} ha`
        : '—',

    affectedFamilies:
      p.number_of_affected_families ?? 0,

    startDate: p.created_at,

    lat: p.latitude,
    lng: p.longitude,

    status: p.delay_status || 'ON_TIME',

    // ML/input fields
    land_area_hectares: p.land_area_hectares,
    number_of_affected_families:
      p.number_of_affected_families,

    approval_timeline_days:
      p.approval_timeline_days,

    legal_disputes_count:
      p.legal_disputes_count,

    rehabilitation_progress_pct:
      p.rehabilitation_progress_pct,

    historical_performance_score:
      p.historical_performance_score,

    altitude_m: p.altitude_m,
    latitude: p.latitude,
    longitude: p.longitude,

    compensation_status:
      p.compensation_status,

    possession_status:
      p.possession_status,

    stakeholder_responsiveness:
      p.stakeholder_responsiveness,
  }
}

/**
 * Fetch a paginated, filterable list of projects
 */
export async function getProjects(filters = {}) {
  const params = new URLSearchParams()

  if (filters.page) params.append('page', filters.page)
  if (filters.pageSize) params.append('limit', filters.pageSize)
  if (filters.search) params.append('search', filters.search)
  if (filters.riskLevel) params.append('riskLevel', filters.riskLevel)
  if (filters.stage) params.append('stage', filters.stage)

  const res = await fetchClient(`/projects?${params.toString()}`)

  console.log('PROJECTS API RESPONSE:', res)

  const projects = res.data.map(mapProject)

  // Fetch the actual ML prediction for every project
const projectsWithRisk = await Promise.all(
  projects.map(async (project) => {
    try {
      const risk = await getRiskPrediction(project.id)

      console.log(`ML RISK FOR ${project.id}:`, risk)

      // ML risk score rounded to 2 decimal places
      const riskScore = Number(
        Number(risk?.riskScore ?? 0).toFixed(2)
      )

      // ML probability remains decimal (0.42 = 42%)
      const delayProbability = Number(
        Number(risk?.probability ?? 0).toFixed(4)
      )

      const riskLevel =
        riskScore >= 70
          ? RISK_LEVELS.HIGH
          : riskScore >= 40
            ? RISK_LEVELS.MEDIUM
            : RISK_LEVELS.LOW

      return {
        ...project,

        // Replace database risk values with ML values
        riskScore,
        delayProbability,
        riskLevel,
      }
    } catch (error) {
      console.error(
        `Failed to fetch risk for ${project.id}:`,
        error
      )

      return project
    }
  })
)

  return {
    data: projectsWithRisk,
    total: res.pagination?.total || 0,
    page: res.pagination?.page || 1,
    pageSize: res.pagination?.limit || 5,
    totalPages: res.pagination?.totalPages || 1,
  }
}

export async function getProjectById(projectId) {
  const res = await fetchClient(`/projects/${projectId}`)
  return { data: mapProject(res.data) }
}

export async function updateProjectStatus(projectId, payload) {
  const res = await fetchClient(`/projects/${projectId}/status`, {
    method: 'PATCH',
    body: payload,
  })
  return { success: true, projectId, ...res.data }
}
export async function updateProject(projectId, payload) {
  const res = await fetchClient(`/projects/${projectId}`, {
    method: 'PATCH',
    body: payload,
  })

  return {
    data: res.data,
  }
}
export async function getStageProgress(projectId) {
  const res = await fetchClient(
    `/projects/${projectId}/stage-progress`,
  )

  return {
    data: res.data,
  }
}

export async function updateStageProgress(projectId, payload) {
  const res = await fetchClient(
    `/projects/${projectId}/stage-progress`,
    {
      method: 'PATCH',
      body: payload,
    },
  )

  return {
    data: res.data,
  }
}
export async function createProject(payload) {
  const res = await fetchClient('/projects', {
    method: 'POST',
    body: payload,
  })

  return {
    data: res.data,
  }
}

export async function importProjects(file) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetchClient('/imports/projects', {
    method: 'POST',
    body: formData,
  })

  return {
    data: res.data,
  }
}