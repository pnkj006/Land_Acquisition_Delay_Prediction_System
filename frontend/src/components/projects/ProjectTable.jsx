import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardPlus, Eye } from 'lucide-react'
import RiskBadge from '../common/RiskBadge.jsx'
import StatusBadge from '../common/StatusBadge.jsx'
import SearchBar from '../common/SearchBar.jsx'
import Button from '../common/Button.jsx'
import Pagination from '../common/Pagination.jsx'
import Loader from '../common/Loader.jsx'
import EmptyState from '../common/EmptyState.jsx'
import ErrorState from '../common/ErrorState.jsx'
import UpdateStatusForm from './UpdateStatusForm.jsx'
import { getProjectStatus } from '../../utils/riskUtils'

export default function ProjectTable({
  projects = [],
  loading = false,
  error = null,
  pagination = { total: 0, page: 1, pageSize: 5, totalPages: 1 },
  filters = {},
  onFiltersChange,
  title = 'My Projects',
  subtitle,
  onView,
  onRetry,
  compact = false,
}) {
  const navigate = useNavigate()
  const [search, setSearch] = useState(filters.search || '')
  const [updateFormOpen, setUpdateFormOpen] = useState(false)

  const handleSearchChange = (value) => {
    setSearch(value)
    // Debounce-free for mock data; swap for a debounced value with a real API.
    onFiltersChange && onFiltersChange({ ...filters, search: value, page: 1 })
  }

  const handlePageChange = (page) => {
    onFiltersChange && onFiltersChange({ ...filters, page })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      {/* Card header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          {subtitle ? <p className="text-[11px] text-gray-500">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <SearchBar
            placeholder="Search projects…"
            value={search}
            onChange={handleSearchChange}
            className="w-44"
          />
          <Button size="sm" icon={ClipboardPlus} onClick={() => setUpdateFormOpen(true)}>
            Add Field Update
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loader className="py-10" />
      ) : error ? (
        <ErrorState message="Failed to load projects." onRetry={onRetry} />
      ) : projects.length === 0 ? (
        <EmptyState title="No Projects Found" message="Try adjusting your search." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2.5 font-semibold">Project ID</th>
                <th className="px-4 py-2.5 font-semibold">Project Name</th>
                <th className="px-4 py-2.5 font-semibold">Type</th>
                <th className="px-4 py-2.5 font-semibold">Stage</th>
                <th className="px-4 py-2.5 font-semibold">Risk Level</th>
                <th className="px-4 py-2.5 text-right font-semibold">Delay Prob.</th>
                <th className="px-4 py-2.5 text-right font-semibold">Expected Delay</th>
                <th className="px-4 py-2.5 text-center font-semibold">Status</th>
                <th className="px-4 py-2.5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {projects.map((project) => {
                // Presentational status derived from the project's risk level.
                const projectStatus = getProjectStatus(project)
                return (
                <tr
                  key={project.id}
                  className="cursor-pointer transition-colors hover:bg-gray-50/60"
                  onClick={() => (onView ? onView(project) : navigate(`/projects/${project.id}`))}
                >
                  <td className="px-4 py-3 font-semibold text-accent">{project.id}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 font-medium text-gray-800">{project.name}</td>
                  <td className="px-4 py-3 text-gray-600">{project.type}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={project.stage} />
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge level={project.riskLevel} />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{project.delayProbability}%</td>
                  <td className="px-4 py-3 text-right text-gray-600">{project.expectedDelayDays} days</td>
                  <td className="px-4 py-3 text-center">
                    {projectStatus ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${projectStatus.className}`}
                      >
                        {projectStatus.label}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onView ? onView(project) : navigate(`/projects/${project.id}`)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent-50"
                    >
                      <Eye className="h-3 w-3" /> View
                    </button>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination footer */}
      {!loading && !error && projects.length > 0 && !compact ? (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={handlePageChange}
        />
      ) : null}

      <UpdateStatusForm open={updateFormOpen} onClose={() => setUpdateFormOpen(false)} />
    </div>
  )
}
