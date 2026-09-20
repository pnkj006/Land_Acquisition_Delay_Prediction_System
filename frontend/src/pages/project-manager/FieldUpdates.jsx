import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Eye,
  FolderKanban,
  MapPin,
  Paperclip,
  RotateCcw,
  User,
  X,
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout.jsx'
import PageHeader from '../../components/layout/PageHeader.jsx'
import FieldUpdateForm from '../../components/field-updates/FieldUpdateForm.jsx'
import SummaryCard from '../../components/dashboard/SummaryCard.jsx'
import FilterDropdown from '../../components/common/FilterDropdown.jsx'
import SearchBar from '../../components/common/SearchBar.jsx'
import Button from '../../components/common/Button.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Loader from '../../components/common/Loader.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { useFieldUpdates } from '../../hooks/useFieldUpdates.js'
import { useProjects } from '../../hooks/useProjects.js'
import { FIELD_UPDATE_TYPES, PROJECT_STAGES } from '../../utils/constants'
import { getTypeIcon } from '../../utils/typeIcons'
import { timeAgo } from '../../utils/dateUtils'
import { formatDate, formatDateTimeShort } from '../../utils/formatters'

const DAY_MS = 24 * 60 * 60 * 1000

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`
}

const DEFAULT_FILTERS = { projectId: '', stage: '', updateType: '', search: '' }

/**
 * Dedicated Field Updates workspace for District/Project Managers.
 *
 * Data sources (all existing, nothing invented):
 *  - field-updates.api (via useFieldUpdates): the in-session update feed and
 *    submission (additive module — no existing endpoint changed).
 *  - projects.api (via useProjects): project context for the form dropdown,
 *    feed icons and the "View project" action (existing details route).
 *  - AuthContext: submittedBy = the logged-in user.
 *
 * The dashboard's existing "Add Field Update" modal (UpdateStatusForm +
 * updateProjectStatus) is untouched and keeps working as before.
 */
export default function FieldUpdates() {
  const navigate = useNavigate()
  const { updates, loading, error, refetch, submit } = useFieldUpdates()
  const { projects } = useProjects({ pageSize: 100 })

  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [submitting, setSubmitting] = useState(false)
  const [lastSubmitted, setLastSubmitted] = useState(null)

  const filteredUpdates = useMemo(() => {
    return updates.filter((u) => {
      if (filters.projectId && u.projectId !== filters.projectId) return false
      if (filters.stage && u.stage !== filters.stage) return false
      if (filters.updateType && u.updateType !== filters.updateType) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const haystack = `${u.note} ${u.projectId} ${u.projectName}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [updates, filters])

  // Summary KPIs — computed from the FILTERED set, never hardcoded.
  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * DAY_MS
    return {
      total: filteredUpdates.length,
      thisWeek: filteredUpdates.filter(
        (u) => new Date(u.submittedAt).getTime() >= weekAgo,
      ).length,
      projectsCovered: new Set(filteredUpdates.map((u) => u.projectId)).size,
    }
  }, [filteredUpdates])

  const handleResetFilters = () => setFilters(DEFAULT_FILTERS)
  const hasActiveFilters = Boolean(filters.projectId || filters.stage || filters.updateType || filters.search)

  const handleSubmit = async (payload) => {
    setSubmitting(true)
    try {
      const res = await submit(payload)
      setLastSubmitted(res.data)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout activeKey="field-updates">
      <PageHeader
        title="Field Updates"
        subtitle="Record field-level project progress, issues, evidence, and updates."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-100 bg-white px-3 py-1.5 text-xs shadow-sm">
            <ClipboardList className="h-3.5 w-3.5 text-gray-400" />
            <span className="font-medium text-gray-700">Updates</span>
            <span className="font-semibold text-gray-500">{updates.length}</span>
          </span>
        }
      />

      {loading ? (
        <Loader label="Loading field updates…" fullPage className="mt-6" />
      ) : error ? (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <ErrorState message="Unable to load field updates." onRetry={refetch} />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Summary KPIs — computed from the filtered set */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard icon={ClipboardList} value={stats.total} label="Total Updates" />
            <SummaryCard icon={FolderKanban} value={stats.projectsCovered} label="Projects Covered" />
            <SummaryCard icon={CalendarClock} value={stats.thisWeek} label="Submitted This Week" />
          </div>

          {/* Filter bar — all filters functional */}
          <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex min-w-[170px] flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Project</span>
                <FilterDropdown
                  options={projects.map((p) => ({ value: p.id, label: `${p.id} — ${p.name}` }))}
                  value={filters.projectId}
                  onChange={(next) => setFilters((f) => ({ ...f, projectId: next }))}
                  allLabel="All Projects"
                  className="w-full"
                />
              </div>
              <div className="flex min-w-[150px] flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Stage</span>
                <FilterDropdown
                  options={PROJECT_STAGES.map((s) => ({ value: s, label: s }))}
                  value={filters.stage}
                  onChange={(next) => setFilters((f) => ({ ...f, stage: next }))}
                  allLabel="All Stages"
                  className="w-full"
                />
              </div>
              <div className="flex min-w-[160px] flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Update Type</span>
                <FilterDropdown
                  options={FIELD_UPDATE_TYPES.map((t) => ({ value: t, label: t }))}
                  value={filters.updateType}
                  onChange={(next) => setFilters((f) => ({ ...f, updateType: next }))}
                  allLabel="All Types"
                  className="w-full"
                />
              </div>
              <SearchBar
                placeholder="Search notes, projects…"
                value={filters.search}
                onChange={(value) => setFilters((f) => ({ ...f, search: value }))}
                className="w-full sm:w-56"
              />
              <div className="ml-auto flex items-center gap-3 pb-0.5">
                <span className="text-xs text-gray-500">
                  {filteredUpdates.length} {filteredUpdates.length === 1 ? 'update' : 'updates'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  icon={RotateCcw}
                  onClick={handleResetFilters}
                  disabled={!hasActiveFilters}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </section>

          {/* Success state — shown after a successful submission. Displays the
              real submitted record. No risk/prediction claims are made: the
              existing system does not return updated predictions for field
              updates yet. */}
          {lastSubmitted ? (
            <section className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-semibold text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Field update submitted successfully.
                </p>
                <button
                  type="button"
                  onClick={() => setLastSubmitted(null)}
                  aria-label="Dismiss"
                  className="rounded-md p-1 text-green-600 transition-colors hover:bg-green-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 text-xs sm:grid-cols-4">
                <div className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-green-600/70">Project</dt>
                  <dd className="truncate font-semibold text-gray-700">
                    {lastSubmitted.projectId} — {lastSubmitted.projectName}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-green-600/70">Update Type</dt>
                  <dd className="truncate font-semibold text-gray-700">{lastSubmitted.updateType}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-green-600/70">Stage</dt>
                  <dd className="truncate font-semibold text-gray-700">{lastSubmitted.stage}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-green-600/70">Submitted At</dt>
                  <dd className="truncate font-semibold text-gray-700">
                    {formatDateTimeShort(lastSubmitted.submittedAt)}
                  </dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  icon={Eye}
                  onClick={() => navigate(`/project-manager/projects/${lastSubmitted.projectId}`)}
                >
                  View Project
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const target = document.getElementById('update-history')
                    if (target) target.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  View Update History
                </Button>
              </div>
            </section>
          ) : null}

          {/* Submission form — inline card (reuses Modal-era primitives:
              Select/Input styling, Button, AuthContext) */}
          <FieldUpdateForm projects={projects} submitting={submitting} onSubmit={handleSubmit} />

          {/* Updates feed */}
          <section id="update-history" className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Updates Feed</h3>
              <p className="text-[11px] text-gray-400">Newest first · this session</p>
            </div>

            {filteredUpdates.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title={updates.length === 0 ? 'No Field Updates Yet' : 'No Updates Match'}
                message={
                  updates.length === 0
                    ? 'Submit your first update using the form above.'
                    : 'No field updates match the selected filters.'
                }
              />
            ) : (
              <div className="flex flex-col divide-y divide-gray-50">
                {filteredUpdates.map((update) => {
                  const project = projects.find((p) => p.id === update.projectId) || null
                  const TypeIcon = getTypeIcon(project ? project.type : '')
                  return (
                    <article
                      key={update.id}
                      className="rounded-lg px-2 py-3 transition-colors hover:bg-gray-50/60"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                            <TypeIcon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-800">
                              {update.projectName || update.projectId}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {update.projectId} · {timeAgo(update.submittedAt)}
                            </p>
                          </div>
                        </div>
                        {/* Update type + stage transition — existing badges */}
                        {update.updateType ? (
                          <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-semibold text-accent">
                            {update.updateType}
                          </span>
                        ) : null}
                        <div className="flex items-center gap-1.5">
                          {update.previousStage ? <StatusBadge status={update.previousStage} /> : null}
                          {update.previousStage ? <ArrowRight className="h-3 w-3 text-gray-400" /> : null}
                          <StatusBadge status={update.stage} />
                        </div>
                      </div>

                      {update.note ? (
                        <p className="mt-2 text-xs leading-snug text-gray-600">{update.note}</p>
                      ) : null}

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-gray-400">
                        {update.submittedBy ? (
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {update.submittedBy.name} · {update.submittedBy.role}
                          </span>
                        ) : null}
                        {update.attachment ? (
                          <span className="inline-flex items-center gap-1">
                            <Paperclip className="h-3 w-3" />
                            <span className="max-w-[180px] truncate">{update.attachment.name}</span>
                            <span className="text-gray-300">({formatBytes(update.attachment.size)})</span>
                          </span>
                        ) : null}
                        {update.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {update.location.source === 'device' ? 'Current location' : 'Project site'} ·{' '}
                            {update.location.lat}, {update.location.lng}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(update.submittedAt)}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                          Submitted
                        </span>
                        {/* Existing project details route — same navigation as
                            every other page */}
                        <button
                          type="button"
                          onClick={() => navigate(`/project-manager/projects/${update.projectId}`)}
                          className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent-50"
                        >
                          <Eye className="h-3 w-3" /> View project
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

        </div>
      )}
    </DashboardLayout>
  )
}
