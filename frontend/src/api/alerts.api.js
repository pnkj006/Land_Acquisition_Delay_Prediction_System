function simulateRequest(payload, delay = 350) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(payload), delay)
  })
}

const now = Date.now()

export const MOCK_ALERTS = [
  {
    id: 'A1',
    projectId: 'P101',
    type: 'risk',
    message: 'P101 - NH-27 Phase II risk score increased to 82% (High Risk)',
    timestamp: new Date(now - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'A2',
    projectId: 'P102',
    type: 'legal',
    message: 'New legal dispute filed for Kathajodi Irrigation Canal Extension',
    timestamp: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 'A3',
    projectId: 'P107',
    type: 'compensation',
    message: 'Compensation disbursement overdue by 15 days for Choudwar Bypass Extension',
    timestamp: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: 'A4',
    projectId: 'P103',
    type: 'approval',
    message: 'Approval pending beyond SLA for Cuttack-Paradip Rail Link',
    timestamp: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: 'A5',
    projectId: 'P108',
    type: 'update',
    message: 'Field update submitted for Niali Rural Water Supply Pipeline',
    timestamp: new Date(now - 1000 * 60 * 60 * 50).toISOString(),
  },
]

export async function getAlerts({ projectId } = {}) {
  const data = projectId ? MOCK_ALERTS.filter((a) => a.projectId === projectId) : MOCK_ALERTS
  return simulateRequest({ data, unreadCount: 4 })
}
