import { RotateCcw } from 'lucide-react'
import Button from '../common/Button.jsx'
import Select from '../common/Select.jsx'

/**
 * Reports filter bar. Purely presentational — every select is wired to the
 * page's filter state so the analytics below always reflect the selection.
 * Option lists are derived from the loaded project data (never invented).
 */
export default function ReportFilters({ filters, options, onChange, onReset, activeCount = 0 }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value })

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Select
          label="District"
          value={filters.district}
          onChange={set('district')}
          options={[{ value: 'all', label: 'All Districts' }, ...options.districts]}
        />
        <Select
          label="Project Type"
          value={filters.type}
          onChange={set('type')}
          options={[{ value: 'all', label: 'All Types' }, ...options.types]}
        />
        <Select
          label="Risk Level"
          value={filters.risk}
          onChange={set('risk')}
          options={[{ value: 'all', label: 'All Risks' }, ...options.risks]}
        />
        <Select
          label="Project Stage"
          value={filters.stage}
          onChange={set('stage')}
          options={[{ value: 'all', label: 'All Stages' }, ...options.stages]}
        />
        <Select
          label="Target Completion"
          value={filters.range}
          onChange={set('range')}
          options={options.ranges}
        />
        <div className="flex items-end">
          <Button
            variant="outline"
            size="md"
            icon={RotateCcw}
            onClick={onReset}
            disabled={activeCount === 0}
            fullWidth
          >
            Reset Filters{activeCount > 0 ? ` (${activeCount})` : ''}
          </Button>
        </div>
      </div>
    </section>
  )
}