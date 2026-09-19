import { useMemo, useState } from 'react'
import { AlertTriangle, Banknote, Bell, BellOff, FileCheck, RotateCcw, Scale } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout.jsx'
import PageHeader from '../../components/layout/PageHeader.jsx'
import AlertList from '../../components/alerts/AlertList.jsx'
import AlertDetailModal from '../../components/alerts/AlertDetailModal.jsx'
import SummaryCard from '../../components/dashboard/SummaryCard.jsx'
import FilterDropdown from '../../components/common/FilterDropdown.jsx'
import SearchBar from '../../components/common/SearchBar.jsx'
import Button from '../../components/common/Button.jsx'
import Loader from '../../components/common/Loader.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { useAlerts } from '../../hooks/useAlerts.js'
import { useNotifications } from '../../context/NotificationContext.jsx'
import { useProjects } from '../../hooks/useProjects.js'

const ALERT_TYPES = ['risk', 'legal', 'compensation', 'approval', 'update']
const TYPE_LABELS = {
  risk: 'Risk',
  legal: 'Legal',
  compensation: 'Compensation',
  approval: 'Approval',
  update: 'Field Update',
}

const DEFAULT_FILTERS = { type: '', projectId: '', search: '' }

/**
 * Dedicated Alerts workspace for District/Project Managers.
 *
 * Data sources (all existing, nothing invented):
 *  - alerts.api (via useAlerts): the alert feed (message, type, timestamp).
 *  - projects.api: project context for each alert's projectId (name, type,
 *    district, risk, delay probability, expected delay).
 *
 * The sidebar Alerts badge (via DashboardLayout + NotificationContext) shows
 * the real unread count. Clicking an alert opens a detail modal over the
 * EXISTING Modal component; the CTA uses the EXISTING project details route.
 */
export default function Alerts() {
  const { alerts, loading, error, refetch: refetchAlerts } = useAlerts()
  // Project context comes from the EXISTING projects API (same hook the
  // dashboard and Risk Analysis use) and is joined to each alert's projectId.
  const { projects } = useProjects({ pageSize: 100 })
  // App-wide read state — the SAME source the sidebar badge and navbar bell
  // use (NotificationContext), so every alerts surface shows one number that
  // clears together when the bell dropdown marks everything read.
  const { unreadCount } = useNotifications()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedAlertId, setSelectedAlertId] = useState(null)

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (filters.type && a.type !== filters.type) return false
      if (filters.projectId && a.projectId !== filters.projectId) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (!a.message.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [alerts, filters])

  // Per-type summary counts — computed from the FILTERED set, never hardcoded.
  const typeCounts = useMemo(() => {
    const counts = { total: filteredAlerts.length }
    ALERT_TYPES.forEach((type) => {
      counts[type] = filteredAlerts.filter((a) => a.type === type).length
    })
    return counts
  }, [filteredAlerts])

  const selectedAlert = useMemo(
    () => filteredAlerts.find((a) => a.id === selectedAlertId) || null,
    [filteredAlerts, selectedAlertId],
  )

  const selectedProject = useMemo(() => {
    if (!selectedAlert) return null
    // Reuses the existing project data — same source the dashboard uses.
    return projects.find((p) => p.id === selectedAlert.projectId) || null
  }, [selectedAlert, projects])

  const handleResetFilters = () => setFilters(DEFAULT_FILTERS)

  const hasActiveFilters = Boolean(filters.type || filters.projectId || filters.search)

  const summaryCards = [
    { icon: Bell, label: 'Total Alerts', value: typeCounts.total, accent: 'text-primary', bg: 'bg-primary-50' },
    { icon: AlertTriangle, label: 'Risk Alerts', value: typeCounts.risk, accent: 'text-red-600', bg: 'bg-red-50' },
    { icon: Scale, label: 'Legal Alerts', value: typeCounts.legal, accent: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: Banknote, label: 'Compensation', value: typeCounts.compensation, accent: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: FileCheck, label: 'Approvals', value: typeCounts.approval, accent: 'text-blue-500', bg: 'bg-blue-50' },
  ]

  return (
    <DashboardLayout activeKey="alerts">
      <PageHeader
        title="Alerts"
        subtitle="Review alerts raised across your district's projects and jump straight to the affected project."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-100 bg-white px-3 py-1.5 text-xs shadow-sm">
            <Bell className="h-3.5 w-3.5 text-gray-400" />
            <span className="font-medium text-gray-700">Unread</span>
            <span className="font-semibold text-gray-500">{unreadCount}</span>
          </span>
        }
      />

      {loading ? (
        <Loader label="Loading alerts…" fullPage className="mt-6" />
      ) : error ? (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <ErrorState message="Unable to load alerts." onRetry={refetchAlerts} />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Per-type summary — computed from the filtered set */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {summaryCards.map((card) => (
              <SummaryCard
                key={card.label}
                icon={card.icon}
                value={card.value}
                label={card.label}
                accent={card.accent}
                bg={card.bg}
              />
            ))}
          </div>

          {/* Filter bar — all filters functional */}
          <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex min-w-[150px] flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Type</span>
                <FilterDropdown
                  options={ALERT_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] }))}
                  value={filters.type}
                  onChange={(next) => setFilters((f) => ({ ...f, type: next }))}
                  allLabel="All Types"
                  className="w-full"
                />
              </div>
              <div className="flex min-w-[170px] flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">Project</span>
                <FilterDropdown
                  options={projects.map((p) => ({ value: p.id, label: `${p.id} — ${p.name}` }))}
                  value={filters.projectId}
                  onChange={(next) => setFilters((f) => ({ ...f, projectId: next }))}
                  allLabel="All Projects"
                  className="w-full"
                />
              </div>
              <SearchBar
                placeholder="Search alerts…"
                value={filters.search}
                onChange={(value) => setFilters((f) => ({ ...f, search: value }))}
                className="w-full sm:w-56"
              />
              <div className="ml-auto flex items-center gap-3 pb-0.5">
                <span className="text-xs text-gray-500">
                  {filteredAlerts.length} {filteredAlerts.length === 1 ? 'alert' : 'alerts'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  icon={RotateCcw}
                  onClick={handleResetFilters}
                  disabled={!hasActiveFilters}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </section>

          {/* Alert feed — reuses AlertList/AlertCard; click opens the detail
              modal built on the existing Modal component */}
          <section className="rounded-xl border border-gray-100 bg-white p-2 shadow-sm">
            {filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center">
                <EmptyState
                  icon={BellOff}
                  title="No Alerts Match"
                  message="No alerts match the selected filters."
                />
                <Button variant="outline" size="sm" onClick={handleResetFilters} className="-mt-4 mb-4">
                  Reset Filters
                </Button>
              </div>
            ) : (
              <AlertList
                alerts={filteredAlerts}
                onAlertClick={(alert) => setSelectedAlertId(alert.id)}
                selectedId={selectedAlertId}
              />
            )}
          </section>

          {/* Detail modal — CTA navigates to the EXISTING project route */}
          <AlertDetailModal
            alert={selectedAlert}
            project={selectedProject}
            open={Boolean(selectedAlert)}
            onClose={() => setSelectedAlertId(null)}
          />
        </div>
      )}
    </DashboardLayout>
  )
}
