import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, Clock, Eye, FolderKanban, MapPin } from 'lucide-react'
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout.jsx'
import PageHeader from '../../components/layout/PageHeader.jsx'
import SummaryCard from '../../components/dashboard/SummaryCard.jsx'
import SearchBar from '../../components/common/SearchBar.jsx'
import FilterDropdown from '../../components/common/FilterDropdown.jsx'
import RiskBadge from '../../components/common/RiskBadge.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Loader from '../../components/common/Loader.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import Modal from '../../components/common/Modal.jsx'
import Button from '../../components/common/Button.jsx'
import { useProjects } from '../../hooks/useProjects.js'
import { computeDistrictRows } from '../../utils/analyticsUtils'
import { RISK_LEVELS } from '../../utils/constants'

/** Risk filter options — the same three levels already used by RiskBadge. */
const RISK_FILTER_OPTIONS = [
  { value: RISK_LEVELS.HIGH, label: 'High Risk' },
  { value: RISK_LEVELS.MEDIUM, label: 'Medium Risk' },
  { value: RISK_LEVELS.LOW, label: 'Low Risk' },
]

/** Table count column per risk filter value, so filtering reuses the counts
 *  already computed for the table instead of re-scanning the project list. */
const RISK_COUNT_KEY = {
  [RISK_LEVELS.HIGH]: 'highRisk',
  [RISK_LEVELS.MEDIUM]: 'mediumRisk',
  [RISK_LEVELS.LOW]: 'lowRisk',
}

/** Same palette used by the existing Admin stage chart. */
const BAR_COLORS = ['#1a5e3f', '#2563eb', '#0d9488', '#d97706', '#7c3aed', '#64748b']

const TOOLTIP_STYLE = {
  borderRadius: '8px',
  border: '1px solid #f3f4f6',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  fontSize: '12px',
}

/** Compact axis label only — the full district name is kept everywhere else. */
function shortDistrictLabel(district) {
  return String(district).replace(/\s*District\s*$/i, '')
}

/**
 * Admin-only district monitoring page.
 *
 * Every figure is aggregated from the SAME project records as the rest of the
 * app (useProjects → MOCK_PROJECTS / projects.api) through the existing
 * computeDistrictRows helper. No district list, statistic or delay value is
 * invented: districts come from the loaded records, and a metric that cannot
 * be derived renders N/A.
 *
 * "Delayed" follows the definition already used by the Admin Dashboard's
 * district table (computeDistrictRows.atRisk → High risk or delay probability
 * >= 50%), stated openly in the section subtitle.
 */
export default function AdminDistricts() {
  const navigate = useNavigate()
  const { projects, loading, error, refetch } = useProjects({ page: 1, pageSize: 100 })
  const [search, setSearch] = useState('')
  const [risk, setRisk] = useState('')
  const [selected, setSelected] = useState(null)

  /**
   * computeDistrictRows provides district / total / highRisk / atRisk /
   * averageDelay. Medium + Low counts are the same simple counts over the
   * district's own records, and the records themselves are kept so the
   * "View Projects" panel needs no extra request.
   */
  const rows = useMemo(() => {
    const grouped = new Map()
    projects.forEach((project) => {
      if (!project.district) return
      if (!grouped.has(project.district)) grouped.set(project.district, [])
      grouped.get(project.district).push(project)
    })

    return computeDistrictRows(projects).map((row) => {
      const list = grouped.get(row.district) || []
      return {
        ...row,
        mediumRisk: list.filter((p) => p.riskLevel === RISK_LEVELS.MEDIUM).length,
        lowRisk: list.filter((p) => p.riskLevel === RISK_LEVELS.LOW).length,
        projects: list,
      }
    })
  }, [projects])

  const hasActiveFilters = search.trim() !== '' || risk !== ''

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (risk !== '') {
        const key = RISK_COUNT_KEY[risk]
        if (key && !row[key]) return false
      }
      if (!q) return true
      return String(row.district).toLowerCase().includes(q)
    })
  }, [rows, search, risk])

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, row) => ({
          projects: acc.projects + row.total,
          high: acc.high + row.highRisk,
          delayed: acc.delayed + (row.atRisk || 0),
        }),
        { projects: 0, high: 0, delayed: 0 },
      ),
    [filtered],
  )

  const chartData = useMemo(
    () =>
      filtered.map((row) => ({
        district: row.district,
        label: shortDistrictLabel(row.district),
        count: row.total,
      })),
    [filtered],
  )

  const handleClear = () => {
    setSearch('')
    setRisk('')
  }

  return (
    <AdminDashboardLayout activeKey="districts">
      <PageHeader
        title="Districts"
        subtitle="Monitor project activity, risk and progress across districts."
      />

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard icon={MapPin} value={loading ? '—' : filtered.length} label="Total Districts" />
        <SummaryCard icon={FolderKanban} value={loading ? '—' : totals.projects} label="Total Projects" />
        <SummaryCard
          icon={AlertTriangle}
          value={loading ? '—' : totals.high}
          label="High-Risk Projects"
          accent="text-red-600"
          bg="bg-red-50"
        />
        <SummaryCard
          icon={Clock}
          value={loading ? '—' : totals.delayed}
          label="Delayed Projects"
          accent="text-orange-600"
          bg="bg-orange-50"
        />
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchBar placeholder="Search district..." value={search} onChange={setSearch} className="w-full sm:max-w-sm" />
        <FilterDropdown
          options={RISK_FILTER_OPTIONS}
          value={risk}
          onChange={setRisk}
          label="Filter by risk level"
          allLabel="All Risk Levels"
        />
      </div>

      {/* Compact comparison chart — one chart only. Counts come from the same
          filtered district rows that feed the table. */}
      <section className="mb-5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-800">Projects by District</h3>
          <p className="text-[11px] text-gray-400">Loaded project records grouped by district</p>
        </div>
        {loading ? (
          <Loader label="Loading districts…" />
        ) : chartData.length === 0 ? (
          <EmptyState title="No District Data" message="No districts match the current filters." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value) => [`${value} project${value === 1 ? '' : 's'}`, 'Projects']}
                labelFormatter={(label) => {
                  const row = chartData.find((d) => d.label === label)
                  return row ? row.district : label
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {chartData.map((entry, index) => (
                  <Cell key={entry.district} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">District Overview</h3>
            <p className="text-[11px] text-gray-500">
              {loading
                ? 'Loading districts...'
                : `Showing ${filtered.length} district${filtered.length === 1 ? '' : 's'} · Delayed = existing at-risk definition (High risk or delay probability ≥ 50%)`}
            </p>
          </div>
          {hasActiveFilters && !loading ? (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md px-2 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent-50"
            >
              Clear Filters
            </button>
          ) : null}
        </div>

        {loading ? (
          <Loader className="py-10" />
        ) : error ? (
          <ErrorState message="Failed to load district data." onRetry={refetch} />
        ) : filtered.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <EmptyState title="No districts found." message="Try adjusting your search or filters." />
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleClear}
                className="mt-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Clear Filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[920px] text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-2.5 font-semibold">District</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Total Projects</th>
                  <th className="px-4 py-2.5 text-right font-semibold">High Risk</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Medium Risk</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Low Risk</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Delayed Projects</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Average Expected Delay</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((row) => (
                  <tr key={row.district} className="transition-colors hover:bg-gray-50/60">
                    <td className="max-w-[220px] px-4 py-3 font-medium text-gray-800">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="truncate">{row.district}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-800">{row.total}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-red-600">{row.highRisk}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-600">{row.mediumRisk}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-green-700">{row.lowRisk}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {row.atRisk != null ? row.atRisk : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {row.averageDelay != null ? `${row.averageDelay} days` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(row)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent-50"
                      >
                        <Eye className="h-3 w-3" /> View Projects →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>



      {/* District projects — opens the district's own loaded records and links
          each one to the EXISTING Admin project details route
          (/admin/projects/:projectId), so the Admin stays in the Admin area. */}
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? selected.district : ''}
        size="lg"
      >
        {selected ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-500">
              {selected.total} project{selected.total === 1 ? '' : 's'} in this district
            </p>
            <div className="max-h-[360px] overflow-auto scrollbar-thin rounded-lg border border-gray-100">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead className="sticky top-0 bg-gray-50/90 text-[10px] uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Project</th>
                    <th className="px-3 py-2 font-semibold">Stage</th>
                    <th className="px-3 py-2 font-semibold">Risk</th>
                    <th className="px-3 py-2 text-right font-semibold">Delay</th>
                    <th className="px-3 py-2 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {selected.projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50/60">
                      <td className="max-w-[220px] px-3 py-2.5">
                        <p className="truncate font-medium text-gray-800">{project.name}</p>
                        <p className="text-[10px] text-gray-400">{project.id}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={project.stage} />
                      </td>
                      <td className="px-3 py-2.5">
                        <RiskBadge level={project.riskLevel} />
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                        {Number.isFinite(Number(project.delayProbability))
                          ? `${project.delayProbability}%`
                          : 'N/A'}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelected(null)
                            navigate(`/admin/projects/${project.id}`)
                          }}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Modal>
    </AdminDashboardLayout>
  )
}

