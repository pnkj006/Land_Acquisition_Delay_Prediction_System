import { RotateCcw } from 'lucide-react'
import Button from '../common/Button.jsx'
import FilterDropdown from '../common/FilterDropdown.jsx'
import { RISK_LEVELS } from '../../utils/constants'

const RISK_OPTIONS = Object.values(RISK_LEVELS).map((level) => ({ value: level, label: level }))

/**
 * Filter bar for the Risk Analysis page. Every filter is functional: the
 * selected values are applied client-side to the project list fetched from
 * the existing projects API (see RiskAnalysis.jsx), and the summary cards,
 * charts and table all recompute from the filtered set.
 */
export default function RiskFilterBar({
  districts = [],
  types = [],
  stages = [],
  value,
  onChange,
  onReset,
  resultCount = 0,
  disabled = false,
}) {
  const update = (patch) => onChange && onChange({ ...value, ...patch })
  const hasActiveFilters = Boolean(
    value.district || value.riskLevel || value.type || value.stage || value.dateFrom || value.dateTo,
  )

  const dateInputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-800 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25'

  return (
    <section className="mb-5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <FilterGroup label="District">
          <FilterDropdown
            options={districts.map((d) => ({ value: d, label: d }))}
            value={value.district}
            onChange={(next) => update({ district: next })}
            allLabel="All Districts"
            label="District"
            className="w-full"
          />
        </FilterGroup>

        <FilterGroup label="Risk Level">
          <FilterDropdown
            options={RISK_OPTIONS}
            value={value.riskLevel}
            onChange={(next) => update({ riskLevel: next })}
            allLabel="All Risks"
            label="Risk Level"
            className="w-full"
          />
        </FilterGroup>

        <FilterGroup label="Project Type">
          <FilterDropdown
            options={types.map((t) => ({ value: t, label: t }))}
            value={value.type}
            onChange={(next) => update({ type: next })}
            allLabel="All Types"
            label="Project Type"
            className="w-full"
          />
        </FilterGroup>

        <FilterGroup label="Project Stage">
          <FilterDropdown
            options={stages.map((s) => ({ value: s, label: s }))}
            value={value.stage}
            onChange={(next) => update({ stage: next })}
            allLabel="All Stages"
            label="Project Stage"
            className="w-full"
          />
        </FilterGroup>

        <FilterGroup label="Date Range">
          <div className="flex items-center gap-2">
            <input
              type="date"
              aria-label="Projects started from"
              value={value.dateFrom}
              onChange={(e) => update({ dateFrom: e.target.value })}
              className={dateInputClass}
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              aria-label="Projects started until"
              value={value.dateTo}
              onChange={(e) => update({ dateTo: e.target.value })}
              className={dateInputClass}
            />
          </div>
        </FilterGroup>

        <div className="ml-auto flex items-center gap-3 pb-0.5">
          <span className="text-xs text-gray-500">
            {resultCount} {resultCount === 1 ? 'project' : 'projects'}
          </span>
          <Button
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={onReset}
            disabled={disabled || !hasActiveFilters}
          >
            Reset Filters
          </Button>
        </div>
      </div>
    </section>
  )
}

function FilterGroup({ label, children }) {
  return (
    <div className="flex min-w-[150px] flex-col gap-1">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      {children}
    </div>
  )
}
