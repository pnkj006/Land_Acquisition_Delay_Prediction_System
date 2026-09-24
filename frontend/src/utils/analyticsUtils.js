import { PROJECT_STAGES, RISK_LEVELS } from './constants'
import { getRiskLevelFromProbability } from './riskUtils'

/**
 * Pure aggregation helpers for Reports & Analytics.
 *
 * Backend probability is stored as 0–1.
 * Example:
 *   0.2433 = 24.33%
 *
 * Frontend display values are converted to percentages only when required.
 */

export const STAGE_ORDER = Array.isArray(PROJECT_STAGES) ? PROJECT_STAGES : []

export const RANGE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: '6m', label: 'Due within 6 months' },
  { value: '12m', label: 'Due within 12 months' },
  { value: 'overdue', label: 'Past target date' },
]

export const EMPTY_FILTERS = {
  district: 'all',
  type: 'all',
  risk: 'all',
  stage: 'all',
  range: 'all',
}

/**
 * Convert backend probability (0–1) to percentage (0–100).
 *
 * Example:
 * 0.2433 -> 24.33
 * 0.53   -> 53
 */
function getProbabilityPercent(project) {
  const value = Number(project?.delayProbability)

  if (!Number.isFinite(value)) return null

  // Backend stores probability as 0–1.
  return value * 100
}

/**
 * Get probability in backend form (0–1).
 */
function getProbability(project) {
  const value = Number(project?.delayProbability)

  if (!Number.isFinite(value)) return null

  return value
}

/**
 * Progress is derived from the project's stage position.
 */
export function deriveProgress(project) {
  if (!project || !project.stage || STAGE_ORDER.length === 0) {
    return null
  }

  const index = STAGE_ORDER.indexOf(project.stage)

  if (index === -1) return null

  const last = STAGE_ORDER.length - 1

  if (last === 0) return null

  return Math.round((index / last) * 100)
}

/**
 * Project is considered at risk when:
 *
 * HIGH risk level
 * OR
 * delay probability >= 0.50
 *
 * IMPORTANT:
 * Backend probability is 0–1, NOT 0–100.
 */
export function isProjectAtRisk(project) {
  if (!project) return false

  if (project.riskLevel === RISK_LEVELS.HIGH) {
    return true
  }

  const probability = getProbability(project)

  return Number.isFinite(probability) && probability >= 0.5
}

/**
 * Apply report filters.
 */
export function filterProjects(projects = [], filters = {}) {
  const now = new Date()

  const withinMonths = (date, months) => {
    if (!date) return false

    const d = new Date(date)

    if (Number.isNaN(d.getTime())) return false

    const limit = new Date(now)
    limit.setMonth(limit.getMonth() + months)

    return d >= now && d <= limit
  }

  return projects.filter((p) => {
    if (
      filters.district &&
      filters.district !== 'all' &&
      p.district !== filters.district
    ) {
      return false
    }

    if (
      filters.type &&
      filters.type !== 'all' &&
      p.type !== filters.type
    ) {
      return false
    }

    if (
      filters.risk &&
      filters.risk !== 'all' &&
      p.riskLevel !== filters.risk
    ) {
      return false
    }

    if (
      filters.stage &&
      filters.stage !== 'all' &&
      p.stage !== filters.stage
    ) {
      return false
    }

    if (filters.range && filters.range !== 'all') {
      if (filters.range === 'overdue') {
        if (
          !p.targetCompletion ||
          new Date(p.targetCompletion) >= now
        ) {
          return false
        }
      }

      if (filters.range === '6m') {
        if (!withinMonths(p.targetCompletion, 6)) {
          return false
        }
      }

      if (filters.range === '12m') {
        if (!withinMonths(p.targetCompletion, 12)) {
          return false
        }
      }
    }

    return true
  })
}

/**
 * Count active filters.
 */
export function countActiveFilters(filters = {}) {
  return ['district', 'type', 'risk', 'stage', 'range'].filter(
    (key) => filters[key] && filters[key] !== 'all',
  ).length
}

/**
 * Build dropdown options from actual project data.
 */
export function buildFilterOptions(projects = []) {
  const unique = (key) =>
    [...new Set(projects.map((p) => p[key]).filter(Boolean))]
      .sort()
      .map((value) => ({
        value,
        label: value,
      }))

  return {
    districts: unique('district'),
    types: unique('type'),
    risks: unique('riskLevel'),
    stages: unique('stage'),
    ranges: RANGE_OPTIONS,
  }
}

/**
 * Portfolio metrics.
 */
export function computeMetrics(projects = []) {
  const total = projects.length

  const atRisk = projects.filter(isProjectAtRisk).length

  const scores = projects
    .map((p) => Number(p.riskScore))
    .filter(Number.isFinite)

  const avgRiskScore = scores.length
    ? scores.reduce((sum, value) => sum + value, 0) / scores.length
    : null

  const delays = projects
    .map((p) => Number(p.expectedDelayDays))
    .filter(Number.isFinite)

  const avgDelay = delays.length
    ? delays.reduce((sum, value) => sum + value, 0) / delays.length
    : null

  return {
    total,

    onTrack: total - atRisk,

    atRisk,

    high: projects.filter(
      (p) => p.riskLevel === RISK_LEVELS.HIGH,
    ).length,

    medium: projects.filter(
      (p) => p.riskLevel === RISK_LEVELS.MEDIUM,
    ).length,

    low: projects.filter(
      (p) => p.riskLevel === RISK_LEVELS.LOW,
    ).length,

    avgRiskScore,

    avgDelay,
  }
}

/**
 * District performance.
 *
 * Performance =
 * 100 - average delay probability (%)
 *
 * Example:
 * probability = 24.33%
 * performance = 75.67%
 */
export function computeDistrictRows(projects = []) {
  const byDistrict = new Map()

  for (const project of projects) {
    if (!project.district) continue

    if (!byDistrict.has(project.district)) {
      byDistrict.set(project.district, [])
    }

    byDistrict.get(project.district).push(project)
  }

  return [...byDistrict.entries()]
    .map(([district, list]) => {
      const probabilities = list
        .map(getProbabilityPercent)
        .filter(Number.isFinite)

      const scores = list
        .map((p) => Number(p.riskScore))
        .filter(Number.isFinite)

      const avgProbability = probabilities.length
        ? probabilities.reduce((sum, value) => sum + value, 0) /
          probabilities.length
        : null

      const avgRiskScore = scores.length
        ? scores.reduce((sum, value) => sum + value, 0) /
          scores.length
        : null

      return {
        district,

        total: list.length,

        onTrack: list.filter(
          (p) => !isProjectAtRisk(p),
        ).length,

        atRisk: list.filter(isProjectAtRisk).length,

        highRisk: list.filter(
          (p) => p.riskLevel === RISK_LEVELS.HIGH,
        ).length,

        avgRiskScore,

        performance:
          avgProbability === null
            ? null
            : Math.round(100 - avgProbability),
      }
    })
    .sort(
      (a, b) =>
        (b.performance ?? -1) -
        (a.performance ?? -1),
    )
}

/**
 * Convert SHAP factors returned by the backend into the
 * structure expected by DelayDrivers.
 *
 * Backend example:
 *
 * {
 *   feature: "historical_performance_score",
 *   shap_value: 0.200149,
 *   absolute_impact: 0.200149
 * }
 *
 * We use absolute_impact because the UI displays the
 * contribution magnitude/share.
 */
export function deriveDelayDrivers(shapFactors) {
  if (!Array.isArray(shapFactors)) {
    return []
  }

  const items = shapFactors
    .map((factor) => {
      const feature = String(
        factor?.feature ??
          factor?.factor ??
          factor?.name ??
          '',
      ).trim()

      const weight = Math.abs(
        Number(
          factor?.absolute_impact ??
            factor?.shap_value ??
            factor?.weight ??
            factor?.contribution ??
            factor?.value ??
            NaN,
        ),
      )

      return {
        feature,
        weight,
      }
    })
    .filter(
      (factor) =>
        factor.feature &&
        Number.isFinite(factor.weight) &&
        factor.weight > 0,
    )
    .sort((a, b) => b.weight - a.weight)

  const total = items.reduce(
    (sum, factor) => sum + factor.weight,
    0,
  )

  if (!items.length || total === 0) {
    return []
  }

  return items.map((factor) => ({
    ...factor,
    share: Math.round(
      (factor.weight / total) * 100,
    ),
  }))
}

/**
 * Key insights.
 */
export function buildInsights(projects = []) {
  const insights = []

  if (projects.length === 0) {
    return insights
  }

  const atRisk = projects.filter(isProjectAtRisk)

  if (atRisk.length > 0) {
    const percentage = Math.round(
      (atRisk.length / projects.length) * 100,
    )

    insights.push(
      `${atRisk.length} of ${projects.length} projects (${percentage}%) in the current selection are flagged at risk.`,
    )
  }

  const highByDistrict = new Map()

  for (const project of projects) {
    if (
      project.riskLevel === RISK_LEVELS.HIGH &&
      project.district
    ) {
      highByDistrict.set(
        project.district,
        (highByDistrict.get(project.district) || 0) + 1,
      )
    }
  }

  if (highByDistrict.size > 0) {
    const [district, count] = [
      ...highByDistrict.entries(),
    ].sort((a, b) => b[1] - a[1])[0]

    insights.push(
      `High-risk projects are concentrated in ${district} (${count} project${count === 1 ? '' : 's'}).`,
    )
  }

  const scoreByStage = new Map()

  for (const project of projects) {
    if (!project.stage) continue

    const score = Number(project.riskScore)

    if (!Number.isFinite(score)) continue

    if (!scoreByStage.has(project.stage)) {
      scoreByStage.set(project.stage, [])
    }

    scoreByStage.get(project.stage).push(score)
  }

  if (scoreByStage.size > 0) {
    const [stage, average] = [
      ...scoreByStage.entries(),
    ]
      .map(([stageName, values]) => [
        stageName,
        values.reduce((sum, value) => sum + value, 0) /
          values.length,
      ])
      .sort((a, b) => b[1] - a[1])[0]

    insights.push(
      `Projects in the ${stage} stage show the highest average risk score (${average.toFixed(1)}%).`,
    )
  }

  return insights
}

/**
 * CSV export rows.
 */
export function buildExportRows(projects = []) {
  return projects.map((project) => {
    const probability = getProbabilityPercent(project)

    return [
      project.id,
      project.name,
      project.district,
      project.type,
      project.stage,
      project.riskLevel,

      deriveProgress(project) ?? '—',

      probability !== null
        ? `${probability.toFixed(2)}%`
        : '—',

      project.expectedDelayDays != null &&
      Number.isFinite(Number(project.expectedDelayDays))
        ? `${Number(project.expectedDelayDays).toFixed(1)} days`
        : '—',

      isProjectAtRisk(project)
        ? 'At Risk'
        : 'On Track',
    ]
  })
}

export { getRiskLevelFromProbability }