import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
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

import {
  FIELD_UPDATE_TYPES,
  PROJECT_STAGES,
} from '../../utils/constants'

import { getTypeIcon } from '../../utils/typeIcons'
import { timeAgo } from '../../utils/dateUtils'
import {
  formatDate,
  formatDateTimeShort,
} from '../../utils/formatters'

import { updateStageProgress } from '../../api/projects.api'

const DAY_MS = 24 * 60 * 60 * 1000

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return ''

  const units = ['B', 'KB', 'MB', 'GB']

  let value = bytes
  let unit = 0

  while (
    value >= 1024 &&
    unit < units.length - 1
  ) {
    value /= 1024
    unit += 1
  }

  return `${value.toFixed(
    value >= 10 || unit === 0 ? 0 : 1,
  )} ${units[unit]}`
}

const DEFAULT_FILTERS = {
  projectId: '',
  stage: '',
  updateType: '',
  search: '',
}

export default function FieldUpdates() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    updates,
    loading,
    error,
    refetch,
  } = useFieldUpdates()

  const { projects } = useProjects({
    pageSize: 100,
  })

  const [filters, setFilters] = useState(
    DEFAULT_FILTERS,
  )

  const [submitting, setSubmitting] =
    useState(false)

  const [lastSubmitted, setLastSubmitted] =
    useState(null)

  /*
   * Filter existing field updates.
   */
  const filteredUpdates = useMemo(() => {
    return updates.filter((u) => {
      if (
        filters.projectId &&
        u.projectId !== filters.projectId
      ) {
        return false
      }

      if (
        filters.stage &&
        u.stage !== filters.stage
      ) {
        return false
      }

      if (
        filters.updateType &&
        u.updateType !== filters.updateType
      ) {
        return false
      }

      if (filters.search) {
        const q =
          filters.search.toLowerCase()

        const haystack =
          `${u.note || ''} ${
            u.projectId || ''
          } ${
            u.projectName || ''
          }`.toLowerCase()

        if (!haystack.includes(q)) {
          return false
        }
      }

      return true
    })
  }, [updates, filters])

  /*
   * Summary statistics.
   */
  const stats = useMemo(() => {
    const weekAgo =
      Date.now() - 7 * DAY_MS

    return {
      total: filteredUpdates.length,

      thisWeek:
        filteredUpdates.filter(
          (u) =>
            new Date(
              u.submittedAt,
            ).getTime() >= weekAgo,
        ).length,

      projectsCovered: new Set(
        filteredUpdates.map(
          (u) => u.projectId,
        ),
      ).size,
    }
  }, [filteredUpdates])

  /*
   * Reset filters.
   */
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  const hasActiveFilters = Boolean(
    filters.projectId ||
      filters.stage ||
      filters.updateType ||
      filters.search,
  )

  /*
   * Submit current stage progress.
   *
   * Backend receives:
   *
   * {
   *   stage,
   *   progressPct
   * }
   *
   * Backend handles:
   * - Previous stages -> 100%
   * - Current stage -> submitted percentage
   * - Future stages -> 0%
   */
  const handleSubmit = async (payload) => {
    setSubmitting(true)

    try {
      await updateStageProgress(
        payload.projectId,
        {
          stage: payload.stage,
          progressPct:
            payload.progressPct,
        },
      )

      /*
       * Refresh project list.
       */
      await queryClient.invalidateQueries({
        queryKey: ['projects'],
      })

      /*
       * Refresh individual project details.
       */
      await queryClient.invalidateQueries({
        queryKey: [
          'project',
          payload.projectId,
        ],
      })

      /*
       * Find submitted project.
       */
      const selectedProject =
        projects.find(
          (p) =>
            p.id === payload.projectId,
        )

      /*
       * Show success information.
       */
      setLastSubmitted({
        projectId:
          payload.projectId,

        projectName:
          selectedProject?.name ||
          payload.projectId,

        stage: payload.stage,

        progressPct:
          payload.progressPct,

        submittedAt:
          new Date().toISOString(),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout activeKey="field-updates">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <PageHeader
        title="Field Updates"
        subtitle="Record the current project stage and its completion progress."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-100 bg-white px-3 py-1.5 text-xs shadow-sm">
            <ClipboardList className="h-3.5 w-3.5 text-gray-400" />

            <span className="font-medium text-gray-700">
              Updates
            </span>

            <span className="font-semibold text-gray-500">
              {updates.length}
            </span>
          </span>
        }
      />

      {/* =====================================================
          LOADING / ERROR / CONTENT
      ====================================================== */}

      {loading ? (
        <Loader
          label="Loading field updates…"
          fullPage
          className="mt-6"
        />
      ) : error ? (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <ErrorState
            message="Unable to load field updates."
            onRetry={refetch}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-5">

          {/* =================================================
              SUMMARY KPIs
          ================================================== */}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard
              icon={ClipboardList}
              value={stats.total}
              label="Total Updates"
            />

            <SummaryCard
              icon={FolderKanban}
              value={stats.projectsCovered}
              label="Projects Covered"
            />

            <SummaryCard
              icon={CalendarClock}
              value={stats.thisWeek}
              label="Submitted This Week"
            />
          </div>

          {/* =================================================
              FILTERS
          ================================================== */}

          <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end gap-3">

              {/* Project Filter */}
              <div className="flex min-w-[170px] flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">
                  Project
                </span>

                <FilterDropdown
                  options={projects.map(
                    (p) => ({
                      value: p.id,
                      label: `${p.id} — ${p.name}`,
                    }),
                  )}
                  value={
                    filters.projectId
                  }
                  onChange={(next) =>
                    setFilters((f) => ({
                      ...f,
                      projectId: next,
                    }))
                  }
                  allLabel="All Projects"
                  className="w-full"
                />
              </div>

              {/* Stage Filter */}
              <div className="flex min-w-[150px] flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">
                  Stage
                </span>

                <FilterDropdown
                  options={PROJECT_STAGES.map(
                    (s) => ({
                      value: s,
                      label: s,
                    }),
                  )}
                  value={filters.stage}
                  onChange={(next) =>
                    setFilters((f) => ({
                      ...f,
                      stage: next,
                    }))
                  }
                  allLabel="All Stages"
                  className="w-full"
                />
              </div>

              {/* Update Type Filter */}
              <div className="flex min-w-[160px] flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">
                  Update Type
                </span>

                <FilterDropdown
                  options={FIELD_UPDATE_TYPES.map(
                    (t) => ({
                      value: t,
                      label: t,
                    }),
                  )}
                  value={
                    filters.updateType
                  }
                  onChange={(next) =>
                    setFilters((f) => ({
                      ...f,
                      updateType: next,
                    }))
                  }
                  allLabel="All Types"
                  className="w-full"
                />
              </div>

              {/* Search */}
              <SearchBar
                placeholder="Search notes, projects…"
                value={filters.search}
                onChange={(value) =>
                  setFilters((f) => ({
                    ...f,
                    search: value,
                  }))
                }
                className="w-full sm:w-56"
              />

              {/* Reset */}
              <div className="ml-auto flex items-center gap-3 pb-0.5">
                <span className="text-xs text-gray-500">
                  {filteredUpdates.length}{' '}
                  {filteredUpdates.length ===
                  1
                    ? 'update'
                    : 'updates'}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  icon={RotateCcw}
                  onClick={
                    handleResetFilters
                  }
                  disabled={
                    !hasActiveFilters
                  }
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </section>

          {/* =================================================
              SUCCESS MESSAGE
          ================================================== */}

          {lastSubmitted ? (
            <section className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">

              <div className="flex flex-wrap items-center justify-between gap-2">

                <p className="flex items-center gap-2 text-sm font-semibold text-green-700">
                  <CheckCircle2 className="h-4 w-4" />

                  Stage progress updated
                  successfully.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setLastSubmitted(null)
                  }
                  aria-label="Dismiss"
                  className="rounded-md p-1 text-green-600 transition-colors hover:bg-green-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Submitted information */}
              <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 text-xs sm:grid-cols-4">

                {/* Project */}
                <div className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-green-600/70">
                    Project
                  </dt>

                  <dd className="truncate font-semibold text-gray-700">
                    {lastSubmitted.projectId}
                    {' — '}
                    {
                      lastSubmitted.projectName
                    }
                  </dd>
                </div>

                {/* Stage */}
                <div className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-green-600/70">
                    Stage
                  </dt>

                  <dd className="truncate font-semibold text-gray-700">
                    {lastSubmitted.stage}
                  </dd>
                </div>

                {/* Progress */}
                <div className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-green-600/70">
                    Progress
                  </dt>

                  <dd className="truncate font-semibold text-gray-700">
                    {
                      lastSubmitted.progressPct
                    }
                    %
                  </dd>
                </div>

                {/* Submitted At */}
                <div className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-green-600/70">
                    Submitted At
                  </dt>

                  <dd className="truncate font-semibold text-gray-700">
                    {formatDateTimeShort(
                      lastSubmitted.submittedAt,
                    )}
                  </dd>
                </div>

              </dl>

              {/* Success actions */}
              <div className="mt-3 flex flex-wrap gap-2">

                {/* View Project */}
                <Button
                  size="sm"
                  variant="outline"
                  icon={Eye}
                  onClick={() =>
                    navigate(
                      `/project-manager/projects/${lastSubmitted.projectId}`,
                    )
                  }
                >
                  View Project
                </Button>

                {/* Edit Project */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    navigate(
                      `/project-manager/projects/${lastSubmitted.projectId}/edit`,
                    )
                  }
                >
                  Edit Project
                </Button>

                {/* View Update History */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const target =
                      document.getElementById(
                        'update-history',
                      )

                    if (target) {
                      target.scrollIntoView({
                        behavior:
                          'smooth',
                      })
                    }
                  }}
                >
                  View Update History
                </Button>

              </div>
            </section>
          ) : null}

          {/* =================================================
              FIELD UPDATE FORM
          ================================================== */}

          <FieldUpdateForm
            projects={projects}
            submitting={submitting}
            onSubmit={handleSubmit}
          />

          {/* =================================================
              UPDATES FEED
          ================================================== */}

          <section
            id="update-history"
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Updates Feed
              </h3>

              <p className="text-[11px] text-gray-400">
                Newest first · this session
              </p>
            </div>

            {filteredUpdates.length ===
            0 ? (
              <EmptyState
                icon={ClipboardList}
                title={
                  updates.length === 0
                    ? 'No Field Updates Yet'
                    : 'No Updates Match'
                }
                message={
                  updates.length === 0
                    ? 'Submit the current stage progress using the form above.'
                    : 'No field updates match the selected filters.'
                }
              />
            ) : (
              <div className="flex flex-col divide-y divide-gray-50">

                {filteredUpdates.map(
                  (update) => {
                    const project =
                      projects.find(
                        (p) =>
                          p.id ===
                          update.projectId,
                      ) || null

                    const TypeIcon =
                      getTypeIcon(
                        project
                          ? project.type
                          : '',
                      )

                    return (
                      <article
                        key={update.id}
                        className="rounded-lg px-2 py-3 transition-colors hover:bg-gray-50/60"
                      >
                        {/* =================================
                            UPDATE HEADER
                        ================================== */}

                        <div className="flex flex-wrap items-center justify-between gap-2">

                          <div className="flex min-w-0 items-center gap-2.5">

                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                              <TypeIcon className="h-4 w-4" />
                            </span>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-800">
                                {update.projectName ||
                                  update.projectId}
                              </p>

                              <p className="text-[11px] text-gray-400">
                                {
                                  update.projectId
                                }
                                {' · '}
                                {timeAgo(
                                  update.submittedAt,
                                )}
                              </p>
                            </div>

                          </div>

                          {/* Update Type */}
                          {update.updateType ? (
                            <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-semibold text-accent">
                              {
                                update.updateType
                              }
                            </span>
                          ) : null}

                          {/* Stage transition */}
                          <div className="flex items-center gap-1.5">

                            {update.previousStage ? (
                              <StatusBadge
                                status={
                                  update.previousStage
                                }
                              />
                            ) : null}

                            {update.previousStage ? (
                              <ArrowRight className="h-3 w-3 text-gray-400" />
                            ) : null}

                            <StatusBadge
                              status={
                                update.stage
                              }
                            />

                          </div>
                        </div>

                        {/* =================================
                            NOTE
                        ================================== */}

                        {update.note ? (
                          <p className="mt-2 text-xs leading-snug text-gray-600">
                            {update.note}
                          </p>
                        ) : null}

                        {/* =================================
                            UPDATE DETAILS
                        ================================== */}

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-gray-400">

                          {/* Submitted By */}
                          {update.submittedBy ? (
                            <span className="inline-flex items-center gap-1">
                              <User className="h-3 w-3" />

                              {
                                update
                                  .submittedBy
                                  .name
                              }

                              {' · '}

                              {
                                update
                                  .submittedBy
                                  .role
                              }
                            </span>
                          ) : null}

                          {/* Attachment */}
                          {update.attachment ? (
                            <span className="inline-flex items-center gap-1">

                              <Paperclip className="h-3 w-3" />

                              <span className="max-w-[180px] truncate">
                                {
                                  update
                                    .attachment
                                    .name
                                }
                              </span>

                              <span className="text-gray-300">
                                (
                                {formatBytes(
                                  update
                                    .attachment
                                    .size,
                                )}
                                )
                              </span>

                            </span>
                          ) : null}

                          {/* Location */}
                          {update.location ? (
                            <span className="inline-flex items-center gap-1">

                              <MapPin className="h-3 w-3" />

                              {update.location
                                .source ===
                              'device'
                                ? 'Current location'
                                : 'Project site'}

                              {' · '}

                              {
                                update
                                  .location
                                  .lat
                              }
                              ,
                              {
                                update
                                  .location
                                  .lng
                              }

                            </span>
                          ) : null}

                          {/* Date */}
                          <span className="inline-flex items-center gap-1">

                            <CalendarDays className="h-3 w-3" />

                            {formatDate(
                              update.submittedAt,
                            )}

                          </span>

                          {/* Submitted Badge */}
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                            Submitted
                          </span>

                          {/* =================================
                              PROJECT ACTIONS
                          ================================== */}

                          <div className="ml-auto flex items-center gap-2">

                            {/* View Project */}
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/project-manager/projects/${update.projectId}`,
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent-50"
                            >
                              <Eye className="h-3 w-3" />

                              View project
                            </button>

                            {/* Edit Project */}
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/project-manager/projects/${update.projectId}/edit`,
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent-50"
                            >
                              Edit project
                            </button>

                          </div>
                        </div>
                      </article>
                    )
                  },
                )}

              </div>
            )}
          </section>

        </div>
      )}
    </DashboardLayout>
  )
}