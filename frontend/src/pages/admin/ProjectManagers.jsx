import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Eye, ListTodo, Users } from 'lucide-react'
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout.jsx'
import PageHeader from '../../components/layout/PageHeader.jsx'
import SummaryCard from '../../components/dashboard/SummaryCard.jsx'
import SearchBar from '../../components/common/SearchBar.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import Loader from '../../components/common/Loader.jsx'
import Modal from '../../components/common/Modal.jsx'
import { useProjectManagers } from '../../hooks/useProjectManagers.js'
import { formatDate, formatDateTimeShort } from '../../utils/formatters'
import { timeAgo } from '../../utils/dateUtils'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'N/A', label: 'N/A' },
]

function displayValue(value) {
  return value ?? 'N/A'
}

function StatusPill({ status }) {
  if (status === 'Active') {
    return (
      <span className="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
        Active
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
      N/A
    </span>
  )
}

function ManagerDetailModal({ manager, open, onClose }) {
  if (!manager) return null
  return (
    <Modal open={open} onClose={onClose} title="Project Manager Details" size="md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-bold text-primary">
            {(manager.name || '?').trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-800">{manager.name}</p>
            <p className="truncate text-xs text-gray-500">{manager.email}</p>
          </div>
          <div className="ml-auto shrink-0">
            <StatusPill status={manager.status} />
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 rounded-lg border border-gray-100 bg-gray-50/60 p-3 text-xs sm:grid-cols-3">
          <div className="min-w-0">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Assigned Projects</dt>
            <dd className="mt-0.5 font-bold tabular-nums text-gray-900">{displayValue(manager.assignedProjects)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">High-Risk Projects</dt>
            <dd className="mt-0.5 font-bold tabular-nums text-gray-900">{displayValue(manager.highRisk)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Pending Actions</dt>
            <dd className="mt-0.5 font-bold tabular-nums text-gray-900">{displayValue(manager.pendingActions)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">District</dt>
            <dd className="mt-0.5 font-medium text-gray-700">{manager.district || 'N/A'}</dd>
          </div>
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Last Activity</dt>
            <dd className="mt-0.5 font-medium text-gray-700">
              {manager.lastActivity ? formatDateTimeShort(manager.lastActivity) : 'N/A'}
            </dd>
          </div>
        </dl>
        <div>
          <h4 className="text-xs font-semibold text-gray-800">Recent Activity</h4>
          {manager.recentUpdates && manager.recentUpdates.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {manager.recentUpdates.map((update) => (
                <li key={update.id} className="rounded-lg border border-gray-100 px-3 py-2 text-xs text-gray-600">
                  <p className="font-medium text-gray-800">{update.projectName || update.projectId || 'N/A'}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    {update.updateType || 'Field update'} · {update.submittedAt ? formatDate(update.submittedAt) : 'N/A'}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-gray-400">No recent field updates from this manager in the current session.</p>
          )}
        </div>
      </div>
    </Modal>
  )
}
export default function ProjectManagers() {
  const { managers, districts, loading, error, refetch } = useProjectManagers()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [districtFilter, setDistrictFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return managers.filter((manager) => {
      if (statusFilter !== 'all' && manager.status !== statusFilter) return false
      if (districtFilter !== 'all' && (manager.district || 'N/A') !== districtFilter) return false
      if (!q) return true
      return (
        String(manager.name || '').toLowerCase().includes(q) ||
        String(manager.email || '').toLowerCase().includes(q)
      )
    })
  }, [managers, search, statusFilter, districtFilter])

  const summary = useMemo(() => {
    const active = managers.filter((m) => m.status === 'Active').length
    return {
      total: loading ? '—' : managers.length,
      active: loading ? '—' : active,
    }
  }, [managers, loading])

  return (
    <AdminDashboardLayout activeKey="project-managers">
      <PageHeader
        title="Project Managers"
        subtitle="Monitor project managers, assigned projects, risks, pending actions and recent activity."
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard icon={Users} value={summary.total} label="Total Project Managers" />
        <SummaryCard icon={CheckCircle2} value={summary.active} label="Active Managers" accent="text-green-600" bg="bg-green-50" />
        <SummaryCard icon={AlertTriangle} value="N/A" label="Managers with High-Risk Projects" accent="text-red-600" bg="bg-red-50" />
        <SummaryCard icon={ListTodo} value="N/A" label="Managers with Pending Actions" accent="text-amber-500" bg="bg-amber-50" />
      </div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchBar placeholder="Search manager..." value={search} onChange={setSearch} className="w-full sm:max-w-xs" />
        <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            aria-label="Filter by district"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          >
            <option value="all">All Districts</option>
            {districts.map((district) => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-800">Project Managers</h3>
          <p className="text-[11px] text-gray-500">
            {loading ? 'Loading managers...' : `${filtered.length} manager${filtered.length === 1 ? '' : 's'}`}
          </p>
        </div>
        {loading ? (
          <Loader className="py-10" />
        ) : error ? (
          <ErrorState message="Failed to load project managers." onRetry={refetch} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No project managers found." message="Try adjusting your search or filters." />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[880px] text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-2.5 font-semibold">Manager</th>
                  <th className="px-4 py-2.5 font-semibold">Email</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Assigned Projects</th>
                  <th className="px-4 py-2.5 text-right font-semibold">High Risk</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Pending Actions</th>
                  <th className="px-4 py-2.5 font-semibold">Last Activity</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((manager) => (
                  <tr key={manager.id} className="transition-colors hover:bg-gray-50/60">
                    <td className="max-w-[180px] px-4 py-3">
                      <p className="truncate font-medium text-gray-800">{manager.name}</p>
                      <p className="truncate text-[11px] text-gray-400">{manager.district || 'N/A'}</p>
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-gray-600">{manager.email}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-800">{displayValue(manager.assignedProjects)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-800">{displayValue(manager.highRisk)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-800">{displayValue(manager.pendingActions)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{manager.lastActivity ? timeAgo(manager.lastActivity) : 'N/A'}</td>
                    <td className="px-4 py-3"><StatusPill status={manager.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => setSelected(manager)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent-50">
                        <Eye className="h-3 w-3" /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ManagerDetailModal manager={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </AdminDashboardLayout>
  )
}


