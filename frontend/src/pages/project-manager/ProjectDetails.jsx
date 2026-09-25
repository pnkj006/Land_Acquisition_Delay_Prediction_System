import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ExternalLink,
  FileText,
  FolderKanban,
  ListTodo,
  MapPin,
  RefreshCw,
  Percent,
  Sparkles,
  Clock,
  Check,
  X,
} from 'lucide-react'

import DashboardLayout from '../../components/layout/DashboardLayout.jsx'
import SummaryCard from '../../components/dashboard/SummaryCard.jsx'
import RecentAlerts from '../../components/dashboard/RecentAlerts.jsx'
import RiskMap from '../../components/map/RiskMap.jsx'
import ProjectTable from '../../components/projects/ProjectTable.jsx'
import ProjectInfo from '../../components/projects/ProjectInfo.jsx'
import RiskGauge from '../../components/projects/RiskGauge.jsx'
import RiskFactors from '../../components/projects/RiskFactors.jsx'
import ProjectProgress from '../../components/projects/ProjectProgress.jsx'
import RiskBadge from '../../components/common/RiskBadge.jsx'
import Loader from '../../components/common/Loader.jsx'

import { useAuth } from '../../context/AuthContext.jsx'
import { useDashboard } from '../../hooks/useDashboard.js'
import { useProjects } from '../../hooks/useProjects.js'
import { useRisk } from '../../hooks/useRisk.js'

import {
  getRecommendations,
  generateRecommendations,
  updateRecommendationStatus,
} from '../../api/recommendations.api'

import { getStageProgress } from '../../api/projects.api'

import { getTypeIcon } from '../../utils/typeIcons'
import {
  formatDateTimeShort,
  formatRiskScore,
} from '../../utils/formatters'

const TABS = [
  'Overview',
  'Risk Analysis',
  'Explanation (XAI)',
  'Recommendations',
  'Progress',
  'Documents',
]

const RECOMMENDATION_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'DISMISSED',
  'COMPLETED',
]

export default function ProjectManagerDashboard() {
  const { user } = useAuth()

  const districtText = user?.district || 'All Districts'

  const navigate = useNavigate()

  // ---------------------------------------------------------
  // Dashboard data
  // ---------------------------------------------------------

  const {
    summary,
    loading: summaryLoading,
  } = useDashboard()

  const {
    projects,
    pagination,
    loading: projectsLoading,
    error: projectsError,
    filters,
    setFilters,
    refetch,
  } = useProjects({
    pageSize: 5,
  })

  // ---------------------------------------------------------
  // Selected project
  // ---------------------------------------------------------

  const [selectedId, setSelectedId] = useState(null)

  const [activeTab, setActiveTab] = useState('Overview')

  const selectedProject = useMemo(() => {
    if (!projects || projects.length === 0) {
      return null
    }

    if (selectedId) {
      const selected = projects.find(
        (project) => project.id === selectedId,
      )

      if (selected) {
        return selected
      }
    }

    return projects[0]
  }, [projects, selectedId])

  // Set first project after projects are loaded.
  useEffect(() => {
    if (
      projects.length > 0 &&
      !projects.some((project) => project.id === selectedId)
    ) {
      setSelectedId(projects[0].id)
    }
  }, [projects, selectedId])

  const SelectedTypeIcon = selectedProject
    ? getTypeIcon(selectedProject.type)
    : null

  // ---------------------------------------------------------
  // Risk
  // ---------------------------------------------------------

  const {
    prediction,
    loading: riskLoading,
  } = useRisk(
    selectedProject
      ? selectedProject.id
      : null,
  )

  // ---------------------------------------------------------
  // Recommendations
  // ---------------------------------------------------------

  const [recommendations, setRecommendations] = useState([])

  const [recsLoading, setRecsLoading] = useState(false)

  const [generatingRecommendationsState, setGeneratingRecommendationsState] =
    useState(false)

  const [updatingRecommendationId, setUpdatingRecommendationId] =
    useState(null)

  const [recommendationError, setRecommendationError] =
    useState(null)

  // ---------------------------------------------------------
  // Fetch recommendations for selected project
  // ---------------------------------------------------------

  const loadRecommendations = async () => {
    if (!selectedProject?.id) {
      setRecommendations([])
      return
    }

    try {
      setRecsLoading(true)
      setRecommendationError(null)

      const response = await getRecommendations(
        selectedProject.id,
      )

      const activeRecommendations = (
        response?.data || []
      ).filter(
        (recommendation) =>
          recommendation.status === 'PENDING' ||
          recommendation.status === 'ACCEPTED',
      )

      setRecommendations(activeRecommendations)
    } catch (error) {
      console.error(
        'Failed to fetch recommendations:',
        error,
      )

      setRecommendations([])

      setRecommendationError(
        error?.message ||
          'Failed to load recommendations',
      )
    } finally {
      setRecsLoading(false)
    }
  }

  useEffect(() => {
    loadRecommendations()
  }, [selectedProject?.id])

  // ---------------------------------------------------------
  // Generate Gemini recommendations
  // ---------------------------------------------------------

  const handleGenerateRecommendations = async () => {
    if (!selectedProject?.id) {
      setRecommendationError(
        'Unable to find the project_id for this project.',
      )

      return
    }

    try {
      setGeneratingRecommendationsState(true)
      setRecommendationError(null)

      console.log(
        'Generating AI recommendations for:',
        selectedProject.id,
      )

      await generateRecommendations(
        selectedProject.id,
      )

      // Gemini generation is complete.
      // Fetch the recommendations that were saved in DB.
      await loadRecommendations()
    } catch (error) {
      console.error(
        'Failed to generate recommendations:',
        error,
      )

      setRecommendationError(
        error?.message ||
          'Unable to generate AI recommendations.',
      )
    } finally {
      setGeneratingRecommendationsState(false)
    }
  }

  // ---------------------------------------------------------
  // Change recommendation status
  // ---------------------------------------------------------

  const handleRecommendationStatusChange = async (
    recommendationId,
    status,
  ) => {
    try {
      setUpdatingRecommendationId(
        recommendationId,
      )

      setRecommendationError(null)

      await updateRecommendationStatus(
        recommendationId,
        status,
      )

      if (
        status === 'DISMISSED' ||
        status === 'COMPLETED'
      ) {
        // Remove from frontend immediately.
        setRecommendations((current) =>
          current.filter(
            (recommendation) =>
              recommendation.id !==
              recommendationId,
          ),
        )
      } else {
        // PENDING / ACCEPTED
        setRecommendations((current) =>
          current.map((recommendation) =>
            recommendation.id ===
            recommendationId
              ? {
                  ...recommendation,
                  status,
                }
              : recommendation,
          ),
        )
      }
    } catch (error) {
      console.error(
        'Failed to update recommendation status:',
        error,
      )

      setRecommendationError(
        error?.message ||
          'Failed to update recommendation status.',
      )
    } finally {
      setUpdatingRecommendationId(null)
    }
  }

  // ---------------------------------------------------------
  // Stage progress
  // ---------------------------------------------------------

  const [stageProgress, setStageProgress] =
    useState([])

  const [
    stageProgressCurrentStage,
    setStageProgressCurrentStage,
  ] = useState(null)

  const [stageProgressLoading, setStageProgressLoading] =
    useState(false)

  useEffect(() => {
    if (!selectedProject?.id) {
      return
    }

    let isMounted = true

    setStageProgressLoading(true)

    getStageProgress(selectedProject.id)
      .then((res) => {
        console.log(
          'STAGE PROGRESS RAW:',
          res,
        )

        const data =
          res?.data?.data ??
          res?.data ??
          res

        const stages = Array.isArray(
          data?.stages,
        )
          ? data.stages
          : []

        console.log(
          'STAGE PROGRESS DATA:',
          data,
        )

        console.log(
          'STAGE PROGRESS STAGES:',
          stages,
        )

        if (isMounted) {
          setStageProgress(stages)

          setStageProgressCurrentStage(
            data?.currentStage ||
              null,
          )
        }
      })
      .catch((error) => {
        console.error(
          'Failed to fetch stage progress:',
          error,
        )

        if (isMounted) {
          setStageProgress([])
          setStageProgressCurrentStage(
            null,
          )
        }
      })
      .finally(() => {
        if (isMounted) {
          setStageProgressLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [selectedProject?.id])

  // ---------------------------------------------------------
  // Recommendation helpers
  // ---------------------------------------------------------

  const getPriorityClasses = (priority) => {
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

  const getStatusClasses = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200'

      case 'ACCEPTED':
        return 'bg-blue-50 text-blue-700 border-blue-200'

      case 'COMPLETED':
        return 'bg-green-50 text-green-700 border-green-200'

      case 'DISMISSED':
        return 'bg-gray-50 text-gray-600 border-gray-200'

      default:
        return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-3 w-3" />

      case 'ACCEPTED':
        return <Check className="h-3 w-3" />

      case 'COMPLETED':
        return <CheckCircle2 className="h-3 w-3" />

      case 'DISMISSED':
        return <X className="h-3 w-3" />

      default:
        return null
    }
  }

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------

  return (
    <DashboardLayout activeKey="dashboard">

      {/* =====================================================
          KPI CARDS
      ====================================================== */}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">

        <SummaryCard
          icon={FolderKanban}
          value={
            summaryLoading
              ? '—'
              : summary?.myProjects
          }
          label="My Projects"
        />

        <SummaryCard
          icon={AlertTriangle}
          value={
            summaryLoading
              ? '—'
              : summary?.highRisk
          }
          label="High Risk"
          accent="text-red-600"
          bg="bg-red-50"
        />

        <SummaryCard
          icon={AlertCircle}
          value={
            summaryLoading
              ? '—'
              : summary?.mediumRisk
          }
          label="Medium Risk"
          accent="text-amber-500"
          bg="bg-amber-50"
        />

        <SummaryCard
          icon={CheckCircle2}
          value={
            summaryLoading
              ? '—'
              : summary?.lowRisk
          }
          label="Low Risk"
          accent="text-green-600"
          bg="bg-green-50"
        />

        <SummaryCard
          icon={Percent}
          value={
            summaryLoading
              ? '—'
              : formatRiskScore(
                  summary?.avgRiskScore,
                )
          }
          label="Avg. Risk Score"
        />

        <SummaryCard
          icon={ListTodo}
          value={
            summaryLoading
              ? '—'
              : summary?.pendingActions
          }
          label="Pending Actions"
        />

        <SummaryCard
          icon={RefreshCw}
          value={
            summaryLoading
              ? '—'
              : formatDateTimeShort(
                  summary?.lastUpdated,
                )
          }
          label="Last Updated"
          compactValue
        />
      </div>

      {/* =====================================================
          MAIN TWO COLUMN LAYOUT
      ====================================================== */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[55fr_45fr]">

        {/* ===================================================
            LEFT COLUMN
        ==================================================== */}

        <div className="flex min-w-0 flex-col gap-5">

          {/* Project Map */}

          <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">

            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">

              <div className="flex items-center gap-2.5">

                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
                  <MapPin className="h-4 w-4" />
                </span>

                <div>

                  <h3 className="text-sm font-semibold text-gray-800">
                    Projects Map ({districtText})
                  </h3>

                  <p className="text-[11px] text-gray-400">
                    Click a marker to inspect the project
                  </p>

                </div>

              </div>

              <span className="hidden rounded-full bg-gray-50 px-2.5 py-1 text-[10px] font-semibold text-gray-500 sm:inline">
                Interactive Map
              </span>

            </div>

            <RiskMap
              onViewDetails={(marker) =>
                setSelectedId(marker.id)
              }
            />

          </section>

          {/* My Projects */}

          <ProjectTable
            title={`My Projects (${districtText})`}
            projects={projects}
            loading={projectsLoading}
            error={projectsError}
            pagination={pagination}
            filters={filters}
            onFiltersChange={setFilters}
            onRetry={refetch}
            onView={(project) =>
              setSelectedId(project.id)
            }
          />

        </div>

        {/* ===================================================
            RIGHT COLUMN
        ==================================================== */}

        <div className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-[76px] xl:max-h-[calc(100vh-96px)] xl:overflow-y-auto xl:pr-1 scrollbar-thin">

          <section className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">

            {/* Selected Project */}

            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Selected Project
            </p>

            {selectedProject ? (

              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary-dark via-primary to-primary-light p-4 text-white shadow-sm">

                <div
                  className="pointer-events-none absolute -right-6 -top-10 h-28 w-28 rounded-full bg-white/10"
                  aria-hidden="true"
                />

                <div
                  className="pointer-events-none absolute -bottom-12 right-16 h-24 w-24 rounded-full bg-white/5"
                  aria-hidden="true"
                />

                <div className="relative flex flex-wrap items-start justify-between gap-3">

                  <div className="flex min-w-0 items-start gap-3">

                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">

                      {SelectedTypeIcon ? (
                        <SelectedTypeIcon className="h-5 w-5" />
                      ) : null}

                    </span>

                    <div className="min-w-0">

                      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/60">
                        {selectedProject.id} ·{' '}
                        {selectedProject.district}
                      </p>

                      <h3 className="truncate text-sm font-bold leading-snug">
                        {selectedProject.name}
                      </h3>

                      <p className="mt-0.5 text-[11px] text-white/70">
                        {selectedProject.type} ·{' '}
                        {selectedProject.stage}
                      </p>

                    </div>

                  </div>

                  <div className="flex flex-col items-end gap-2">

                    <RiskBadge
                      level={
                        selectedProject.riskLevel
                      }
                    />

                    <div className="flex flex-wrap items-center justify-end gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/project-manager/projects/${selectedProject.id}/edit`,
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-primary-dark shadow-sm transition-colors hover:bg-gray-100"
                      >
                        <span className="text-sm leading-none">
                          ✎
                        </span>

                        Edit Project
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/project-manager/projects/${selectedProject.id}`,
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-white/25"
                      >
                        <ExternalLink className="h-3 w-3" />

                        View Full Details
                      </button>

                    </div>

                  </div>

                </div>

              </div>

            ) : (

              <Loader label="Selecting project…" />

            )}

            {/* Tabs */}

            <div className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-gray-100">

              {TABS.map((tab) => (

                <button
                  key={tab}
                  type="button"
                  onClick={() =>
                    setActiveTab(tab)
                  }
                  className={`whitespace-nowrap border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                    activeTab === tab
                      ? 'border-accent text-accent'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>

              ))}

            </div>

            {/* =================================================
                TAB CONTENT
            ================================================== */}

            {activeTab !== 'Documents' &&
            selectedProject ? (

              <>

                {/* =============================================
                    OVERVIEW / RISK
                ============================================== */}

                {(activeTab === 'Overview' ||
                  activeTab === 'Risk Analysis') && (

                  <>

                    {activeTab === 'Overview' ? (

                      <div className="rounded-lg border border-gray-100 p-3">

                        <h4 className="mb-3 text-xs font-semibold text-gray-700">
                          Project Information
                        </h4>

                        <ProjectInfo
                          project={selectedProject}
                        />

                      </div>

                    ) : null}

                    {/* Risk Prediction */}

                    <div className="rounded-lg border border-gray-100 p-3">

                      <div className="mb-2.5 flex items-center justify-between">

                        <h4 className="text-xs font-semibold text-gray-700">
                          Risk Prediction
                        </h4>

                        <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-semibold text-accent">
                          AI Model
                        </span>

                      </div>

                      {riskLoading ||
                      !prediction ? (

                        <Loader className="py-8" />

                      ) : (

                        <RiskGauge
                          probability={
                            prediction.delayProbability
                          }
                          riskLevel={
                            prediction.riskLevel
                          }
                          riskScore={
                            prediction.riskScore
                          }
                          warningMessage={
                            prediction.warningMessage
                          }
                        />

                      )}

                    </div>

                  </>

                )}

                {/* =============================================
                    SHAP
                ============================================== */}

                {(activeTab === 'Overview' ||
                  activeTab ===
                    'Explanation (XAI)') && (

                  <div className="rounded-lg border border-gray-100 p-3">

                    <h4 className="mb-2.5 text-xs font-semibold text-gray-700">
                      Key Risk Factors (SHAP Explanation)
                    </h4>

                    <RiskFactors
                      factors={
                        prediction
                          ? prediction.shapFactors
                          : []
                      }
                      summary={
                        prediction
                          ? prediction.summary
                          : ''
                      }
                      loading={riskLoading}
                    />

                  </div>

                )}

                {/* =================================================
                    AI RECOMMENDATIONS
                ================================================== */}

                {(activeTab === 'Overview' ||
                  activeTab ===
                    'Recommendations') && (

                  <div className="rounded-lg border border-gray-100 p-3">

                    {/* Header */}

                    <div className="mb-3 flex items-center justify-between gap-2">

                      <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">

                        <BrainCircuit className="h-3.5 w-3.5 text-accent" />

                        AI Recommendations

                      </h4>

                      <span className="flex items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-semibold text-accent">

                        <Sparkles className="h-3 w-3" />

                        Gemini AI

                      </span>

                    </div>

                    {/* Generate button */}

                    <button
                      type="button"
                      onClick={
                        handleGenerateRecommendations
                      }
                      disabled={
                        generatingRecommendationsState ||
                        !selectedProject?.id
                      }
                      className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
                    >

                      {generatingRecommendationsState ? (

                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />

                          Generating AI Recommendations...
                        </>

                      ) : (

                        <>
                          <BrainCircuit className="h-3.5 w-3.5" />

                          Generate AI Recommendations
                        </>

                      )}

                    </button>

                    {/* Error */}

                    {recommendationError ? (

                      <div className="mb-3 rounded-lg border border-red-100 bg-red-50 p-2.5 text-[11px] text-red-700">

                        <div className="flex items-start gap-2">

                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                          <span>
                            {recommendationError}
                          </span>

                        </div>

                      </div>

                    ) : null}

                    {/* =================================================
                        SCROLLABLE RECOMMENDATIONS AREA
                    ================================================== */}

                    <div className="max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">

                      {recsLoading ? (

                        <div className="py-8">

                          <Loader label="Loading recommendations..." />

                        </div>

                      ) : recommendations.length ===
                        0 ? (

                        <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center">

                          <BrainCircuit className="mx-auto mb-2 h-7 w-7 text-gray-300" />

                          <p className="text-xs font-medium text-gray-500">
                            No active AI recommendations
                          </p>

                          <p className="mt-1 text-[10px] text-gray-400">
                            Generate recommendations using Gemini AI.
                          </p>

                        </div>

                      ) : (

                        <div className="space-y-3">

                          {recommendations.map(
                            (recommendation) => (

                              <div
                                key={
                                  recommendation.id
                                }
                                className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                              >

                                {/* Recommendation header */}

                                <div className="flex items-start justify-between gap-3">

                                  <div className="min-w-0 flex-1">

                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                      AI Recommendation
                                    </p>

                                    <p className="mt-1 text-xs font-medium leading-relaxed text-gray-700">
                                      {
                                        recommendation.recommendation
                                      }
                                    </p>

                                  </div>

                                  {/* Priority */}

                                  <span
                                    className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold ${getPriorityClasses(
                                      recommendation.priority,
                                    )}`}
                                  >
                                    {
                                      recommendation.priority
                                    }
                                  </span>

                                </div>

                                {/* Bottom row */}

                                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-2.5">

                                  {/* Current status */}

                                  <div
                                    className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-semibold ${getStatusClasses(
                                      recommendation.status,
                                    )}`}
                                  >

                                    {getStatusIcon(
                                      recommendation.status,
                                    )}

                                    {
                                      recommendation.status
                                    }

                                  </div>

                                  {/* Status dropdown */}

                                  <div className="flex items-center gap-2">

                                    <label
                                      htmlFor={`recommendation-status-${recommendation.id}`}
                                      className="text-[9px] font-medium text-gray-400"
                                    >
                                      Update
                                    </label>

                                    <select
                                      id={`recommendation-status-${recommendation.id}`}
                                      value={
                                        recommendation.status
                                      }
                                      disabled={
                                        updatingRecommendationId ===
                                        recommendation.id
                                      }
                                      onChange={(event) =>
                                        handleRecommendationStatusChange(
                                          recommendation.id,
                                          event.target.value,
                                        )
                                      }
                                      className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-gray-700 outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                                    >

                                      {RECOMMENDATION_STATUSES.map(
                                        (status) => (

                                          <option
                                            key={status}
                                            value={status}
                                          >
                                            {status}
                                          </option>

                                        ),
                                      )}

                                    </select>

                                    {updatingRecommendationId ===
                                    recommendation.id ? (

                                      <RefreshCw className="h-3 w-3 animate-spin text-gray-400" />

                                    ) : null}

                                  </div>

                                </div>

                              </div>

                            ),
                          )}

                        </div>

                      )}

                    </div>

                    {/* Recommendation count */}

                    {recommendations.length >
                    0 ? (

                      <div className="mt-2 text-right text-[9px] text-gray-400">

                        Showing{' '}
                        {
                          recommendations.length
                        }{' '}
                        active recommendation
                        {recommendations.length !==
                        1
                          ? 's'
                          : ''}

                      </div>

                    ) : null}

                    {/* Take action */}

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/project-manager/projects/${selectedProject.id}`,
                        )
                      }
                      className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Take Action

                      <ArrowRight className="h-3.5 w-3.5" />

                    </button>

                  </div>

                )}

                {/* =============================================
                    PROJECT STAGE PROGRESS
                ============================================== */}

                {(activeTab === 'Overview' ||
                  activeTab === 'Progress') && (

                  <div className="rounded-lg border border-gray-100 p-3">

                    <h4 className="mb-2.5 text-xs font-semibold text-gray-700">
                      Project Stage Progress
                    </h4>

                    <ProjectProgress
                      currentStage={
                        stageProgressCurrentStage ||
                        selectedProject.stage
                      }
                      stages={stageProgress}
                      loading={
                        stageProgressLoading
                      }
                    />

                  </div>

                )}

                {/* =============================================
                    RECENT ALERTS
                ============================================== */}

                {activeTab === 'Overview' ? (

                  <div className="rounded-lg border border-gray-100 p-3">

                    <h4 className="mb-1.5 text-xs font-semibold text-gray-700">
                      Recent Alerts
                    </h4>

                    <RecentAlerts
                      projectId={
                        selectedProject.id
                      }
                      maxItems={4}
                    />

                  </div>

                ) : null}

              </>

            ) : null}

            {/* =================================================
                DOCUMENTS
            ================================================== */}

            {activeTab === 'Documents' ? (

              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-200 py-10 text-center">

                <FileText className="h-6 w-6 text-gray-300" />

                <p className="text-xs font-medium text-gray-500">
                  No documents uploaded yet
                </p>

                <p className="text-[10px] text-gray-400">
                  Notifications, awards and R&R documents will appear here.
                </p>

              </div>

            ) : null}

          </section>

        </div>

      </div>

    </DashboardLayout>
  )
}