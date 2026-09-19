import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Eye } from 'lucide-react'
import RiskBadge from '../common/RiskBadge.jsx'
import StatusBadge from '../common/StatusBadge.jsx'
import SearchBar from '../common/SearchBar.jsx'
import Button from '../common/Button.jsx'
import Loader from '../common/Loader.jsx'
import EmptyState from '../common/EmptyState.jsx'
import { getProjectStatus, getRiskMeta } from '../../utils/riskUtils'
import { RISK_LEVELS } from '../../utils/constants'

// Risk level sort order — High first, then Medium, then Low.
const RISK_ORDER = { [RISK_LEVELS.HIGH]: 0, [RISK_LEVELS.MEDIUM]: 1, [RISK_LEVELS.LOW]: 2 }

const COLUMNS = [
  { key: 'id', label: 'Project ID', sortable: true, string: true },
  { key: 'name', label: 'Project Name', sortable: true, string: true },
  { key: 'district', label: 'District', sortable: true, string: true },
  { key: 'type', label: 'Type', sortable: true, string: true },
  { key: 'stage', label: 'Current Stage', sortable: true, string: true },
  { key: 'riskLevel', label: 'Risk Level', sortable: true },
  { key: 'delayProbability', label: 'Delay Probability', sortable: true, align: 'right' },
  { key: 'expectedDelayDays', label: 'Expected Delay', sortable: true, align: 'right' },
  { key: 'status', label: 'Status', sortable: false, align: 'center' },
  { key: 'action', label: 'Action', sortable: false, align: 'right' },
]

/**
 * High-risk projects table for the Risk Analysis page. Supports sorting
 * (click a column header), a quick search, row selection and the View action.
 * Selection follows the same mechanism as the dashboard: the parent page
 * holds the selected project state, and the in-page analysis panel updates.
 */
export default function RiskProjectTable({
  projects = [],
  selectedId = null,
  onView,
  loading = false,
  onResetFilters,
}) {
  const [sort, setSort] = useState({ key: 'delayProbability', dir: 'desc' })
  const [search, setSearch] = useState('')

  const visibleProjects = useMemo(() => {
    let rows = projects
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
    }
    const column = COLUMNS.find((c) => c.key === sort.key)
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      if (sort.key === 'riskLevel') {
        return (RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel]) * dir
      }
      if (column && !column.string) {
        return ((Number(a[sort.key]) || 0) - (Number(b[sort.key]) || 0)) * dir
      }
      return String(a[sort.key] ?? '').localeCompare(String(b[sort.key] ?? '')) * dir
    })
  }, [projects, search, sort])

  const activeColumn = COLUMNS.find((c) => c.key === sort.key)

  const toggleSort = (key) => {
    setSort((current) => {
      if (current.key === key) {
        return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
      }
      // Numeric columns read best sorted high-to-low first, strings low-to-high.
      const startsDesc = key === 'delayProbability' || key === 'expectedDelayDays'
      return { key, dir: startsDesc ? 'desc' : 'asc' }
    })
  }

  return (
    <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      {/* Card header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">High-Risk Projects</h3>
          <p className="text-[11px] text-gray-500">
            {visibleProjects.length} of {projects.length} filtered projects · sorted by{' '}
            {activeColumn ? activeColumn.label.toLowerCase() : '—'} ({sort.dir})
          </p>
        </div>
        <SearchBar
          placeholder="Search name or ID…"
          value={search}
          onChange={setSearch}
          className="w-44 sm:w-56"
        />
      </div>

      {/* Table */}
      {loading ? (
        <Loader className="py-10" />
      ) : visibleProjects.length === 0 ? (
        <div className="flex flex-col items-center">
          <EmptyState title="No Projects Match" message="No projects match the selected filters." />
          {onResetFilters ? (
            <Button variant="outline" size="sm" onClick={onResetFilters} className="-mt-4">
              Reset Filters
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] uppercase tracking-wide text-gray-500">
                {COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    aria-sort={
                      sort.key === column.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined
                    }
                    className={`px-4 py-2.5 font-semibold ${
                      column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''
                    }`}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className={`inline-flex items-center gap-1 uppercase tracking-wide transition-colors hover:text-gray-700 ${
                          sort.key === column.key ? 'text-accent' : ''
                        }`}
                      >
                        {column.label}
                        {sort.key === column.key ? (
                          sort.dir === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      <span className="uppercase tracking-wide">{column.label}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visibleProjects.map((project) => {
                // Presentational status derived from the EXISTING risk level.
                const projectStatus = getProjectStatus(project)
                const isSelected = project.id === selectedId
                return (
                  <tr
                    key={project.id}
                    onClick={() => onView && onView(project)}
                    className={`cursor-pointer transition-colors hover:bg-gray-50/60 ${
                      isSelected ? 'bg-accent-50/60' : ''
                    }`}
                  >
                    {COLUMNS.map((column) => {
                      if (column.key === 'stage') {
                        return (
                          <td key={column.key} className="px-4 py-3">
                            <StatusBadge status={project.stage} />
                          </td>
                        )
                      }
                      if (column.key === 'riskLevel') {
                        return (
                          <td key={column.key} className="px-4 py-3">
                            <RiskBadge level={project.riskLevel} />
                          </td>
                        )
                      }
                      if (column.key === 'delayProbability') {
                        return (
                          <td key={column.key} className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <span className="w-8 text-right font-semibold tabular-nums text-gray-800">
                                {project.delayProbability}%
                              </span>
                              {/* Compact probability bar, colored with the
                                  shared risk palette */}
                              <div className="h-1.5 w-14 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(100, Math.max(0, project.delayProbability))}%`,
                                    backgroundColor: getRiskMeta(project.riskLevel).color,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        )
                      }
                      if (column.key === 'expectedDelayDays') {
                        return (
                          <td key={column.key} className="px-4 py-3 text-right text-gray-600">
                            {project.expectedDelayDays} days
                          </td>
                        )
                      }
                      if (column.key === 'status') {
                        return (
                          <td key={column.key} className="px-4 py-3 text-center">
                            {projectStatus ? (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${projectStatus.className}`}
                              >
                                {projectStatus.label}
                              </span>
                            ) : null}
                          </td>
                        )
                      }
                      if (column.key === 'action') {
                        return (
                          <td key={column.key} className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                onView && onView(project)
                              }}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent-50"
                            >
                              <Eye className="h-3 w-3" /> View
                            </button>
                          </td>
                        )
                      }
                      return (
                        <td
                          key={column.key}
                          className={`px-4 py-3 ${
                            column.key === 'id'
                              ? 'font-semibold text-accent'
                              : column.key === 'name'
                                ? 'max-w-[200px] truncate font-medium text-gray-800'
                                : 'text-gray-600'
                          }`}
                          title={column.key === 'name' ? project.name : undefined}
                        >
                          {project[column.key]}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}

            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
