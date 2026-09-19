import { ACTION_STATUS, PRIORITY_LEVELS } from '../utils/constants'

function simulateRequest(payload, delay = 350) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(payload), delay)
  })
}

const RECOMMENDATIONS = {
  P101: [
    {
      id: 'R1',
      title: 'Expedite pending legal dispute hearings with district court liaison',
      priority: PRIORITY_LEVELS.HIGH,
      status: ACTION_STATUS.PENDING,
    },
    {
      id: 'R2',
      title: 'Release remaining compensation installments to 42 pending families',
      priority: PRIORITY_LEVELS.HIGH,
      status: ACTION_STATUS.IN_PROGRESS,
    },
    {
      id: 'R3',
      title: 'Schedule joint verification survey for disputed land parcels',
      priority: PRIORITY_LEVELS.MEDIUM,
      status: ACTION_STATUS.PENDING,
    },
    {
      id: 'R4',
      title: 'Conduct Gram Sabha consultation for R&R plan alignment',
      priority: PRIORITY_LEVELS.MEDIUM,
      status: ACTION_STATUS.PENDING,
    },
  ],
}

const DEFAULT_RECOMMENDATIONS = [
  {
    id: 'R1',
    title: 'Follow up on pending approval documentation with state authority',
    priority: PRIORITY_LEVELS.MEDIUM,
    status: ACTION_STATUS.PENDING,
  },
  {
    id: 'R2',
    title: 'Update compensation disbursement records for affected families',
    priority: PRIORITY_LEVELS.MEDIUM,
    status: ACTION_STATUS.IN_PROGRESS,
  },
]

export async function getRecommendations(projectId) {
  const data = RECOMMENDATIONS[projectId] || DEFAULT_RECOMMENDATIONS
  return simulateRequest({ data })
}
