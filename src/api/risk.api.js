import { RISK_LEVELS } from '../utils/constants'

function simulateRequest(payload, delay = 350) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(payload), delay)
  })
}

const RISK_PREDICTIONS = {
  P101: {
    projectId: 'P101',
    delayProbability: 82,
    riskLevel: RISK_LEVELS.HIGH,
    expectedDelayDays: 145,
    warningMessage:
      'This project shows a high likelihood of delay due to unresolved legal disputes and slow compensation disbursement. Immediate intervention is recommended.',
    shapFactors: [
      { factor: 'Legal Disputes', weight: 0.34 },
      { factor: 'Compensation Progress', weight: 0.27 },
      { factor: 'Approval Delay', weight: 0.19 },
      { factor: 'R&R Progress', weight: 0.12 },
      { factor: 'Affected Families', weight: 0.08 },
    ],
    summary:
      'Legal disputes are the single largest contributor to this project\u2019s delay risk, followed by slow compensation disbursement.',
  },
}

const DEFAULT_PREDICTION = {
  projectId: null,
  delayProbability: 48,
  riskLevel: RISK_LEVELS.MEDIUM,
  expectedDelayDays: 60,
  warningMessage:
    'This project shows a moderate likelihood of delay. Continued monitoring of compensation and approval milestones is recommended.',
  shapFactors: [
    { factor: 'Legal Disputes', weight: 0.18 },
    { factor: 'Compensation Progress', weight: 0.24 },
    { factor: 'Approval Delay', weight: 0.3 },
    { factor: 'R&R Progress', weight: 0.16 },
    { factor: 'Affected Families', weight: 0.12 },
  ],
  summary:
    'Approval delays and pending compensation disbursement are the primary drivers of risk for this project.',
}

export async function getRiskPrediction(projectId) {
  const prediction = RISK_PREDICTIONS[projectId] || { ...DEFAULT_PREDICTION, projectId }
  return simulateRequest({ data: prediction })
}

export async function getRiskHistory(projectId) {
  const history = Array.from({ length: 6 }).map((_, index) => ({
    month: `M${index + 1}`,
    probability: 40 + Math.round(Math.sin(index) * 10) + index * 6,
  }))
  return simulateRequest({ data: { projectId, history } })
}
