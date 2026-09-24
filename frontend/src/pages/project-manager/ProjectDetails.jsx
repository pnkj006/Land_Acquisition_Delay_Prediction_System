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
import Recommendations from '../../components/projects/Recommendations.jsx'
import RiskBadge from '../../components/common/RiskBadge.jsx'
import Loader from '../../components/common/Loader.jsx'

import { useAuth } from '../../context/AuthContext.jsx'
import { useDashboard } from '../../hooks/useDashboard.js'
import { useProjects } from '../../hooks/useProjects.js'
import { useRisk } from '../../hooks/useRisk.js'

import { getRecommendations } from '../../api/recommendations.api'
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

export default function ProjectManagerDashboard() {
  const { user } = useAuth()
  const districtText = user?.district || 'All Districts'

  const { summary, loading: summaryLoading } = useDashboard()

  const {
    projects,
    pagination,
    loading: projectsLoading,
    error: projectsError,
    filters,
    setFilters,
    refetch,
  } = useProjects({ pageSize: 5 })

  const navigate = useNavigate()

  const [selectedId, setSelectedId] = useState('P101')
  const [activeTab, setActiveTab] = useState('Overview')

  const [recommendations, setRecommendations] = useState([])
  const [recsLoading, setRecsLoading] = useState(true)

  // Stage progress
  const [stageProgress, setStageProgress] = useState([])
  const [stageProgressCurrentStage, setStageProgressCurrentStage] =
    useState(null)
  const [stageProgressLoading, setStageProgressLoading] =
    useState(false)

  const selectedProject = useMemo(
    () =>
      projects.find((p) => p.id === selectedId) ||
      projects[0] ||
      null,
    [projects, selectedId],
  )

  const SelectedTypeIcon = selectedProject
    ? getTypeIcon(selectedProject.type)
    : null

  const { prediction, loading: riskLoading } = useRisk(
    selectedProject ? selectedProject.id : null,
  )

  // Fetch recommendations
  useEffect(() => {
    if (!selectedProject) return

    let isMounted = true

    setRecsLoading(true)

    getRecommendations(selectedProject.id)
      .then((res) => {
        if (isMounted) {
          setRecommendations(res.data || [])
        }
      })
      .catch((error) => {
        console.error('Failed to fetch recommendations:', error)

        if (isMounted) {
          setRecommendations([])
        }
      })
      .finally(() => {
        if (isMounted) {
          setRecsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [selectedProject?.id])

  // Fetch stage progress
useEffect(() => {
  if (!selectedProject?.id) return

  let isMounted = true

  setStageProgressLoading(true)

  getStageProgress(selectedProject.id)
    .then((res) => {
      console.log('STAGE PROGRESS RAW:', res)

      const data = res?.data?.data ?? res?.data ?? res

      const stages = Array.isArray(data?.stages)
        ? data.stages
        : []

      console.log('STAGE PROGRESS DATA:', data)
      console.log('STAGE PROGRESS STAGES:', stages)
      console.log('STAGE PROGRESS CURRENT:', data?.currentStage)

      if (isMounted) {
        setStageProgress(stages)
        setStageProgressCurrentStage(data?.currentStage || null)
      }
    })
    .catch((error) => {
      console.error('Failed to fetch stage progress:', error)

      if (isMounted) {
        setStageProgress([])
        setStageProgressCurrentStage(null)
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

  return (
    <DashboardLayout activeKey="dashboard">
      {/* KPI cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <SummaryCard
          icon={FolderKanban}
          value={summaryLoading ? '—' : summary?.myProjects}
          label="My Projects"
        />

        <SummaryCard
          icon={AlertTriangle}
          value={summaryLoading ? '—' : summary?.highRisk}
          label="High Risk"
          accent="text-red-600"
          bg="bg-red-50"
        />

        <SummaryCard
          icon={AlertCircle}
          value={summaryLoading ? '—' : summary?.mediumRisk}
          label="Medium Risk"
          accent="text-amber-500"
          bg="bg-amber-50"
        />

        <SummaryCard
          icon={CheckCircle2}
          value={summaryLoading ? '—' : summary?.lowRisk}
          label="Low Risk"
          accent="text-green-600"
          bg="bg-green-50"
        />

        <SummaryCard
          icon={Percent}
          value={
            summaryLoading
              ? '—'
              : formatRiskScore(summary?.avgRiskScore)
          }
          label="Avg. Risk Score"
        />

        <SummaryCard
          icon={ListTodo}
          value={summaryLoading ? '—' : summary?.pendingActions}
          label="Pending Actions"
        />

        <SummaryCard
          icon={RefreshCw}
          value={
            summaryLoading
              ? '—'
              : formatDateTimeShort(summary?.lastUpdated)
          }
          label="Last Updated"
          compactValue
        />
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[55fr_45fr]">
        {/* LEFT COLUMN */}
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
              onViewDetails={(marker) => setSelectedId(marker.id)}
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
            onView={(project) => setSelectedId(project.id)}
          />
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-[76px] xl:max-h-[calc(100vh-96px)] xl:overflow-y-auto xl:pr-1 scrollbar-thin">
          <section className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            {/* Selected project */}
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
                        {selectedProject.id} · {selectedProject.district}
                      </p>

                      <h3 className="truncate text-sm font-bold leading-snug">
                        {selectedProject.name}
                      </h3>

                      <p className="mt-0.5 text-[11px] text-white/70">
                        {selectedProject.type} · {selectedProject.stage}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <RiskBadge level={selectedProject.riskLevel} />

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
            ) : (
              <Loader label="Selecting project…" />
            )}

            {/* Tabs */}
            <div className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-gray-100">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
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

            {/* Tab content */}
            {activeTab !== 'Documents' && selectedProject ? (
              <>
                {/* Overview / Risk Analysis */}
                {(activeTab === 'Overview' ||
                  activeTab === 'Risk Analysis') && (
                  <>
                    {activeTab === 'Overview' ? (
                      <div className="rounded-lg border border-gray-100 p-3">
                        <h4 className="mb-3 text-xs font-semibold text-gray-700">
                          Project Information
                        </h4>

                        <ProjectInfo project={selectedProject} />
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

                      {riskLoading || !prediction ? (
                        <Loader className="py-8" />
                      ) : (
                        <RiskGauge
                          probability={prediction.delayProbability}
                          riskLevel={prediction.riskLevel}
                          riskScore={prediction.riskScore}
                          warningMessage={prediction.warningMessage}
                        />
                      )}
                    </div>
                  </>
                )}

                {/* SHAP explanation */}
                {activeTab === 'Overview' ||
                activeTab === 'Explanation (XAI)' ? (
                  <div className="rounded-lg border border-gray-100 p-3">
                    <h4 className="mb-2.5 text-xs font-semibold text-gray-700">
                      Key Risk Factors (SHAP Explanation)
                    </h4>

                    <RiskFactors
                      factors={prediction ? prediction.shapFactors : []}
                      summary={prediction ? prediction.summary : ''}
                      loading={riskLoading}
                    />
                  </div>
                ) : null}

                {/* AI Recommendation */}
                {activeTab === 'Overview' ||
                activeTab === 'Recommendations' ? (
                  <div className="rounded-lg border border-gray-100 p-3">
                    <div className="mb-2.5 flex items-center justify-between">
                      <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                        <BrainCircuit className="h-3.5 w-3.5 text-accent" />
                        AI Recommendation
                      </h4>

                      <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        Auto-generated
                      </span>
                    </div>

                    <Recommendations
                      recommendations={recommendations}
                      loading={recsLoading}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/project-manager/projects/${selectedProject.id}`,
                        )
                      }
                      className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-dark"
                    >
                      Take Action
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}

                {/* Project Stage Progress */}
                {activeTab === 'Overview' ||
                activeTab === 'Progress' ? (
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
                      loading={stageProgressLoading}
                    />
                  </div>
                ) : null}

                {/* Recent Alerts */}
                {activeTab === 'Overview' ? (
                  <div className="rounded-lg border border-gray-100 p-3">
                    <h4 className="mb-1.5 text-xs font-semibold text-gray-700">
                      Recent Alerts
                    </h4>

                    <RecentAlerts
                      projectId={selectedProject.id}
                      maxItems={4}
                    />
                  </div>
                ) : null}
              </>
            ) : null}

            {/* Documents */}
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