import { PROJECT_STAGES, RISK_LEVELS } from './constants'
import { getRiskLevelFromProbability } from './riskUtils'

/**
 * Pure, transparent aggregation helpers for the Reports & Analytics page.
 *
 * Ground rules for every function here:
 *  - Input is always the real project records from `getProjects()` — the same
 *    source of truth the Dashboard, Risk Analysis and My Projects pages use.
 *  - Nothing is fabricated: no invented districts, no ML scores, no fake
 *    history. Where a value does not exist on the data (e.g. physical
 *    progress), the derivation is simple arithmetic, documented, and the UI
 *    labels it as derived.
 */

/** Ordered stage list from the app's own constants. */
export const STAGE_ORDER = Array.isArray(PROJECT_STAGES) ? PROJECT_STAGES : []

/** Date-range filter options based on each project's real targetCompletion. */
export const RANGE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: '6m', label: 'Due within 6 months' },
  { value: '12m', label: 'Due within 12 months' },
  { value: 'overdue', label: 'Past target date' },
]

/** Empty filter set used on mount and by Reset Filters. */
export const EMPTY_FILTERS = { district: 'all', type: 'all', risk: 'all', stage: 'all', range: 'all' }

/**
 * Transparent, documented progress derivation. Projects carry no progress
 * field, so progress is approximated by the project's position in the stage
 * pipeline (stage index / last stage * 100). Labelled as derived in the UI.
 */
export function deriveProgress(project) {
  if (!project || !project.stage || STAGE_ORDER.length === 0) return null
  const index = STAGE_ORDER.indexOf(project.stage)
  if (index === -1) return null
  const last = STAGE_ORDER.length - 1
  if (last === 0) return null
  return Math.round((index / last) * 100)
}

/**
 * At-risk definition used consistently across summary, districts and table:
 * HIGH risk level OR delay probability >= 50%. Simple, documented arithmetic.
 */
export function isProjectAtRisk(project) {
  if (!project) return false
  if (project.riskLevel === RISK_LEVELS.HIGH) return true
  const p = Number(project.delayProbability)
  return Number.isFinite(p) && p >= 50
}

/**
 * Applies the report filters to a project list. 'all' means inactive.
 * The range filter uses the project's own `targetCompletion` date.
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
    if (filters.district && filters.district !== 'all' && p.district !== filters.district) return false
    if (filters.type && filters.type !== 'all' && p.type !== filters.type) return false
    if (filters.risk && filters.risk !== 'all' && p.riskLevel !== filters.risk) return false
    if (filters.stage && filters.stage !== 'all' && p.stage !== filters.stage) return false
    if (filters.range && filters.range !== 'all') {
      if (filters.range === 'overdue') {
        if (!p.targetCompletion || new Date(p.targetCompletion) >= now) return false
      } else if (filters.range === '6m') {
        if (!withinMonths(p.targetCompletion, 6)) return false
      } else if (filters.range === '12m') {
        if (!withinMonths(p.targetCompletion, 12)) return false
      }
    }
    return true
  })
}

/** Number of non-default filters, used to enable/disable Reset. */
export function countActiveFilters(filters = {}) {
  return ['district', 'type', 'risk', 'stage', 'range'].filter(
    (key) => filters[key] && filters[key] !== 'all',
  ).length
}

/** Dropdown options derived from the loaded data — never invented. */
export function buildFilterOptions(projects = []) {
  const unique = (key) =>
    [...new Set(projects.map((p) => p[key]).filter(Boolean))].sort().map((v) => ({ value: v, label: v }))
  return {
    districts: unique('district'),
    types: unique('type'),
    risks: unique('riskLevel'),
    stages: unique('stage'),
    ranges: RANGE_OPTIONS,
  }
}

/**
 * Portfolio metrics computed from the filtered project list.
 * avgDelay is the mean of expectedDelayDays across the selection (null if none).
 */
export function computeMetrics(projects = []) {
  const total = projects.length
  const atRisk = projects.filter(isProjectAtRisk).length
  const delays = projects.map((p) => Number(p.expectedDelayDays)).filter(Number.isFinite)
  const avgDelay = delays.length
    ? Math.round(delays.reduce((sum, d) => sum + d, 0) / delays.length)
    : null
  return {
    total,
    onTrack: total - atRisk,
    atRisk,
    high: projects.filter((p) => p.riskLevel === RISK_LEVELS.HIGH).length,
    medium: projects.filter((p) => p.riskLevel === RISK_LEVELS.MEDIUM).length,
    low: projects.filter((p) => p.riskLevel === RISK_LEVELS.LOW).length,
    avgDelay,
  }
}

/**
 * District performance rows. Performance index = 100 − average delay
 * probability of the district's projects (transparent arithmetic over values
 * that already exist on each record — not an ML score).
 */
export function computeDistrictRows(projects = []) {
  const byDistrict = new Map()
  for (const p of projects) {
    if (!p.district) continue
    if (!byDistrict.has(p.district)) byDistrict.set(p.district, [])
    byDistrict.get(p.district).push(p)
  }
  return [...byDistrict.entries()]
    .map(([district, list]) => {
      const probs = list.map((p) => Number(p.delayProbability)).filter(Number.isFinite)
      const delays = list.map((p) => Number(p.expectedDelayDays)).filter(Number.isFinite)
      const avgProb = probs.length ? probs.reduce((s, v) => s + v, 0) / probs.length : null
      return {
        district,
        total: list.length,
        onTrack: list.filter((p) => !isProjectAtRisk(p)).length,
        atRisk: list.filter(isProjectAtRisk).length,
        highRisk: list.filter((p) => p.riskLevel === RISK_LEVELS.HIGH).length,
        averageDelay: delays.length
          ? Math.round(delays.reduce((s, v) => s + v, 0) / delays.length)
          : null,
        performance: avgProb === null ? null : Math.round(100 - avgProb),
      }
    })
    .sort((a, b) => (b.performance ?? -1) - (a.performance ?? -1))
}

/**
 * Normalises SHAP contributions from the risk service into the
 * `{ feature, weight, share }` shape DelayDrivers renders. Weight is the
 * absolute contribution; share is its percentage of the total absolute
 * weight. Returns [] when no valid factors exist — never invents drivers.
 * Accepts `{factor, weight}` (risk API shape) or `{feature|name, contribution|value}`.
 */
export function deriveDelayDrivers(shapFactors) {
  if (!Array.isArray(shapFactors)) return []
  const items = shapFactors
    .map((f) => ({
      feature: String(f?.feature ?? f?.factor ?? f?.name ?? '').trim(),
      weight: Math.abs(Number(f?.weight ?? f?.contribution ?? f?.value ?? NaN)),
    }))
    .filter((f) => f.feature && Number.isFinite(f.weight) && f.weight > 0)
    .sort((a, b) => b.weight - a.weight)
  const total = items.reduce((s, f) => s + f.weight, 0)
  if (!items.length || total === 0) return []
  return items.map((f) => ({ ...f, share: Math.round((f.weight / total) * 100) }))
}

/**
 * Key insights computed from the actual selection. Every sentence states the
 * numbers it is built from; a sentence is only produced when its supporting
 * data exists. Returns an empty array rather than filler text.
 */
export function buildInsights(projects = []) {
  const insights = []
  if (projects.length === 0) return insights

  const atRisk = projects.filter(isProjectAtRisk)
  if (atRisk.length > 0) {
    const pct = Math.round((atRisk.length / projects.length) * 100)
    insights.push(
      `${atRisk.length} of ${projects.length} projects (${pct}%) in the current selection are flagged at risk.`,
    )
  }

  // District with the most HIGH-risk projects.
  const highByDistrict = new Map()
  for (const p of projects) {
    if (p.riskLevel === RISK_LEVELS.HIGH && p.district) {
      highByDistrict.set(p.district, (highByDistrict.get(p.district) || 0) + 1)
    }
  }
  if (highByDistrict.size > 0) {
    const [district, count] = [...highByDistrict.entries()].sort((a, b) => b[1] - a[1])[0]
    insights.push(
      `High-risk projects are concentrated in ${district} (${count} project${count === 1 ? '' : 's'}).`,
    )
  }

  // Stage with the highest average expected delay (only stages with data).
  const delayByStage = new Map()
  for (const p of projects) {
    if (!p.stage) continue
    const d = Number(p.expectedDelayDays)
    if (!Number.isFinite(d)) continue
    if (!delayByStage.has(p.stage)) delayByStage.set(p.stage, [])
    delayByStage.get(p.stage).push(d)
  }
  if (delayByStage.size > 0) {
    const [stage, list] = [...delayByStage.entries()]
      .map(([s, ds]) => [s, ds.reduce((x, y) => x + y, 0) / ds.length])
      .sort((a, b) => b[1] - a[1])[0]
    insights.push(
      `Projects in the ${stage} stage show the highest average expected delay (${Math.round(list)} days).`,
    )
  }

  return insights
}

/** Rows for the CSV export — mirrors exactly what is on screen. */
export function buildExportRows(projects = []) {
  return projects.map((p) => [
    p.id,
    p.name,
    p.district,
    p.type,
    p.stage,
    p.riskLevel,
    deriveProgress(p) ?? '—',
    p.delayProbability != null ? `${p.delayProbability}%` : '—',
    p.expectedDelayDays != null ? `${p.expectedDelayDays} days` : '—',
    isProjectAtRisk(p) ? 'At Risk' : 'On Track',
  ])
}

export { getRiskLevelFromProbability }
