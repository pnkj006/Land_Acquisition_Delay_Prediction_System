import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileDown, RefreshCw } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout.jsx'
import PageHeader from '../../components/layout/PageHeader.jsx'
import Loader from '../../components/common/Loader.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import Button from '../../components/common/Button.jsx'
import RiskDistributionChart from '../../components/risk/RiskDistributionChart.jsx'
import ReportFilters from '../../components/reports/ReportFilters.jsx'
import PerformanceSummary from '../../components/reports/PerformanceSummary.jsx'
import DistrictPerformance from '../../components/reports/DistrictPerformance.jsx'
import DelayDrivers from '../../components/reports/DelayDrivers.jsx'
import ProjectPerformanceTable from '../../components/reports/ProjectPerformanceTable.jsx'
import { useProjects } from '../../hooks/useProjects'
import { useRisk } from '../../hooks/useRisk'
import { formatDateTimeShort } from '../../utils/formatters'
import {
  buildExportRows,
  buildFilterOptions,
  buildInsights,
  computeDistrictRows,
  computeMetrics,
  countActiveFilters,
  deriveDelayDrivers,
  EMPTY_FILTERS,
  filterProjects,
} from '../../utils/analyticsUtils'
import { exportCsv, timestampedFilename } from '../../utils/csvUtils'

const EXPORT_HEADERS = [
  'Project ID',
  'Project',
  'District',
  'Type',
  'Stage',
  'Risk',
  'Progress (derived)',
  'Delay Probability',
  'Expected Delay',
  'Status',
]

/**
 * Reports & Analytics — an analytics workspace over the SAME project data the
 * Dashboard / Risk Analysis / My Projects pages read. District delay-driver
 * detail comes from the real risk service (SHAP) for the selected project;
 * no analytics value is ever fabricated.
 */
export default function Reports() {
  const navigate = useNavigate()
  const { projects, loading, error, refetch } = useProjects({ page: 1, pageSize: 100 })
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [lastUpdated, setLastUpdated] = useState(null)

  const options = useMemo(() => buildFilterOptions(projects), [projects])
  const filtered = useMemo(() => filterProjects(projects, filters), [projects, filters])
  const metrics = useMemo(() => computeMetrics(filtered), [filtered])
  const districtRows = useMemo(() => computeDistrictRows(filtered), [filtered])
  const insights = useMemo(() => buildInsights(filtered), [filtered])

  // SHAP drivers: loaded from the real risk service for the first project in
  // the current selection (the same way Risk Analysis picks its focus project).
  const shapProjectId = filtered.length > 0 ? filtered[0].id : null
  const { prediction, loading: riskLoading } = useRisk(shapProjectId)
  const drivers = useMemo(
    () => deriveDelayDrivers(prediction?.shapFactors ?? []),
    [prediction],
  )
  const shapProject = projects.find((p) => p.id === shapProjectId)

  const handleRefetch = useCallback(() => {
    refetch()
    setLastUpdated(new Date())
  }, [refetch])

  const handleExportCsv = () => {
    exportCsv(timestampedFilename('project-report'), EXPORT_HEADERS, buildExportRows(filtered))
  }

  if (loading) {
    return (
      <DashboardLayout activeKey="reports">
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader label="Loading analytics…" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout activeKey="reports">
        <ErrorState
          message="Unable to load analytics. The project data could not be fetched — nothing is shown rather than estimated."
          onRetry={refetch}
        />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout activeKey="reports">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Monitor district performance, project delays, risk trends, and major drivers across the land acquisition portfolio."
        actions={
          <>
            {lastUpdated ? (
              <span className="hidden text-[11px] text-gray-400 lg:inline">
                Last Updated {formatDateTimeShort(lastUpdated)}
              </span>
            ) : null}
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={handleRefetch}>
              Refresh
            </Button>
            <Button size="sm" icon={FileDown} onClick={handleExportCsv} disabled={filtered.length === 0}>
              Export Report
            </Button>
          </>
        }
      />
      <div className="flex flex-col gap-5">
        <ReportFilters
          filters={filters}
          options={options}
          onChange={setFilters}
          onReset={() => setFilters(EMPTY_FILTERS)}
          activeCount={countActiveFilters(filters)}
        />

        <PerformanceSummary metrics={metrics} />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <DistrictPerformance rows={districtRows} />
          <DelayDrivers
            drivers={drivers}
            loading={riskLoading}
            scopeLabel={shapProject ? shapProject.name : undefined}
          />
        </div>

        <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800">Key Insights</h3>
          <p className="text-[11px] text-gray-400">
            Computed summaries derived from the selected data — not AI-generated
          </p>
          {insights.length === 0 ? (
            <p className="mt-3 text-xs text-gray-500">
              No insights are available for the current selection.
            </p>
          ) : (
            <ul className="mt-3 flex list-inside list-disc flex-col gap-1.5 text-xs text-gray-700">
              {insights.map((insight) => (
                <li key={insight}>{insight}</li>
              ))}
            </ul>
          )}
        </section>

        <RiskDistributionChart
          stats={{ total: metrics.total, high: metrics.high, medium: metrics.medium, low: metrics.low }}
        />

        <ProjectPerformanceTable
          projects={filtered}
          onViewProject={(projectId) => navigate(`/projects/${projectId}`)}
        />

        {projects.length === 0 ? (
          <EmptyState
            title="No analytics available for the selected filters."
            message="Load or add projects to see district performance, delay drivers and risk distribution."
          />
        ) : null}

        <p className="text-[10px] text-gray-400">
          CSV export contains exactly the filtered rows shown above. PDF export is not
          currently available (no PDF library is installed in this application).
        </p>
      </div>
    </DashboardLayout>
  )
}
