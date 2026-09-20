import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout.jsx'
import PageHeader from '../../components/layout/PageHeader.jsx'
import Loader from '../../components/common/Loader.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import RiskFilterBar from '../../components/risk/RiskFilterBar.jsx'
import RiskSummaryCards from '../../components/risk/RiskSummaryCards.jsx'
import RiskDistributionChart from '../../components/risk/RiskDistributionChart.jsx'
import RiskTrendChart from '../../components/risk/RiskTrendChart.jsx'
import RiskProjectTable from '../../components/risk/RiskProjectTable.jsx'
import SelectedProjectAnalysis from '../../components/risk/SelectedProjectAnalysis.jsx'
import { useProjects } from '../../hooks/useProjects.js'
import { useDashboard } from '../../hooks/useDashboard.js'
import { useRisk } from '../../hooks/useRisk.js'
import { getRecommendations } from '../../api/recommendations.api'
import { PROJECT_STAGES, RISK_LEVELS } from '../../utils/constants'
import { formatDateTimeShort } from '../../utils/formatters'

const DEFAULT_FILTERS = { district: '', riskLevel: '', type: '', stage: '', dateFrom: '', dateTo: '' }

/**
 * Dedicated Risk Analysis workspace for District/Project Managers.
 *
 * Data sources (all existing, nothing invented):
 *  - projects.api (via useProjects): project rows incl. riskLevel,
 *    delayProbability and expectedDelayDays → filters, summary cards,
 *    distribution and the high-risk table.
 *  - risk.api (via useRisk): prediction, SHAP factors and per-project history
 *    for the selected project.
 *  - dashboard.api (via useDashboard): the real "Last Updated" timestamp.
 *  - recommendations.api: recommended actions for the selected project.
 */
export default function RiskAnalysis() {
  const navigate = useNavigate()
  // Fetch all rows so the page can compute its own distributions; page-level
  // filters (district/type/date) are applied client-side below.
  const { projects, loading, error, refetch } = useProjects({ pageSize: 100 })
  const { summary, loading: summaryLoading } = useDashboard()

  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedId, setSelectedId] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [recsLoading, setRecsLoading] = useState(true)

  const districts = useMemo(() => [...new Set(projects.map((p) => p.district))], [projects])
  const types = useMemo(() => [...new Set(projects.map((p) => p.type))], [projects])

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filters.district && p.district !== filters.district) return false
      if (filters.riskLevel && p.riskLevel !== filters.riskLevel) return false
      if (filters.type && p.type !== filters.type) return false
      if (filters.stage && p.stage !== filters.stage) return false
      if (filters.dateFrom && new Date(p.startDate) < new Date(filters.dateFrom)) return false
      if (filters.dateTo && new Date(p.startDate) > new Date(filters.dateTo)) return false
      return true
    })
  }, [projects, filters])

  // Summary KPIs computed from the FILTERED set — never hardcoded.
  const riskStats = useMemo(() => {
    const count = (level) => filteredProjects.filter((p) => p.riskLevel === level).length
    const total = filteredProjects.length
    const avgDelay =
      total === 0
        ? 0
        : Math.round(
            filteredProjects.reduce((sum, p) => sum + (Number(p.expectedDelayDays) || 0), 0) / total,
          )
    return {
      total,
      high: count(RISK_LEVELS.HIGH),
      medium: count(RISK_LEVELS.MEDIUM),
      low: count(RISK_LEVELS.LOW),
      avgDelay,
    }
  }, [filteredProjects])

  // Selection reuses the dashboard mechanism: selectedId state with a safe
  // fallback, so the analysis panel always shows a project when one exists.
  const selectedProject = useMemo(
    () => filteredProjects.find((p) => p.id === selectedId) || filteredProjects[0] || null,
    [filteredProjects, selectedId],
  )

  const { prediction, loading: riskLoading } = useRisk(selectedProject ? selectedProject.id : null)

  // Recommended actions for the selected project (same pattern as dashboard).
  useEffect(() => {
    if (!selectedProject) return
    let isMounted = true
    setRecsLoading(true)
    getRecommendations(selectedProject.id)
      .then((res) => {
        if (isMounted) setRecommendations(res.data)
      })
      .finally(() => {
        if (isMounted) setRecsLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [selectedProject])

  const handleResetFilters = () => setFilters(DEFAULT_FILTERS)

  // Real timestamp from dashboard.api — not invented.
  const lastUpdated = (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-100 bg-white px-3 py-1.5 text-xs shadow-sm">
      <RefreshCw className="h-3.5 w-3.5 text-gray-400" />
      <span className="font-medium text-gray-700">Last Updated</span>
      <span className="text-gray-500">
        {summaryLoading ? '—' : formatDateTimeShort(summary?.lastUpdated)}
      </span>
    </span>
  )

  return (
    <DashboardLayout activeKey="risk-analysis">
      <PageHeader
        title="Risk Analysis"
        subtitle="Analyze project-level delay risk, identify high-risk projects, and understand the factors driving predicted delays."
        actions={lastUpdated}
      />
      <RiskFilterBar
        districts={districts}
        types={types}
        stages={PROJECT_STAGES}
        value={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        resultCount={filteredProjects.length}
        disabled={loading}
      />
      {loading ? (
        <Loader label="Loading risk analysis…" fullPage className="mt-6" />
      ) : error ? (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <ErrorState message="Unable to load risk analysis." onRetry={refetch} />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Risk summary KPIs — computed from the filtered set */}
          <RiskSummaryCards stats={riskStats} />

          {/* Distribution + trend */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <RiskDistributionChart stats={riskStats} />
            <RiskTrendChart projectId={selectedProject ? selectedProject.id : null} />
          </div>

          {/* High-risk projects table. View / row click select the project for
              the in-page analysis panel (same mechanism as the dashboard);
              the panel CTA opens the EXISTING details route. */}
          <RiskProjectTable
            projects={filteredProjects}
            selectedId={selectedProject ? selectedProject.id : null}
            onView={(project) => setSelectedId(project.id)}
            onResetFilters={handleResetFilters}
          />

          {/* Selected project analysis */}
          <SelectedProjectAnalysis
            project={selectedProject}
            prediction={prediction}
            predictionLoading={riskLoading}
            recommendations={recommendations}
            recommendationsLoading={recsLoading}
            onOpenDetails={(projectId) => navigate(`/projects/${projectId}`)}
          />
        </div>
      )}

    </DashboardLayout>
  )
}
