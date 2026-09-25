import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  XCircle,
} from 'lucide-react'

import DashboardLayout from '../../components/layout/DashboardLayout.jsx'
import PageHeader from '../../components/layout/PageHeader.jsx'
import SummaryCard from '../../components/dashboard/SummaryCard.jsx'
import FilterDropdown from '../../components/common/FilterDropdown.jsx'
import SearchBar from '../../components/common/SearchBar.jsx'
import Button from '../../components/common/Button.jsx'
import Loader from '../../components/common/Loader.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import RiskBadge from '../../components/common/RiskBadge.jsx'

import { useRecommendations } from '../../hooks/useRecommendations.js'
import { useProjects } from '../../hooks/useProjects.js'

/* =========================================================
   PRIORITIES
========================================================= */

const PRIORITIES = [
  {
    value: 'HIGH',
    label: 'High',
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
  },
  {
    value: 'LOW',
    label: 'Low',
  },
]

/* =========================================================
   RECOMMENDATION STATUSES
========================================================= */

const STATUSES = [
  {
    value: 'PENDING',
    label: 'Pending',
  },
  {
    value: 'ACCEPTED',
    label: 'Accepted',
  },
  {
    value: 'DISMISSED',
    label: 'Dismissed',
  },
  {
    value: 'COMPLETED',
    label: 'Completed',
  },
]

/* =========================================================
   FILTERS
========================================================= */

const DEFAULT_FILTERS = {
  priority: '',
  status: '',
  search: '',
}

/* =========================================================
   PRIORITY STYLE
========================================================= */

function priorityClass(priority) {
  switch (priority) {
    case 'HIGH':
      return 'bg-red-50 text-red-700 border-red-100'

    case 'MEDIUM':
      return 'bg-amber-50 text-amber-700 border-amber-100'

    case 'LOW':
      return 'bg-green-50 text-green-700 border-green-100'

    default:
      return 'bg-gray-50 text-gray-600 border-gray-100'
  }
}

/* =========================================================
   STATUS STYLE
========================================================= */

function statusClass(status) {
  switch (status) {
    case 'ACCEPTED':
      return 'bg-blue-50 text-blue-700 border-blue-200'

    case 'COMPLETED':
      return 'bg-green-50 text-green-700 border-green-200'

    case 'DISMISSED':
      return 'bg-red-50 text-red-700 border-red-200'

    case 'PENDING':
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200'
  }
}

/* =========================================================
   STATUS LABEL
========================================================= */

function getStatusLabel(status) {
  switch (status) {
    case 'PENDING':
      return 'Pending'

    case 'ACCEPTED':
      return 'Accepted'

    case 'DISMISSED':
      return 'Dismissed'

    case 'COMPLETED':
      return 'Completed'

    default:
      return status || 'Pending'
  }
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function Recommendations() {
  const navigate = useNavigate()

  const {
    recommendations,
    loading,
    error,
    refetch,
    updateStatus,
    updatingId,
    generateRecommendations,
    generating,
  } = useRecommendations()

  const {
    projects,
    loading: projectsLoading,
  } = useProjects({
    pageSize: 100,
  })

  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  const [selectedProjectId, setSelectedProjectId] =
    useState('')

  const [generateError, setGenerateError] =
    useState('')

  const [generateSuccess, setGenerateSuccess] =
    useState('')

  const [statusError, setStatusError] =
    useState('')

  /* =========================================================
     PROJECT OPTIONS

     IMPORTANT:
     Backend expects public project_id.

     Example:
     /projects/SEED-P1/recommendations/generate

     NOT:
     /projects/3/recommendations/generate
  ========================================================= */

  const projectOptions = useMemo(() => {
    return projects.map((project) => {
      const publicProjectId =
        project.project_id ||
        project.projectId ||
        project.id

      return {
        value: publicProjectId,

        label: `${publicProjectId} — ${
          project.name ||
          project.location ||
          'Project'
        }`,
      }
    })
  }, [projects])

  /* =========================================================
     ACTIVE RECOMMENDATIONS

     IMPORTANT:
     COMPLETED and DISMISSED recommendations are kept
     in the database but are hidden from the active UI.
  ========================================================= */

  const activeRecommendations = useMemo(() => {
    return recommendations.filter(
      (recommendation) =>
        recommendation.status !== 'DISMISSED' &&
        recommendation.status !== 'COMPLETED',
    )
  }, [recommendations])

  /* =========================================================
     FILTER RECOMMENDATIONS
  ========================================================= */

  const filteredRecommendations = useMemo(() => {
    const query = filters.search
      .trim()
      .toLowerCase()

    return activeRecommendations.filter(
      (recommendation) => {
        /* Priority filter */

        if (
          filters.priority &&
          recommendation.priority !==
            filters.priority
        ) {
          return false
        }

        /* Status filter */

        if (
          filters.status &&
          recommendation.status !==
            filters.status
        ) {
          return false
        }

        /* Search */

        if (query) {
          const text = [
            recommendation.title,
            recommendation.recommendation,
            recommendation.type,
            recommendation.projectId,
            recommendation.project?.id,
            recommendation.project?.name,
            recommendation.project?.district,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          if (!text.includes(query)) {
            return false
          }
        }

        return true
      },
    )
  }, [
    activeRecommendations,
    filters,
  ])

  /* =========================================================
     STATISTICS

     Statistics are calculated from ALL recommendations,
     including completed/dismissed records.
  ========================================================= */

  const stats = useMemo(() => {
    return {
      total: recommendations.length,

      pending: recommendations.filter(
        (recommendation) =>
          recommendation.status === 'PENDING',
      ).length,

      accepted: recommendations.filter(
        (recommendation) =>
          recommendation.status === 'ACCEPTED',
      ).length,

      highPriority: recommendations.filter(
        (recommendation) =>
          recommendation.priority === 'HIGH',
      ).length,

      completed: recommendations.filter(
        (recommendation) =>
          recommendation.status === 'COMPLETED',
      ).length,

      dismissed: recommendations.filter(
        (recommendation) =>
          recommendation.status === 'DISMISSED',
      ).length,
    }
  }, [recommendations])

  /* =========================================================
     FILTER STATE
  ========================================================= */

  const hasFilters = Boolean(
    filters.priority ||
      filters.status ||
      filters.search,
  )

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  /* =========================================================
     SELECTED PROJECT
  ========================================================= */

  const selectedProject = useMemo(() => {
    if (!selectedProjectId) {
      return null
    }

    return (
      projects.find(
        (project) =>
          String(
            project.project_id ||
              project.projectId ||
              project.id,
          ) === String(selectedProjectId),
      ) || null
    )
  }, [
    projects,
    selectedProjectId,
  ])

  /* =========================================================
     GENERATE AI RECOMMENDATIONS
  ========================================================= */

  const handleGenerate = async () => {
    setGenerateError('')
    setGenerateSuccess('')

    if (!selectedProject) {
      setGenerateError(
        'Please select a project first.',
      )

      return
    }

    const publicProjectId =
      selectedProject.project_id ||
      selectedProject.projectId

    if (!publicProjectId) {
      setGenerateError(
        'Unable to find the project_id for this project.',
      )

      return
    }

    try {
      console.log(
        'Generating recommendations for project_id:',
        publicProjectId,
      )

      await generateRecommendations(
        publicProjectId,
      )

      setGenerateSuccess(
        `AI recommendations generated successfully for ${publicProjectId}.`,
      )

      await refetch()
    } catch (err) {
      console.error(
        'Failed to generate recommendations:',
        err,
      )

      setGenerateError(
        err?.message ||
          'Failed to generate AI recommendations. Please try again.',
      )
    }
  }

  /* =========================================================
     CHANGE RECOMMENDATION STATUS
  ========================================================= */

  const handleStatusChange = async (
    recommendationId,
    status,
  ) => {
    setStatusError('')

    try {
      await updateStatus(
        recommendationId,
        status,
      )

      /*
       * React Query invalidates the recommendations query
       * after updateStatus succeeds.
       *
       * Because activeRecommendations filters out
       * COMPLETED and DISMISSED, those cards disappear
       * automatically.
       */
    } catch (err) {
      console.error(
        'Failed to update recommendation status:',
        err,
      )

      setStatusError(
        err?.message ||
          'Failed to update recommendation status.',
      )
    }
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <DashboardLayout activeKey="recommendations">
      <PageHeader
        title="AI Recommendations"
        subtitle="Generate and manage AI-powered recommendations for project risks."
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-100 bg-white px-3 py-1.5 text-xs shadow-sm">
              <BrainCircuit className="h-3.5 w-3.5 text-accent" />

              <span className="font-medium text-gray-700">
                Active Recommendations
              </span>

              <span className="font-semibold text-gray-500">
                {activeRecommendations.length}
              </span>
            </span>

            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => refetch()}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* =====================================================
          KPI CARDS
      ===================================================== */}

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={BrainCircuit}
          value={activeRecommendations.length}
          label="Active Recommendations"
        />

        <SummaryCard
          icon={Clock3}
          value={stats.pending}
          label="Pending"
        />

        <SummaryCard
          icon={AlertCircle}
          value={stats.highPriority}
          label="High Priority"
          accent="text-red-600"
          bg="bg-red-50"
        />

        <SummaryCard
          icon={CheckCircle2}
          value={stats.accepted}
          label="Accepted"
          accent="text-blue-600"
          bg="bg-blue-50"
        />
      </div>

      {/* =====================================================
          GENERATE AI RECOMMENDATIONS
      ===================================================== */}

      <section className="mb-5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-50 text-accent">
                <Sparkles className="h-4 w-4" />
              </span>

              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  Generate AI Recommendations
                </h3>

                <p className="text-[11px] text-gray-400">
                  Gemini will analyze the project's risk,
                  prediction and recent status history.
                </p>
              </div>
            </div>
          </div>

          <span className="rounded-full bg-accent-50 px-2.5 py-1 text-[10px] font-semibold text-accent">
            Gemini AI
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Select Project
            </label>

            {projectsLoading ? (
              <div className="flex h-10 items-center rounded-lg border border-gray-200 px-3 text-xs text-gray-400">
                Loading projects...
              </div>
            ) : (
              <FilterDropdown
                options={projectOptions}
                value={selectedProjectId}
                onChange={(value) => {
                  setSelectedProjectId(value)
                  setGenerateError('')
                  setGenerateSuccess('')
                }}
                allLabel="Select a project"
                className="w-full"
              />
            )}
          </div>

          <Button
            type="button"
            icon={
              generating
                ? Loader2
                : Sparkles
            }
            disabled={
              generating ||
              projectsLoading ||
              !selectedProjectId
            }
            onClick={handleGenerate}
          >
            {generating
              ? 'Generating...'
              : 'Generate AI Recommendations'}
          </Button>
        </div>

        {/* Selected project */}

        {selectedProject ? (
          <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Project ID
                </p>

                <p className="mt-0.5 text-xs font-semibold text-gray-700">
                  {selectedProject.project_id ||
                    selectedProject.projectId}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Project
                </p>

                <p className="mt-0.5 truncate text-xs font-semibold text-gray-700">
                  {selectedProject.name ||
                    selectedProject.location ||
                    'Project'}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  District
                </p>

                <p className="mt-0.5 text-xs font-semibold text-gray-700">
                  {selectedProject.district ||
                    '—'}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Stage
                </p>

                <p className="mt-0.5 text-xs font-semibold text-gray-700">
                  {selectedProject.current_stage ||
                    selectedProject.stage ||
                    '—'}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Success */}

        {generateSuccess ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

            <div className="flex-1">
              <p className="font-semibold">
                Success
              </p>

              <p className="mt-0.5">
                {generateSuccess}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setGenerateSuccess('')
              }
              className="text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        ) : null}

        {/* Generate error */}

        {generateError ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <div className="flex-1">
              <p className="font-semibold">
                Unable to generate recommendations
              </p>

              <p className="mt-0.5">
                {generateError}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setGenerateError('')
              }
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        ) : null}
      </section>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <section className="mb-5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />

          <h3 className="text-sm font-semibold text-gray-700">
            Filter Recommendations
          </h3>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          {/* Priority */}

          <div className="flex min-w-[160px] flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">
              Priority
            </span>

            <FilterDropdown
              options={PRIORITIES}
              value={filters.priority}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  priority: value,
                }))
              }
              allLabel="All Priorities"
              className="w-full"
            />
          </div>

          {/* Status */}

          <div className="flex min-w-[160px] flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">
              Status
            </span>

            <FilterDropdown
              options={STATUSES}
              value={filters.status}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  status: value,
                }))
              }
              allLabel="All Active Statuses"
              className="w-full"
            />
          </div>

          {/* Search */}

          <SearchBar
            placeholder="Search recommendations..."
            value={filters.search}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                search: value,
              }))
            }
            className="w-full lg:w-72"
          />

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {filteredRecommendations.length}{' '}
              {filteredRecommendations.length === 1
                ? 'recommendation'
                : 'recommendations'}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              disabled={!hasFilters}
            >
              Reset
            </Button>
          </div>
        </div>
      </section>

      {/* =====================================================
          STATUS UPDATE ERROR
      ===================================================== */}

      {statusError ? (
        <section className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <div className="flex items-center justify-between gap-3">
            <span>
              {statusError}
            </span>

            <button
              type="button"
              onClick={() =>
                setStatusError('')
              }
              className="font-semibold"
            >
              ×
            </button>
          </div>
        </section>
      ) : null}

      {/* =====================================================
          API ERROR
      ===================================================== */}

      {error ? (
        <section className="mb-5 rounded-xl border border-red-100 bg-white shadow-sm">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="mb-2 h-7 w-7 text-red-500" />

            <h3 className="text-sm font-semibold text-gray-800">
              Unable to load recommendations
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Something went wrong while loading the
              recommendation list.
            </p>

            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => refetch()}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </section>
      ) : null}

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (
        <Loader
          label="Loading recommendations..."
          fullPage
          className="mt-6"
        />
      ) : filteredRecommendations.length ===
        0 ? (
        <section className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
          <EmptyState
            icon={BrainCircuit}
            title={
              activeRecommendations.length === 0
                ? 'No Active AI Recommendations'
                : 'No Recommendations Match'
            }
            message={
              activeRecommendations.length === 0
                ? 'Select a project above and generate AI recommendations using Gemini.'
                : 'Try changing the selected filters.'
            }
          />
        </section>
      ) : (
        /* =====================================================
           RECOMMENDATION LIST
        ===================================================== */

        <div className="flex flex-col gap-4">
          {filteredRecommendations.map(
            (recommendation) => {
              const project =
                recommendation.project

              return (
                <article
                  key={recommendation.id}
                  className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  {/* =================================================
                     HEADER
                  ================================================= */}

                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent">
                        <BrainCircuit className="h-5 w-5" />
                      </span>

                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-800">
                          {recommendation.title ||
                            recommendation.recommendation}
                        </h3>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-gray-400">
                          <span>
                            {project?.id ||
                              recommendation.projectId}
                          </span>

                          <span>•</span>

                          <span>
                            {project?.name ||
                              'Project'}
                          </span>

                          {project?.district ? (
                            <>
                              <span>•</span>

                              <span>
                                {project.district}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Priority + Current Status */}

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${priorityClass(
                          recommendation.priority,
                        )}`}
                      >
                        {recommendation.priority}
                      </span>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClass(
                          recommendation.status,
                        )}`}
                      >
                        {getStatusLabel(
                          recommendation.status,
                        )}
                      </span>
                    </div>
                  </div>

                  {/* =================================================
                     RECOMMENDATION
                  ================================================= */}

                  <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="mb-1 flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-accent" />

                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        Recommended Action
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-gray-700">
                      {recommendation.recommendation}
                    </p>
                  </div>

                  {/* =================================================
                     RISK INFORMATION
                  ================================================= */}

                  {recommendation.risk ? (
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border border-gray-100 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                          Risk Level
                        </p>

                        <div className="mt-1">
                          <RiskBadge
                            level={
                              recommendation.risk
                                .riskLevel
                            }
                          />
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-100 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                          Delay Probability
                        </p>

                        <p className="mt-1 text-sm font-bold text-gray-800">
                          {
                            recommendation.risk
                              .delayProbability
                          }
                          %
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-100 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                          Top Risk Factor
                        </p>

                        <p className="mt-1 truncate text-xs font-semibold text-gray-700">
                          {
                            recommendation.risk
                              .topFactor
                          }
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {/* =================================================
                     ACTIONS / STATUS CONTROL
                  ================================================= */}

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                    {/* View project */}

                    {project?.id ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/project-manager/projects/${project.id}`,
                          )
                        }
                        icon={ArrowRight}
                      >
                        View Project
                      </Button>
                    ) : null}

                    {/* =================================================
                       STATUS SELECTOR
                       
                       PM can choose:
                       PENDING
                       ACCEPTED
                       DISMISSED
                       COMPLETED
                    ================================================= */}

                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={`status-${recommendation.id}`}
                        className="text-[11px] font-medium text-gray-500"
                      >
                        Status:
                      </label>

                      <select
                        id={`status-${recommendation.id}`}
                        value={
                          recommendation.status ||
                          'PENDING'
                        }
                        disabled={
                          updatingId ===
                          recommendation.id
                        }
                        onChange={(event) =>
                          handleStatusChange(
                            recommendation.id,
                            event.target.value,
                          )
                        }
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-accent/20 ${statusClass(
                          recommendation.status,
                        )} ${
                          updatingId ===
                          recommendation.id
                            ? 'cursor-not-allowed opacity-60'
                            : 'cursor-pointer'
                        }`}
                      >
                        {STATUSES.map(
                          (status) => (
                            <option
                              key={
                                status.value
                              }
                              value={
                                status.value
                              }
                            >
                              {status.label}
                            </option>
                          ),
                        )}
                      </select>

                      {updatingId ===
                      recommendation.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                      ) : null}
                    </div>

                    {/* Status explanation */}

                    <span className="ml-auto text-[10px] text-gray-400">
                      {recommendation.status ===
                      'PENDING'
                        ? 'Awaiting PM action'
                        : recommendation.status ===
                          'ACCEPTED'
                          ? 'Action accepted by PM'
                          : ''}
                    </span>

                    {/* AI label */}

                    <span className="inline-flex items-center gap-1.5 text-[10px] text-gray-400">
                      <FileText className="h-3 w-3" />
                      AI generated recommendation
                    </span>
                  </div>
                </article>
              )
            },
          )}
        </div>
      )}
    </DashboardLayout>
  )
}