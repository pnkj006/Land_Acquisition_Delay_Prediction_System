import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Clock, Eye, FileDown, FolderKanban, ShieldAlert, ShieldCheck } from 'lucide-react'
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout.jsx'
import PageHeader from '../../components/layout/PageHeader.jsx'
import SummaryCard from '../../components/dashboard/SummaryCard.jsx'
import SearchBar from '../../components/common/SearchBar.jsx'
import RiskBadge from '../../components/common/RiskBadge.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Loader from '../../components/common/Loader.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import Button from '../../components/common/Button.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import { useProjects } from '../../hooks/useProjects.js'
import { getProjectStatus } from '../../utils/riskUtils'
import { buildExportRows, computeMetrics, deriveProgress } from '../../utils/analyticsUtils'
import { exportCsv, timestampedFilename } from '../../utils/csvUtils'
import { PROJECT_STAGES, PROJECT_TYPES, RISK_LEVELS } from '../../utils/constants'

const PAGE_SIZE = 8
const EXPORT_HEADERS = ['Project ID', 'Project', 'District', 'Type', 'Stage', 'Risk', 'Progress (derived)', 'Delay Probability', 'Expected Delay', 'Status']
const EMPTY_SELECT = { district: 'all', risk: 'all', stage: 'all', type: 'all', status: 'all' }

function selectClass() {
  return 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25'
}

/**
 * Admin-only system-wide "All Projects" monitoring page.
 * Reads the SAME project records as every other page via useProjects
 * (MOCK_PROJECTS / projects.api) — no duplicate dataset, no fake values.
 * Delayed / Completed have no source field on project records, so those
 * cards render N/A rather than invented counts.
 */
export default function AllProjects() {
  const navigate = useNavigate()
  const { projects, loading, error, refetch } = useProjects({ page: 1, pageSize: 100 })
  const [search, setSearch] = useState('')
  const [selects, setSelects] = useState(EMPTY_SELECT)
  const [page, setPage] = useState(1)

  const options = useMemo(() => {
    const unique = (key) => [...new Set(projects.map((p) => p[key]).filter(Boolean))].sort()
    return { districts: unique('district'), types: unique('type'), risks: unique('riskLevel'), stages: unique('stage') }
  }, [projects])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return projects.filter((p) => {
      if (selects.district !== 'all' && p.district !== selects.district) return false
      if (selects.risk !== 'all' && p.riskLevel !== selects.risk) return false
      if (selects.stage !== 'all' && p.stage !== selects.stage) return false
      if (selects.type !== 'all' && p.type !== selects.type) return false
      if (selects.status !== 'all') {
        const s = getProjectStatus(p)
        if (!s || s.label !== selects.status) return false
      }
      if (!q) return true
      return (
        String(p.id || '').toLowerCase().includes(q) ||
        String(p.name || '').toLowerCase().includes(q) ||
        String(p.district || '').toLowerCase().includes(q)
      )
    })
  }, [projects, search, selects])

  const metrics = useMemo(() => computeMetrics(filtered), [filtered])
  const hasActiveFilters = search.trim() !== '' || Object.values(selects).some((v) => v !== 'all')

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const updateSelect = (key, value) => {
    setSelects((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }
  const handleSearch = (value) => {
    setSearch(value)
    setPage(1)
  }
  const handleClear = () => {
    setSearch('')
    setSelects(EMPTY_SELECT)
    setPage(1)
  }
  const handleExport = () => {
    exportCsv(timestampedFilename('all-projects'), EXPORT_HEADERS, buildExportRows(filtered))
  }
  return (
    <AdminDashboardLayout activeKey="projects">
      <PageHeader
        title="All Projects"
        subtitle="Monitor all land acquisition projects, their progress, risks and delays."
        actions={(
          <Button size="sm" icon={FileDown} onClick={handleExport} disabled={loading || filtered.length === 0}>
            Export Report
          </Button>
        )}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <SummaryCard icon={FolderKanban} value={loading ? '—' : metrics.total} label="Total Projects" />
        <SummaryCard icon={ShieldAlert} value={loading ? '—' : metrics.high} label="High Risk" accent="text-red-600" bg="bg-red-50" />
        <SummaryCard icon={AlertTriangle} value={loading ? '—' : metrics.medium} label="Medium Risk" accent="text-amber-500" bg="bg-amber-50" />
        <SummaryCard icon={ShieldCheck} value={loading ? '—' : metrics.low} label="Low Risk" accent="text-green-600" bg="bg-green-50" />
        <SummaryCard icon={Clock} value="N/A" label="Delayed Projects" accent="text-orange-600" bg="bg-orange-50" />
        <SummaryCard icon={CheckCircle2} value="N/A" label="Completed Projects" accent="text-teal-600" bg="bg-teal-50" />
      </div>

      <div className="mb-4 flex flex-col gap-2">
        <SearchBar placeholder="Search projects..." value={search} onChange={handleSearch} className="w-full sm:max-w-sm" />
        <div className="flex flex-wrap gap-2">
          <select aria-label="Filter by district" value={selects.district} onChange={(e) => updateSelect('district', e.target.value)} className={selectClass()}>
            <option value="all">All Districts</option>
            {options.districts.map((d) => (<option key={d} value={d}>{d}</option>))}
          </select>
          <select aria-label="Filter by risk level" value={selects.risk} onChange={(e) => updateSelect('risk', e.target.value)} className={selectClass()}>
            <option value="all">All Risk Levels</option>
            {[RISK_LEVELS.HIGH, RISK_LEVELS.MEDIUM, RISK_LEVELS.LOW].filter((r) => options.risks.includes(r)).map((r) => (<option key={r} value={r}>{r}</option>))}
          </select>
          <select aria-label="Filter by stage" value={selects.stage} onChange={(e) => updateSelect('stage', e.target.value)} className={selectClass()}>
            <option value="all">All Stages</option>
            {PROJECT_STAGES.filter((s) => options.stages.includes(s)).map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
          <select aria-label="Filter by type" value={selects.type} onChange={(e) => updateSelect('type', e.target.value)} className={selectClass()}>
            <option value="all">All Types</option>
            {Object.values(PROJECT_TYPES).filter((t) => options.types.includes(t)).map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
          <select aria-label="Filter by status" value={selects.status} onChange={(e) => updateSelect('status', e.target.value)} className={selectClass()}>
            <option value="all">All Status</option>
            <option value="At Risk">At Risk</option>
            <option value="Monitor">Monitor</option>
            <option value="On Track">On Track</option>
          </select>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">All Projects</h3>
            <p className="text-[11px] text-gray-500">
              {loading ? 'Loading projects...' : `Showing ${filtered.length} project${filtered.length === 1 ? '' : 's'}`}
            </p>
          </div>
          {hasActiveFilters && !loading ? (
            <button type="button" onClick={handleClear} className="rounded-md px-2 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent-50">
              Clear Filters
            </button>
          ) : null}
        </div>
        {loading ? (
          <Loader className="py-10" />
        ) : error ? (
          <ErrorState message="Failed to load projects." onRetry={refetch} />
        ) : pageRows.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <EmptyState title="No projects found." message="Try adjusting your search or filters." />
            {hasActiveFilters ? (
              <button type="button" onClick={handleClear} className="mt-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                Clear Filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[1080px] text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-2.5 font-semibold">Project ID</th>
                  <th className="px-4 py-2.5 font-semibold">Project Name</th>
                  <th className="px-4 py-2.5 font-semibold">District</th>
                  <th className="px-4 py-2.5 font-semibold">Type</th>
                  <th className="px-4 py-2.5 font-semibold">Current Stage</th>
                  <th className="px-4 py-2.5 font-semibold">Risk Level</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Delay Probability</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Expected Delay</th>
                  <th className="px-4 py-2.5 font-semibold">Progress</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pageRows.map((project) => {
                  const progress = deriveProgress(project)
                  return (
                    <tr key={project.id} className="transition-colors hover:bg-gray-50/60">
                      <td className="px-4 py-3 font-semibold text-accent">{project.id}</td>
                      <td className="max-w-[200px] truncate px-4 py-3 font-medium text-gray-800">{project.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">{project.district || 'N/A'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">{project.type || 'N/A'}</td>
                      <td className="px-4 py-3"><StatusBadge status={project.stage} /></td>
                      <td className="px-4 py-3"><RiskBadge level={project.riskLevel} /></td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-800">{project.delayProbability != null ? `${project.delayProbability}%` : 'N/A'}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-600">{project.expectedDelayDays != null ? `${project.expectedDelayDays} days` : 'N/A'}</td>
                      <td className="min-w-[120px] px-4 py-3">
                        {progress == null ? (
                          <span className="text-gray-500">N/A</span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                              <span className="block h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                            </span>
                            <span className="font-semibold tabular-nums text-gray-700">{progress}%</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => navigate(`/admin/projects/${project.id}`)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent-50">
                          <Eye className="h-3 w-3" /> View Details
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && pageRows.length > 0 ? (
          <Pagination page={safePage} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        ) : null}
      </div>
    </AdminDashboardLayout>
  )
}


