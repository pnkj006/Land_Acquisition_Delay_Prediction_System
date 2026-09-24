import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  Eye,
  RefreshCw,
  Sparkles,
} from 'lucide-react'

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

/* -------------------------------------------------------------------------- */
/* STATUS / PRIORITY STYLES                                                   */
/* -------------------------------------------------------------------------- */
function normalizeEnum(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
}
const PRIORITY_BADGES = {
  [PRIORITY_LEVELS.HIGH]:
    'bg-red-100 text-red-700 border border-red-200',

  [PRIORITY_LEVELS.MEDIUM]:
    'bg-amber-100 text-amber-700 border border-amber-200',

  [PRIORITY_LEVELS.LOW]:
    'bg-green-100 text-green-700 border border-green-200',
}

const STATUS_CHIPS = {
  [RECOMMENDATION_STATUSES.PENDING]:
    'bg-gray-100 text-gray-600',

  [RECOMMENDATION_STATUSES.ACCEPTED]:
    'bg-blue-50 text-blue-700',

  [RECOMMENDATION_STATUSES.COMPLETED]:
    'bg-green-100 text-green-800',

  [RECOMMENDATION_STATUSES.DISMISSED]:
    'bg-gray-100 text-gray-500',
}

const STATUS_DOT = {
  [RECOMMENDATION_STATUSES.PENDING]:
    'bg-gray-400',

  [RECOMMENDATION_STATUSES.ACCEPTED]:
    'bg-blue-500',

  [RECOMMENDATION_STATUSES.COMPLETED]:
    'bg-green-600',

  [RECOMMENDATION_STATUSES.DISMISSED]:
    'bg-gray-400',
}

const PRIORITY_RANK = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
}

const EMPTY_FILTERS = {
  search: '',
  project: 'all',
  priority: 'all',
  status: 'all',
}

/* -------------------------------------------------------------------------- */
/* SMALL UI COMPONENTS                                                        */
/* -------------------------------------------------------------------------- */

function PriorityBadge({ priority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        PRIORITY_BADGES[priority] ||
        PRIORITY_BADGES[PRIORITY_LEVELS.MEDIUM]
      }`}
    >
      {priority || PRIORITY_LEVELS.MEDIUM} Priority
    </span>
  )
}

function StatusChip({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        STATUS_CHIPS[status] ||
        STATUS_CHIPS[RECOMMENDATION_STATUSES.PENDING]
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          STATUS_DOT[status] ||
          STATUS_DOT[RECOMMENDATION_STATUSES.PENDING]
        }`}
        aria-hidden="true"
      />

      {status}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* FILTERING                                                                  */
/* -------------------------------------------------------------------------- */
function applyFilters(recommendations, filters) {
  const q = filters.search.trim().toLowerCase()

  const selectedPriority =
    filters.priority !== 'all'
      ? normalizeEnum(filters.priority)
      : null

  const selectedStatus =
    filters.status !== 'all'
      ? normalizeEnum(filters.status)
      : null

  return recommendations
    .filter((rec) => {
      // Project filter
      if (filters.project !== 'all') {
        if (
          String(rec.projectId) !==
          String(filters.project)
        ) {
          return false
        }
      }

      // Priority filter
      if (selectedPriority) {
        const recommendationPriority =
          normalizeEnum(rec.priority)

        if (
          recommendationPriority !==
          selectedPriority
        ) {
          return false
        }
      }

      // Status filter
      if (selectedStatus) {
        const recommendationStatus =
          normalizeEnum(rec.status)

        if (
          recommendationStatus !==
          selectedStatus
        ) {
          return false
        }
      }

      // Search filter
      if (q) {
        const haystack = [
          rec.project?.id,
          rec.project?.name,
          rec.project?.location,
          rec.project?.district,
          rec.project?.type,
          rec.project?.stage,
          rec.recommendation,
          rec.title,
          rec.type,
          rec.priority,
          rec.status,
        ]

        const matchesSearch = haystack.some(
          (value) =>
            String(value ?? '')
              .toLowerCase()
              .includes(q),
        )

        if (!matchesSearch) {
          return false
        }
      }

      return true
    })
    .sort(
      (a, b) =>
        (PRIORITY_RANK[
          normalizeEnum(a.priority)
        ] ?? 9) -
          (PRIORITY_RANK[
            normalizeEnum(b.priority)
          ] ?? 9) ||
        String(a.projectId).localeCompare(
          String(b.projectId),
        ),
    )
}
/* -------------------------------------------------------------------------- */
/* GROUPING                                                                    */
/* -------------------------------------------------------------------------- */

function groupRecommendationsByProject(
  recommendations,
) {
  const grouped = new Map()

  recommendations.forEach((rec) => {
    const projectId =
      rec.projectId ?? rec.project?.id

    if (!projectId) {
      return
    }

    if (!grouped.has(projectId)) {
      grouped.set(projectId, {
        projectId,
        project: rec.project || null,
        recommendations: [],
      })
    }

    grouped
      .get(projectId)
      .recommendations.push(rec)
  })

  return Array.from(grouped.values())
}

function getHighestPriority(recommendations) {
  return (
    recommendations
      .map((rec) => rec.priority)
      .sort(
        (a, b) =>
          (PRIORITY_RANK[a] ?? 9) -
          (PRIORITY_RANK[b] ?? 9),
      )[0] || PRIORITY_LEVELS.MEDIUM
  )
}

/* -------------------------------------------------------------------------- */
/* CURRENT ML RISK                                                             */
/* -------------------------------------------------------------------------- */

function getCurrentRisk(recommendations) {
  for (const rec of recommendations) {
    if (rec?.risk?.riskScore != null) {
      return rec.risk.riskScore
    }
  }

  return null
}

/* -------------------------------------------------------------------------- */
/* RECOMMENDATION CARD                                                         */
/* -------------------------------------------------------------------------- */

function RecommendationCard({
  project,
  projectId,
  recommendations,
  onViewProject,
  onStatusChange,
  updatingId,
}) {
  const highestPriority =
    getHighestPriority(recommendations)

  const currentRisk =
    getCurrentRisk(recommendations)

  const projectName =
    project?.name ||
    project?.location ||
    'Project'

  const projectType =
    project?.type ||
    'Project'

  const activeRecommendations =
    recommendations.filter(
      (rec) =>
        rec.status !==
          RECOMMENDATION_STATUSES.COMPLETED &&
        rec.status !==
          RECOMMENDATION_STATUSES.DISMISSED,
    )

  const projectIsActive =
    activeRecommendations.length > 0

  return (
    <article
      className={`rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        highestPriority === PRIORITY_LEVELS.HIGH &&
        projectIsActive
          ? 'border-red-100'
          : 'border-gray-100'
      }`}
    >
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge
            priority={highestPriority}
          />

          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {recommendations.length}{' '}
            {recommendations.length === 1
              ? 'Recommendation'
              : 'Recommendations'}
          </span>
        </div>

        <span className="text-[10px] text-gray-400">
          Project ID: {projectId}
        </span>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* PROJECT INFORMATION                                                */}
      {/* ------------------------------------------------------------------ */}

      <div className="mt-3">
        <h3 className="text-base font-bold text-gray-800">
          {projectName}
        </h3>

        <p className="mt-0.5 text-[11px] text-gray-500">
          {projectType}
          {project?.district
            ? ` · ${project.district}`
            : ''}
        </p>

        <p className="mt-0.5 text-[10px] text-gray-400">
          Project ID: {projectId}
        </p>

        {project?.stage ? (
          <p className="mt-0.5 text-[10px] text-gray-400">
            Current stage: {project.stage}
          </p>
        ) : null}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CURRENT ML RISK                                                     */}
      {/* ------------------------------------------------------------------ */}

      {currentRisk != null ? (
        <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Current Risk
          </p>

          <p className="mt-0.5 text-xs text-gray-700">
            Risk score:{' '}
            <span className="font-semibold">
              {currentRisk}
            </span>
          </p>
        </div>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* RECOMMENDATIONS                                                     */}
      {/* ------------------------------------------------------------------ */}

      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          Recommended Actions
        </p>

        <div className="mt-2 space-y-2">
          {recommendations.map((rec) => {
            const isCompleted =
              rec.status ===
              RECOMMENDATION_STATUSES.COMPLETED

            const isDismissed =
              rec.status ===
              RECOMMENDATION_STATUSES.DISMISSED

            const isUpdating =
              updatingId === rec.id

            return (
              <div
                key={rec.id}
                className={`rounded-lg border p-3 ${
                  isCompleted || isDismissed
                    ? 'border-gray-100 bg-gray-50'
                    : 'border-gray-100 bg-primary-50'
                }`}
              >
                {/* Recommendation text */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <Check
                      className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                        isCompleted || isDismissed
                          ? 'text-gray-300'
                          : 'text-primary'
                      }`}
                      aria-hidden="true"
                    />

                    <p
                      className={`text-xs leading-relaxed ${
                        isCompleted || isDismissed
                          ? 'text-gray-400'
                          : 'text-gray-700'
                      }`}
                    >
                      {rec.recommendation ||
                        rec.title ||
                        'Recommendation'}
                    </p>
                  </div>

                  <PriorityBadge
                    priority={rec.priority}
                  />
                </div>

                {/* -------------------------------------------------------- */}
                {/* STATUS + STATUS UPDATE                                   */}
                {/* -------------------------------------------------------- */}

                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <StatusChip status={rec.status} />

                    {isUpdating ? (
                      <span className="text-[10px] text-gray-400">
                        Updating...
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-medium text-gray-500">
                      Update status
                    </label>

                    <Select
                      value={rec.status}
                      onChange={(e) =>
                        onStatusChange(
                          rec.id,
                          e.target.value,
                        )
                      }
                      disabled={isUpdating}
                      options={[
                        {
                          value:
                            RECOMMENDATION_STATUSES.PENDING,
                          label: 'Pending',
                        },
                        {
                          value:
                            RECOMMENDATION_STATUSES.ACCEPTED,
                          label: 'Accepted',
                        },
                        {
                          value:
                            RECOMMENDATION_STATUSES.DISMISSED,
                          label: 'Dismissed',
                        },
                        {
                          value:
                            RECOMMENDATION_STATUSES.COMPLETED,
                          label: 'Completed',
                        },
                      ]}
                    />
                  </div>
                </div>

                {/* Generated date */}
                {rec.created_at ? (
                  <p className="mt-2 text-[9px] text-gray-400">
                    Generated{' '}
                    {formatDateTimeShort(
                      rec.created_at,
                    )}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* VIEW PROJECT                                                        */}
      {/* ------------------------------------------------------------------ */}

      <div className="mt-3 flex items-center border-t border-gray-50 pt-3">
        <Button
          variant="outline"
          size="sm"
          icon={Eye}
          onClick={() =>
            onViewProject(projectId)
          }
        >
          View Project
        </Button>
      </div>
    </article>
  )
}

/* -------------------------------------------------------------------------- */
/* MAIN PAGE                                                                  */
/* -------------------------------------------------------------------------- */

export default function Recommendations() {
  const navigate = useNavigate()

  const {
    recommendations,
    loading,
    error,
    refetch,
    updateStatus,
    updatingId,
    lastUpdated,
    generateRecommendations,
    generating,
  } = useRecommendations()

  const [filters, setFilters] =
    useState(EMPTY_FILTERS)

  const [actionError, setActionError] =
    useState(null)

  const [generationError, setGenerationError] =
    useState(null)

  const [selectedProjectId, setSelectedProjectId] =
    useState('')

  /* ---------------------------------------------------------------------- */
  /* GENERATE                                                               */
  /* ---------------------------------------------------------------------- */

  const handleGenerate = async () => {
    if (!selectedProjectId) {
      setGenerationError(
        'Please select a project first.',
      )
      return
    }

    try {
      setGenerationError(null)

      await generateRecommendations(
        selectedProjectId,
      )

      await refetch()

      setSelectedProjectId('')
    } catch (error) {
      console.error(
        'Failed to generate recommendations:',
        error,
      )

      setGenerationError(
        'Unable to generate AI recommendations.',
      )
    }
  }

  /* ---------------------------------------------------------------------- */
  /* FILTERED DATA                                                          */
  /* ---------------------------------------------------------------------- */

  const filtered = useMemo(
    () =>
      applyFilters(
        recommendations,
        filters,
      ),
    [recommendations, filters],
  )

  const groupedRecommendations = useMemo(
    () =>
      groupRecommendationsByProject(
        filtered,
      ),
    [filtered],
  )

  /* ---------------------------------------------------------------------- */
  /* SUMMARY                                                                */
  /* ---------------------------------------------------------------------- */

  const summary = useMemo(
    () => ({
      total: recommendations.length,

      high: recommendations.filter(
        (r) =>
          r.priority ===
          PRIORITY_LEVELS.HIGH,
      ).length,

      pending: recommendations.filter(
        (r) =>
          r.status ===
          RECOMMENDATION_STATUSES.PENDING,
      ).length,

      accepted: recommendations.filter(
        (r) =>
          r.status ===
          RECOMMENDATION_STATUSES.ACCEPTED,
      ).length,

      completed: recommendations.filter(
        (r) =>
          r.status ===
          RECOMMENDATION_STATUSES.COMPLETED,
      ).length,

      dismissed: recommendations.filter(
        (r) =>
          r.status ===
          RECOMMENDATION_STATUSES.DISMISSED,
      ).length,
    }),
    [recommendations],
  )

  /* ---------------------------------------------------------------------- */
  /* IMMEDIATE ATTENTION                                                    */
  /* ---------------------------------------------------------------------- */

  const attention = useMemo(() => {
    const highPriorityActive =
      recommendations.filter(
        (r) =>
          r.priority ===
            PRIORITY_LEVELS.HIGH &&
          r.status !==
            RECOMMENDATION_STATUSES.COMPLETED &&
          r.status !==
            RECOMMENDATION_STATUSES.DISMISSED,
      )

    return groupRecommendationsByProject(
      highPriorityActive,
    ).slice(0, 3)
  }, [recommendations])

  /* ---------------------------------------------------------------------- */
  /* PROJECT OPTIONS                                                        */
  /* ---------------------------------------------------------------------- */

  const projectOptions = useMemo(() => {
    const projects = new Map()

    recommendations.forEach((rec) => {
      const projectId =
        rec.projectId ??
        rec.project?.id

      if (!projectId) {
        return
      }

      if (!projects.has(String(projectId))) {
        projects.set(String(projectId), {
          id: String(projectId),
          project: rec.project || null,
        })
      }
    })

    return Array.from(projects.values())
      .sort((a, b) =>
        a.id.localeCompare(b.id),
      )
      .map(({ id, project }) => ({
        value: id,
        label: `${
          project?.name ||
          project?.location ||
          'Project'
        } — ${id}`,
      }))
  }, [recommendations])

  /* ---------------------------------------------------------------------- */
  /* FILTER COUNT                                                           */
  /* ---------------------------------------------------------------------- */

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    [
      filters.project,
      filters.priority,
      filters.status,
    ].filter(
      (value) => value !== 'all',
    ).length

  /* ---------------------------------------------------------------------- */
  /* STATUS UPDATE                                                          */
  /* ---------------------------------------------------------------------- */

  const handleStatusChange = async (
    recId,
    status,
  ) => {
    setActionError(null)

    try {
      await updateStatus(recId, status)

      /*
       * Reload data after successful update
       * so the UI always reflects the database.
       */
      await refetch()
    } catch (error) {
      console.error(
        'Failed to update recommendation:',
        error,
      )

      setActionError(
        'Unable to update recommendation. Please retry.',
      )
    }
  }

  /* ---------------------------------------------------------------------- */
  /* VIEW PROJECT                                                           */
  /* ---------------------------------------------------------------------- */

  const viewProject = (projectId) => {
    navigate(
      `/project-manager/projects/${projectId}`,
    )
  }

  /* ---------------------------------------------------------------------- */
  /* RENDER                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <DashboardLayout activeKey="recommendations">
      <PageHeader
        title="AI Recommendations"
        subtitle="Project-specific corrective actions generated from the latest risk prediction."
        actions={
          <>
            {lastUpdated ? (
              <span className="hidden text-[11px] text-gray-400 lg:inline">
                Last Updated{' '}
                {formatDateTimeShort(
                  lastUpdated,
                )}
              </span>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={refetch}
            >
              Refresh
            </Button>
          </>
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* GENERATE RECOMMENDATIONS                                           */}
      {/* ------------------------------------------------------------------ */}

      <section className="mb-5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">
              Generate recommendations for a project
            </label>

            <Select
              value={selectedProjectId}
              onChange={(e) =>
                setSelectedProjectId(
                  e.target.value,
                )
              }
              options={[
                {
                  value: '',
                  label: 'Select a project',
                },
                ...projectOptions,
              ]}
            />
          </div>

          <Button
            icon={Sparkles}
            onClick={handleGenerate}
            disabled={
              !selectedProjectId ||
              generating
            }
          >
            {generating
              ? 'Generating…'
              : 'Generate AI Recommendations'}
          </Button>
        </div>

        <p className="mt-2 text-[10px] text-gray-400">
          Gemini analyzes the selected project
          and returns multiple corrective
          recommendations.
        </p>

        {generationError ? (
          <p className="mt-2 text-[11px] text-red-600">
            {generationError}
          </p>
        ) : null}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* LOADING / ERROR / CONTENT                                          */}
      {/* ------------------------------------------------------------------ */}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader label="Loading recommendations…" />
        </div>
      ) : error ? (
        <ErrorState
          message="Unable to load recommendations."
          onRetry={refetch}
        />
      ) : recommendations.length === 0 ? (
        <EmptyState
          title="No recommendations available."
          message="Generate recommendations for a project when corrective action is required."
        />
      ) : (
        <div className="flex flex-col gap-5">
          {/* ---------------------------------------------------------------- */}
          {/* SUMMARY                                                          */}
          {/* ---------------------------------------------------------------- */}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <SummaryCard
              label="Total"
              value={summary.total}
              tone="text-primary"
              bg="bg-primary-50"
            />

            <SummaryCard
              label="High Priority"
              value={summary.high}
              tone="text-red-600"
              bg="bg-red-50"
            />

            <SummaryCard
              label="Pending"
              value={summary.pending}
              tone="text-gray-600"
              bg="bg-gray-50"
            />

            <SummaryCard
              label="Accepted"
              value={summary.accepted}
              tone="text-blue-600"
              bg="bg-blue-50"
            />

            <SummaryCard
              label="Completed"
              value={summary.completed}
              tone="text-green-600"
              bg="bg-green-50"
            />
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* FILTERS                                                          */}
          {/* ---------------------------------------------------------------- */}

          <section className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <SearchBar
                placeholder="Search projects or recommendations…"
                value={filters.search}
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    search: value,
                  }))
                }
                className="lg:col-span-2"
              />

              <Select
                label="Project"
                value={filters.project}
                onChange={(e) =>
                  setFilters((current) => ({
                    ...current,
                    project:
                      e.target.value,
                  }))
                }
                options={[
                  {
                    value: 'all',
                    label: 'All Projects',
                  },
                  ...projectOptions,
                ]}
              />

              <Select
                label="Priority"
                value={filters.priority}
                onChange={(e) =>
                  setFilters((current) => ({
                    ...current,
                    priority:
                      e.target.value,
                  }))
                }
                options={[
                  {
                    value: 'all',
                    label: 'All Priorities',
                  },
                  ...Object.values(
                    PRIORITY_LEVELS,
                  ).map((value) => ({
                    value,
                    label: value,
                  })),
                ]}
              />

              <Select
                label="Status"
                value={filters.status}
                onChange={(e) =>
                  setFilters((current) => ({
                    ...current,
                    status:
                      e.target.value,
                  }))
                }
                options={[
                  {
                    value: 'all',
                    label: 'All Status',
                  },
                  ...Object.values(
                    RECOMMENDATION_STATUSES,
                  ).map((value) => ({
                    value,
                    label: value,
                  })),
                ]}
              />
            </div>

            <div className="mt-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters({
                    ...EMPTY_FILTERS,
                  })
                }
                disabled={
                  activeFilterCount === 0
                }
              >
                Reset Filters
                {activeFilterCount > 0
                  ? ` (${activeFilterCount})`
                  : ''}
              </Button>
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* IMMEDIATE ATTENTION                                              */}
          {/* ---------------------------------------------------------------- */}

          {attention.length > 0 ? (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Needs Immediate Attention
              </h2>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {attention.map((group) => (
                  <RecommendationCard
                    key={group.projectId}
                    project={group.project}
                    projectId={
                      group.projectId
                    }
                    recommendations={
                      group.recommendations
                    }
                    updatingId={updatingId}
                    onViewProject={
                      viewProject
                    }
                    onStatusChange={
                      handleStatusChange
                    }
                  />
                ))}
              </div>
            </section>
          ) : null}

          {/* ---------------------------------------------------------------- */}
          {/* ALL PROJECTS                                                     */}
          {/* ---------------------------------------------------------------- */}

          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
              All Projects (
              {groupedRecommendations.length})
            </h2>

            {groupedRecommendations.length ===
            0 ? (
              <EmptyState
                title="No recommendations match the selected filters."
                message="Adjust the filters above or reset them to see all recommendations."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {groupedRecommendations.map(
                  (group) => (
                    <RecommendationCard
                      key={group.projectId}
                      project={group.project}
                      projectId={
                        group.projectId
                      }
                      recommendations={
                        group.recommendations
                      }
                      updatingId={updatingId}
                      onViewProject={
                        viewProject
                      }
                      onStatusChange={
                        handleStatusChange
                      }
                    />
                  ),
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ACTION ERROR                                                        */}
      {/* ------------------------------------------------------------------ */}

      {actionError ? (
        <p className="mt-3 text-[11px] text-red-600">
          {actionError}

          <button
            type="button"
            onClick={() =>
              setActionError(null)
            }
            className="ml-2 underline"
          >
            Dismiss
          </button>
        </p>
      ) : null}
    </DashboardLayout>
  )
}