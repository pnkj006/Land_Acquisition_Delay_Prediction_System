import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, AlertTriangle, ArrowRight, Bell, Clock, Eye, Lightbulb, ClipboardList } from 'lucide-react'
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout.jsx'
import PageHeader from '../../components/layout/PageHeader.jsx'
import SummaryCard from '../../components/dashboard/SummaryCard.jsx'
import SearchBar from '../../components/common/SearchBar.jsx'
import FilterDropdown from '../../components/common/FilterDropdown.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Loader from '../../components/common/Loader.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import Modal from '../../components/common/Modal.jsx'
import Button from '../../components/common/Button.jsx'
import { useProjects } from '../../hooks/useProjects.js'
import { useAlerts } from '../../hooks/useAlerts.js'
import { useFieldUpdates } from '../../hooks/useFieldUpdates.js'
import { useRecommendations } from '../../hooks/useRecommendations.js'
import { formatDateTimeShort } from '../../utils/formatters'
import { timeAgo } from '../../utils/dateUtils'

/**
 * Short activity labels for the alert types that already exist in
 * alerts.api (same type keys used by AlertCard's TYPE_META). The alert's own
 * message is always shown underneath, so the source text is never hidden.
 */
const ALERT_ACTIVITY_LABEL = {
  risk: 'Risk Level Updated',
  legal: 'Legal Dispute Filed',
  compensation: 'Compensation Disbursement Overdue',
  approval: 'Approval Pending Beyond SLA',
  update: 'Field Update Submitted',
}

const ACTIVITY_CATEGORIES = {
  ALERT: 'alerts',
  FIELD: 'fieldUpdates',
  RECOMMENDATION: 'recommendations',
}

const CATEGORY_FILTER_OPTIONS = [
  { value: ACTIVITY_CATEGORIES.ALERT, label: 'Alerts' },
  { value: ACTIVITY_CATEGORIES.FIELD, label: 'Field Updates' },
  { value: ACTIVITY_CATEGORIES.RECOMMENDATION, label: 'Recommendations' },
]

const CATEGORY_LABEL = {
  [ACTIVITY_CATEGORIES.ALERT]: 'Alert',
  [ACTIVITY_CATEGORIES.FIELD]: 'Field Update',
  [ACTIVITY_CATEGORIES.RECOMMENDATION]: 'Recommendation',
}


/**
 * Builds the chronological activity feed from the data that actually exists
 * in the frontend today — no backend activity log is invented:
 *   - alerts.api        → alert / risk-update events (timestamped)
 *   - field updates     → library session store (timestamped, with submittedBy)
 *   - recommendations   → recommendation records + their real status
 * A record without a timestamp keeps `timestamp: null` and is listed after the
 * timestamped ones with "N/A" in Date / Time.
 */
function buildActivityRows({ alerts = [], updates = [], recommendations = [], projectById }) {
  const rows = []

  alerts.forEach((alert) => {
    const project = projectById.get(alert.projectId)
    rows.push({
      key: `alert-${alert.id}`,
      category: ACTIVITY_CATEGORIES.ALERT,
      label: ALERT_ACTIVITY_LABEL[alert.type] || 'Alert Generated',
      message: alert.message,
      projectId: alert.projectId || null,
      projectName: project ? project.name : null,
      district: project ? project.district : null,
      performedBy: 'System',
      performedByRole: null,
      timestamp: alert.timestamp || null,
      status: null,
      record: alert,
    })
  })

  updates.forEach((update) => {
    const project = projectById.get(update.projectId)
    rows.push({
      key: `update-${update.id}`,
      category: ACTIVITY_CATEGORIES.FIELD,
      label: 'Field Update Submitted',
      message:
        update.previousStage && update.stage && update.previousStage !== update.stage
          ? `${update.previousStage} → ${update.stage}${update.note ? ` · ${update.note}` : ''}`
          : update.note || update.updateType || 'Field update recorded',
      projectId: update.projectId || null,
      projectName: update.projectName || (project ? project.name : null),
      district: project ? project.district : null,
      performedBy: update.submittedBy?.name || 'N/A',
      performedByRole: update.submittedBy?.role || null,
      timestamp: update.submittedAt || null,
      status: update.stage || null,
      record: update,
    })
  })

  recommendations.forEach((rec) => {
    rows.push({
      key: `rec-${rec.id}`,
      category: ACTIVITY_CATEGORIES.RECOMMENDATION,
      label: 'Recommendation Logged',
      message: rec.title,
      projectId: rec.projectId || rec.project?.id || null,
      projectName: rec.project?.name || projectById.get(rec.projectId)?.name || null,
      district: rec.project?.district || projectById.get(rec.projectId)?.district || null,
      performedBy: 'System',
      performedByRole: null,
      // Recommendations carry no timestamp in the current data model.
      timestamp: null,
      status: rec.status || null,
      record: rec,
    })
  })

  return rows.sort((a, b) => {
    if (!a.timestamp && !b.timestamp) return 0
    if (!a.timestamp) return 1
    if (!b.timestamp) return -1
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })
}

const CATEGORY_ICON = {
  [ACTIVITY_CATEGORIES.ALERT]: Bell,
  [ACTIVITY_CATEGORIES.FIELD]: ClipboardList,
  [ACTIVITY_CATEGORIES.RECOMMENDATION]: Lightbulb,
}

/**
 * Admin-only system activity page.
 *
 * There is no activity-log backend in this project, so the feed is assembled
 * ONLY from records that already exist in the app: the alerts already loaded
 * by useAlerts, the field updates recorded through useFieldUpdates and the
 * recommendations materialised by useRecommendations. Counts and timestamps
 * come straight from those records; fields a record does not carry render
 * "N/A" (recommendations have no timestamp, alerts have no status).
 */
export default function AdminSystemActivity() {
  const navigate = useNavigate()
  const { projects, loading: projectsLoading, error: projectsError, refetch: refetchProjects } = useProjects({ page: 1, pageSize: 100 })
  const { alerts, loading: alertsLoading, error: alertsError, refetch: refetchAlerts } = useAlerts()
  const { updates, loading: updatesLoading, error: updatesError, refetch: refetchUpdates } = useFieldUpdates()
  const { recommendations, loading: recsLoading, error: recsError, refetch: refetchRecs } = useRecommendations()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [selected, setSelected] = useState(null)

  const loading = projectsLoading || alertsLoading || updatesLoading || recsLoading
  const error = projectsError || alertsError || updatesError || recsError

  const projectById = useMemo(() => {
    const map = new Map()
    projects.forEach((project) => map.set(project.id, project))
    return map
  }, [projects])

  const rows = useMemo(
    () => buildActivityRows({ alerts, updates, recommendations, projectById }),
    [alerts, updates, recommendations, projectById],
  )

  const summary = useMemo(
    () => ({
      total: rows.length,
      fieldUpdates: updates.length,
      riskUpdates: alerts.filter((alert) => alert.type === 'risk').length,
      alerts: alerts.length,
    }),
    [rows, updates, alerts],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (category !== '' && row.category !== category) return false
      if (!q) return true
      return [row.label, row.message, row.projectId, row.projectName, row.district, row.performedBy]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    })
  }, [rows, search, category])

  const hasActiveFilters = search.trim() !== '' || category !== ''

  const handleClear = () => {
    setSearch('')
    setCategory('')
  }

  const handleRetry = () => {
    refetchProjects()
    refetchAlerts()
    refetchUpdates()
    refetchRecs()
  }

  return (
    <AdminDashboardLayout activeKey="system-activity">
      <PageHeader
        title="System Activity"
        subtitle="Monitor recent activity across projects, alerts and field operations."
      />

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard icon={Activity} value={loading ? '—' : summary.total} label="Recent Activities" />
        <SummaryCard
          icon={ClipboardList}
          value={loading ? '—' : summary.fieldUpdates}
          label="Field Updates"
          accent="text-blue-600"
          bg="bg-blue-50"
        />
        <SummaryCard
          icon={AlertTriangle}
          value={loading ? '—' : summary.riskUpdates}
          label="Risk Updates"
          accent="text-red-600"
          bg="bg-red-50"
        />
        <SummaryCard
          icon={Bell}
          value={loading ? '—' : summary.alerts}
          label="Alerts"
          accent="text-amber-600"
          bg="bg-amber-50"
        />
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchBar placeholder="Search activity..." value={search} onChange={setSearch} className="w-full sm:max-w-sm" />
        <FilterDropdown
          options={CATEGORY_FILTER_OPTIONS}
          value={category}
          onChange={setCategory}
          label="Filter by activity type"
          allLabel="All Activity"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Activity Timeline</h3>
            <p className="text-[11px] text-gray-500">
              {loading
                ? 'Loading activity...'
                : `Showing ${filtered.length} ${filtered.length === 1 ? 'activity' : 'activities'}`}
            </p>
          </div>
          {hasActiveFilters && !loading ? (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md px-2 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent-50"
            >
              Clear Filters
            </button>
          ) : null}
        </div>

        {loading ? (
          <Loader className="py-10" />
        ) : error ? (
          <ErrorState message="Failed to load system activity." onRetry={handleRetry} />
        ) : filtered.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <EmptyState title="No activity found." message="Try adjusting your search or filters." />
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleClear}
                className="mt-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Clear Filters
              </button>
            ) : null}
          </div>
        ) : (

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-2.5 font-semibold">Activity</th>
                  <th className="px-4 py-2.5 font-semibold">Project</th>
                  <th className="px-4 py-2.5 font-semibold">District</th>
                  <th className="px-4 py-2.5 font-semibold">Performed By</th>
                  <th className="px-4 py-2.5 font-semibold">Date / Time</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((row) => {
                  const Icon = CATEGORY_ICON[row.category] || Activity
                  return (
                    <tr
                      key={row.key}
                      onClick={() => setSelected(row)}
                      className="cursor-pointer transition-colors hover:bg-gray-50/60"
                    >
                      <td className="max-w-[320px] px-4 py-3">
                        <span className="flex items-start gap-2">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block font-medium text-gray-800">{row.label}</span>
                            <span className="block truncate text-[11px] text-gray-400">{row.message}</span>
                          </span>
                        </span>
                      </td>
                      <td className="max-w-[220px] px-4 py-3">
                        {row.projectName ? (
                          <>
                            <span className="block truncate font-medium text-gray-700">{row.projectName}</span>
                            <span className="block text-[10px] text-gray-400">{row.projectId}</span>
                          </>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="max-w-[160px] truncate px-4 py-3 text-gray-600">{row.district || 'N/A'}</td>
                      <td className="max-w-[180px] px-4 py-3">
                        <span className="block truncate text-gray-700">{row.performedBy}</span>
                        {row.performedByRole ? (
                          <span className="block text-[10px] text-gray-400">{row.performedByRole}</span>
                        ) : null}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {row.timestamp ? (
                          <>
                            <span className="block">{formatDateTimeShort(row.timestamp)}</span>
                            <span className="block text-[10px] text-gray-400">{timeAgo(row.timestamp)}</span>
                          </>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.status ? <StatusBadge status={row.status} /> : <span className="text-gray-400">N/A</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            setSelected(row)
                          }}
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
      </div>

      {/* Activity details — a thin wrapper over the existing Modal. Every value
          comes from the activity's own record; unavailable fields show N/A. */}
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Activity Details"
        size="md"
        footer={
          selected && selected.projectId ? (
            <Button
              icon={ArrowRight}
              onClick={() => {
                const projectId = selected.projectId
                setSelected(null)
                navigate(`/admin/projects/${projectId}`)
              }}
            >
              Open Project
            </Button>
          ) : null
        }
      >
        {selected ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">
                {(() => {
                  const Icon = CATEGORY_ICON[selected.category] || Activity
                  return <Icon className="h-5 w-5" />
                })()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800">{selected.label}</p>
                <p className="mt-0.5 text-xs leading-snug text-gray-600">{selected.message}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>
                    {selected.timestamp
                      ? `${formatDateTimeShort(selected.timestamp)} · ${timeAgo(selected.timestamp)}`
                      : 'N/A'}
                  </span>
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 rounded-lg border border-gray-100 bg-gray-50/60 p-3 text-xs sm:grid-cols-3">
              <div className="min-w-0">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Category</dt>
                <dd className="mt-0.5 font-medium text-gray-700">{CATEGORY_LABEL[selected.category] || 'N/A'}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Project</dt>
                <dd className="mt-0.5 font-medium text-gray-700">
                  {selected.projectName ? `${selected.projectId} — ${selected.projectName}` : 'N/A'}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">District</dt>
                <dd className="mt-0.5 font-medium text-gray-700">{selected.district || 'N/A'}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Performed By</dt>
                <dd className="mt-0.5 font-medium text-gray-700">{selected.performedBy}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Role</dt>
                <dd className="mt-0.5 font-medium text-gray-700">{selected.performedByRole || 'N/A'}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Status</dt>
                <dd className="mt-0.5 font-medium text-gray-700">
                  {selected.status ? <StatusBadge status={selected.status} /> : 'N/A'}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}
      </Modal>
    </AdminDashboardLayout>
  )
}
