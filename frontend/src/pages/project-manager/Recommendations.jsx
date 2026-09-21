import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Eye, RefreshCw, X } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout.jsx'
import PageHeader from '../../components/layout/PageHeader.jsx'
import SummaryCard from '../../components/dashboard/SummaryCard.jsx'
import Button from '../../components/common/Button.jsx'
import Select from '../../components/common/Select.jsx'
import SearchBar from '../../components/common/SearchBar.jsx'
import Loader from '../../components/common/Loader.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { useRecommendations } from '../../hooks/useRecommendations'
import { RECOMMENDATION_STATUSES } from '../../api/recommendations.api'
import { PRIORITY_LEVELS } from '../../utils/constants'
import { formatDateTimeShort } from '../../utils/formatters'

const PRIORITY_BADGES = {
  [PRIORITY_LEVELS.HIGH]: 'bg-red-100 text-red-700 border border-red-200',
  [PRIORITY_LEVELS.MEDIUM]: 'bg-amber-100 text-amber-700 border border-amber-200',
  [PRIORITY_LEVELS.LOW]: 'bg-green-100 text-green-700 border border-green-200',
}

const STATUS_CHIPS = {
  [RECOMMENDATION_STATUSES.PENDING]: 'bg-gray-100 text-gray-600',
  [RECOMMENDATION_STATUSES.IN_PROGRESS]: 'bg-blue-50 text-blue-700',
  [RECOMMENDATION_STATUSES.ACCEPTED]: 'bg-green-50 text-green-700',
  [RECOMMENDATION_STATUSES.COMPLETED]: 'bg-green-100 text-green-800',
  [RECOMMENDATION_STATUSES.DISMISSED]: 'bg-gray-100 text-gray-400',
}

const STATUS_DOT = {
  [RECOMMENDATION_STATUSES.PENDING]: 'bg-gray-400',
  [RECOMMENDATION_STATUSES.IN_PROGRESS]: 'bg-blue-500',
  [RECOMMENDATION_STATUSES.ACCEPTED]: 'bg-green-500',
  [RECOMMENDATION_STATUSES.COMPLETED]: 'bg-green-600',
  [RECOMMENDATION_STATUSES.DISMISSED]: 'bg-gray-300',
}

const PRIORITY_RANK = { [PRIORITY_LEVELS.HIGH]: 0, [PRIORITY_LEVELS.MEDIUM]: 1, [PRIORITY_LEVELS.LOW]: 2 }

const EMPTY_FILTERS = { search: '', project: 'all', priority: 'all', status: 'all', type: 'all' }

function PriorityBadge({ priority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        PRIORITY_BADGES[priority] || PRIORITY_BADGES[PRIORITY_LEVELS.MEDIUM]
      }`}
    >
      {priority} Priority
    </span>
  )
}

function StatusChip({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        STATUS_CHIPS[status] || STATUS_CHIPS[RECOMMENDATION_STATUSES.PENDING]
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status] || STATUS_DOT.Pending}`} aria-hidden="true" />
      {status}
    </span>
  )
}

/** Filtering + sort: priority (High→Low), then project id. All filters are
 * functional — search spans project id/name/district, title and type. */
function applyFilters(recommendations, filters) {
  const q = filters.search.trim().toLowerCase()
  return recommendations
    .filter((rec) => {
      if (filters.project !== 'all' && rec.projectId !== filters.project) return false
      if (filters.priority !== 'all' && rec.priority !== filters.priority) return false
      if (filters.status !== 'all' && rec.status !== filters.status) return false
      if (filters.type !== 'all' && rec.type !== filters.type) return false
      if (q) {
        const haystack = [rec.project?.id, rec.project?.name, rec.project?.district, rec.title, rec.type]
        if (!haystack.some((v) => String(v ?? '').toLowerCase().includes(q))) return false
      }
      return true
    })
    .sort(
      (a, b) =>
        (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9) ||
        String(a.projectId).localeCompare(String(b.projectId)),
    )
}

function RecommendationCard({ rec, onViewProject, onAccept, onDismiss, onComplete, updating }) {
  const isActive = rec.status !== RECOMMENDATION_STATUSES.COMPLETED && rec.status !== RECOMMENDATION_STATUSES.DISMISSED
  return (
    <article
      className={`rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        rec.priority === PRIORITY_LEVELS.HIGH && isActive ? 'border-red-100' : 'border-gray-100'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={rec.priority} />
          <StatusChip status={rec.status} />
          <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
            {rec.type}
          </span>
        </div>
        <span className="text-[10px] text-gray-400">{rec.project?.stage} stage</span>
      </div>

      <h3 className="mt-2.5 text-sm font-bold text-gray-800">
        {rec.project?.id} — {rec.project?.name}
      </h3>
      <p className="text-[11px] text-gray-500">{rec.project?.district}</p>

      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Recommended action</p>
        <p className="mt-1 flex items-start gap-2 text-xs leading-relaxed text-gray-700">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
          {rec.title}
        </p>
      </div>

      {/* Risk-factor context — real SHAP output from the risk service */}
      <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          Leading model risk factor (SHAP)
        </p>
        {rec.risk ? (
          <p className="mt-0.5 text-xs text-gray-700">
            {rec.risk.topFactor ?? '—'}{' '}
            <span className="text-gray-400">
              · current prediction {rec.risk.delayProbability}% delay probability ·{' '}
              {rec.risk.expectedDelayDays} days expected delay
            </span>
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-gray-400">Risk model context unavailable.</p>
        )}
      </div>

      {/* Expected impact — targets the real current prediction; no invented deltas */}
      {rec.risk ? (
        <p className="mt-2 text-[11px] text-gray-500">
          <span className="font-semibold text-gray-600">Expected impact:</span> completing this action
          targets the project&apos;s current predicted delay ({rec.risk.delayProbability}% ·{' '}
          {rec.risk.expectedDelayDays} days). Actual improvement is confirmed after re-prediction.
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-50 pt-3">
        <Button variant="outline" size="sm" icon={Eye} onClick={() => onViewProject(rec.projectId)}>
          View Project
        </Button>
        {isActive ? (
          <>
            {rec.status === RECOMMENDATION_STATUSES.ACCEPTED ? (
              <Button size="sm" icon={Check} onClick={() => onComplete(rec.id)} disabled={updating}>
                {updating ? 'Updating…' : 'Mark as Completed'}
              </Button>
            ) : (
              <Button size="sm" icon={Check} onClick={() => onAccept(rec.id)} disabled={updating}>
                {updating ? 'Updating…' : 'Accept'}
              </Button>
            )}
            <Button variant="ghost" size="sm" icon={X} onClick={() => onDismiss(rec.id)} disabled={updating}>
              {updating ? 'Updating…' : 'Dismiss'}
            </Button>
          </>
        ) : null}
      </div>
    </article>
  )
}

export default function Recommendations() {
  const navigate = useNavigate()
  const { recommendations, loading, error, refetch, updateStatus, updatingId, lastUpdated } =
    useRecommendations()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [actionError, setActionError] = useState(null)

  const filtered = useMemo(() => applyFilters(recommendations, filters), [recommendations, filters])

  const summary = useMemo(
    () => ({
      total: recommendations.length,
      high: recommendations.filter((r) => r.priority === PRIORITY_LEVELS.HIGH).length,
      pending: recommendations.filter(
        (r) =>
          r.status === RECOMMENDATION_STATUSES.PENDING ||
          r.status === RECOMMENDATION_STATUSES.IN_PROGRESS ||
          r.status === RECOMMENDATION_STATUSES.ACCEPTED,
      ).length,
      completed: recommendations.filter((r) => r.status === RECOMMENDATION_STATUSES.COMPLETED).length,
    }),
    [recommendations],
  )

  const attention = useMemo(
    () =>
      applyFilters(
        recommendations.filter(
          (r) =>
            r.priority === PRIORITY_LEVELS.HIGH &&
            r.status !== RECOMMENDATION_STATUSES.COMPLETED &&
            r.status !== RECOMMENDATION_STATUSES.DISMISSED,
        ),
        EMPTY_FILTERS,
      ).slice(0, 3),
    [recommendations],
  )

  const options = useMemo(() => {
    const unique = (key) =>
      [...new Set(recommendations.map((r) => r[key]).filter(Boolean))].sort().map((v) => ({ value: v, label: v }))
    return {
      projects: [...new Map(recommendations.map((r) => [r.projectId, r.project])).entries()]
        .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
        .map(([id, project]) => ({ value: id, label: `${id} — ${project?.name ?? ''}` })),
      priorities: unique('priority'),
      statuses: unique('status'),
      types: unique('type'),
    }
  }, [recommendations])

  // Status updates only flip the UI after the service call resolves; on
  // failure the card keeps its server state and an inline error is shown.
  const handleAction = (action) => async (recId) => {
    setActionError(null)
    const ok = await action(recId)
    if (!ok) {
      setActionError('Unable to update recommendation. The server state is preserved — please retry.')
    }
  }

  const viewProject = (projectId) => navigate(`/projects/${projectId}`)

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    [filters.project, filters.priority, filters.status, filters.type].filter((v) => v !== 'all').length

  const cardHandlers = {
    onViewProject: viewProject,
    onAccept: handleAction((id) => updateStatus(id, RECOMMENDATION_STATUSES.ACCEPTED)),
    onDismiss: handleAction((id) => updateStatus(id, RECOMMENDATION_STATUSES.DISMISSED)),
    onComplete: handleAction((id) => updateStatus(id, RECOMMENDATION_STATUSES.COMPLETED)),
  }

  return (
    <DashboardLayout activeKey="recommendations">
      <PageHeader
        title="AI Recommendations"
        subtitle="Predictive, project-specific recommendations to help managers take timely corrective action."
        actions={
          <>
            {lastUpdated ? (
              <span className="hidden text-[11px] text-gray-400 lg:inline">
                Last Updated {formatDateTimeShort(lastUpdated)}
              </span>
            ) : null}
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={refetch}>
              Refresh
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader label="Loading recommendations…" />
        </div>
      ) : error ? (
        <ErrorState message="Unable to load recommendations." onRetry={refetch} />
      ) : recommendations.length === 0 ? (
        <EmptyState
          title="No recommendations available."
          message="Recommendations will appear when projects require corrective action."
        />
      ) : (
        <div className="flex flex-col gap-5">
          {/* Summary — computed from the loaded recommendation data */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryCard label="Total Recommendations" value={summary.total} tone="text-primary" bg="bg-primary-50" />
            <SummaryCard label="High Priority" value={summary.high} tone="text-red-600" bg="bg-red-50" />
            <SummaryCard label="Pending Action" value={summary.pending} tone="text-amber-600" bg="bg-amber-50" />
            <SummaryCard label="Completed" value={summary.completed} tone="text-green-600" bg="bg-green-50" />
          </div>

          {/* Filters — all functional */}
          <section className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <SearchBar
                placeholder="Search recommendations…"
                value={filters.search}
                onChange={(v) => setFilters((f) => ({ ...f, search: v }))}
                className="lg:col-span-2"
              />
              <Select
                label="Project"
                value={filters.project}
                onChange={(e) => setFilters((f) => ({ ...f, project: e.target.value }))}
                options={[{ value: 'all', label: 'All Projects' }, ...options.projects]}
              />
              <Select
                label="Priority"
                value={filters.priority}
                onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
                options={[{ value: 'all', label: 'All Priorities' }, ...options.priorities]}
              />
              <Select
                label="Status"
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                options={[{ value: 'all', label: 'All Status' }, ...options.statuses]}
              />
              <Select
                label="Recommendation Type"
                value={filters.type}
                onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
                options={[{ value: 'all', label: 'All Types' }, ...options.types]}
              />
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(EMPTY_FILTERS)}
                disabled={activeFilterCount === 0}
              >
                Reset Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </Button>
            </div>
          </section>

          {/* Needs Immediate Attention — high-priority, still actionable, newest first */}
          {attention.length > 0 ? (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Needs Immediate Attention
              </h2>
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {attention.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    rec={rec}
                    updating={updatingId === rec.id}
                    {...cardHandlers}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {/* All Recommendations */}
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
              All Recommendations ({filtered.length})
            </h2>
            {filtered.length === 0 ? (
              <EmptyState
                title="No recommendations match the selected filters."
                message="Adjust the filters above or reset them to see all recommendations."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {filtered.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    rec={rec}
                    updating={updatingId === rec.id}
                    {...cardHandlers}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Action failure — server state preserved, inline and dismissible */}
      {actionError ? (
        <p className="mt-3 text-[11px] text-red-600">
          {actionError}
          <button type="button" onClick={() => setActionError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </p>
      ) : null}
    </DashboardLayout>
  )
}




