import { RISK_LEVELS } from './constants'

/**
 * Central place for mapping a risk level to colors/labels used across
 * badges, charts, and the map markers. Keeping this logic in one file
 * means design tweaks (e.g. a new risk tier) only need a single edit.
 */
export const RISK_META = {
  [RISK_LEVELS.HIGH]: {
    label: 'High Risk',
    shortLabel: 'High',
    color: '#dc2626',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-600',
    badgeClass: 'bg-red-100 text-red-700 border border-red-200',
  },
  [RISK_LEVELS.MEDIUM]: {
    label: 'Medium Risk',
    shortLabel: 'Medium',
    color: '#f59e0b',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    badgeClass: 'bg-amber-100 text-amber-700 border border-amber-200',
  },
  [RISK_LEVELS.LOW]: {
    label: 'Low Risk',
    shortLabel: 'Low',
    color: '#16a34a',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    dot: 'bg-green-600',
    badgeClass: 'bg-green-100 text-green-700 border border-green-200',
  },
}

export function getRiskMeta(level) {
  return RISK_META[level] || RISK_META[RISK_LEVELS.LOW]
}

export function getRiskLevelFromProbability(probability) {
  if (probability >= 70) return RISK_LEVELS.HIGH
  if (probability >= 40) return RISK_LEVELS.MEDIUM
  return RISK_LEVELS.LOW
}

export function getRiskColor(level) {
  return getRiskMeta(level).color
}

/**
 * Presentational status chip derived from the project's EXISTING risk level
 * (no new data is invented): High -> "At Risk", Medium -> "Monitor",
 * Low -> "On Track". Used by the projects table status column.
 */
export function getProjectStatus(project) {
  if (!project) return null
  if (project.riskLevel === RISK_LEVELS.HIGH) {
    return { label: 'At Risk', className: 'bg-red-100 text-red-700 border border-red-200' }
  }
  if (project.riskLevel === RISK_LEVELS.MEDIUM) {
    return { label: 'Monitor', className: 'bg-amber-100 text-amber-700 border border-amber-200' }
  }
  return { label: 'On Track', className: 'bg-green-100 text-green-700 border border-green-200' }
}
