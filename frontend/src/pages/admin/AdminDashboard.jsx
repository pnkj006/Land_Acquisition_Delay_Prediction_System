import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FolderKanban,
  ListTodo,
  MapPin,
  Users,
} from 'lucide-react'

import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout.jsx'
import PageHeader from '../../components/layout/PageHeader.jsx'
import SummaryCard from '../../components/dashboard/SummaryCard.jsx'
import RiskMap from '../../components/map/RiskMap.jsx'
import RiskDistributionChart from '../../components/risk/RiskDistributionChart.jsx'
import AdminStageChart from '../../components/admin/AdminStageChart.jsx'
import AdminHighRiskTable from '../../components/admin/AdminHighRiskTable.jsx'
import AdminDistrictOverview from '../../components/admin/AdminDistrictOverview.jsx'
import AdminManagerActivity from '../../components/admin/AdminManagerActivity.jsx'
import AdminQuickActions from '../../components/admin/AdminQuickActions.jsx'
import CreateProjectModal from '../../components/admin/createProjectModal.jsx'
import ImportProjectsModal from '../../components/admin/ImportProjectModal.jsx'

import AlertCard, { TYPE_META } from '../../components/alerts/AlertCard.jsx'
import AlertDetailModal from '../../components/alerts/AlertDetailModal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import Loader from '../../components/common/Loader.jsx'

import { useProjects } from '../../hooks/useProjects.js'
import { useAlerts } from '../../hooks/useAlerts.js'
import { useFieldUpdates } from '../../hooks/useFieldUpdates.js'
import { getAllRecommendations } from '../../api/recommendations.api'

import {
  computeDistrictRows,
  computeMetrics,
} from '../../utils/analyticsUtils'

import {
  ACTION_STATUS,
  PROJECT_STAGES,
  RISK_LEVELS,
} from '../../utils/constants'

import { timeAgo } from '../../utils/dateUtils'
import { formatDate } from '../../utils/formatters'

/**
 * System-wide Admin Dashboard.
 *
 * Admin responsibilities:
 * - View system-wide project information
 * - Create projects manually
 * - Import projects from CSV
 * - Review project/risk information
 * - Review alerts and field activity
 *
 * ML prediction is NOT triggered during project creation/import.
 * ML prediction will happen later in the Project Manager workflow
 * after a project has been assigned to a Project Manager.
 */
export default function AdminDashboard() {
  const navigate = useNavigate()

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------

  const {
    projects,
    loading: projectsLoading,
  } = useProjects({
    pageSize: 100,
  })

  const {
    alerts,
    loading: alertsLoading,
  } = useAlerts()

  const {
    updates: fieldUpdates,
    loading: fieldLoading,
  } = useFieldUpdates()

  // ---------------------------------------------------------------------------
  // Local UI state
  // ---------------------------------------------------------------------------

  const [pendingRecs, setPendingRecs] = useState(null)
  const [selectedAlert, setSelectedAlert] = useState(null)

  const [showCreateProject, setShowCreateProject] = useState(false)
  const [showImportProjects, setShowImportProjects] = useState(false)

  // ---------------------------------------------------------------------------
  // Pending recommendations
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let mounted = true

    getAllRecommendations()
      .then((res) => {
        if (!mounted) return

        const list = Array.isArray(res?.data)
          ? res.data
          : []

        const pending = list.filter(
          (recommendation) =>
            recommendation.status === ACTION_STATUS.PENDING,
        ).length

        setPendingRecs(pending)
      })
      .catch(() => {
        if (mounted) {
          setPendingRecs(null)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Metrics
  // ---------------------------------------------------------------------------

  const metrics = useMemo(
    () => computeMetrics(projects),
    [projects],
  )

  const districtRows = useMemo(
    () => computeDistrictRows(projects),
    [projects],
  )

  // ---------------------------------------------------------------------------
  // Stage counts
  // ---------------------------------------------------------------------------

  const stageCounts = useMemo(() => {
    const counts = new Map()

    PROJECT_STAGES.forEach((stage) => {
      counts.set(stage, 0)
    })

    projects.forEach((project) => {
      if (!project.stage) return

      counts.set(
        project.stage,
        (counts.get(project.stage) || 0) + 1,
      )
    })

    return [...counts.entries()].map(
      ([stage, count]) => ({
        stage,
        count,
      }),
    )
  }, [projects])

  // ---------------------------------------------------------------------------
  // Risk statistics
  // ---------------------------------------------------------------------------

  const riskStats = useMemo(
    () => ({
      total: metrics.total,
      high: metrics.high,
      medium: metrics.medium,
      low: metrics.low,
    }),
    [metrics],
  )

  // ---------------------------------------------------------------------------
  // Manager activity
  // ---------------------------------------------------------------------------

  const managerRows = useMemo(() => {
    const hasManagerField = projects.some(
      (project) =>
        project.projectManager ||
        project.manager,
    )

    if (!hasManagerField) {
      return []
    }

    const byManager = new Map()

    projects.forEach((project) => {
      const name =
        project.projectManager ||
        project.manager

      if (!name) return

      if (!byManager.has(name)) {
        byManager.set(name, {
          manager: name,
          assignedProjects: 0,
          highRisk: 0,
          pendingActions: null,
          lastFieldUpdate: null,
        })
      }

      const row = byManager.get(name)

      row.assignedProjects += 1

      if (
        project.riskLevel === RISK_LEVELS.HIGH
      ) {
        row.highRisk += 1
      }
    })

    return [...byManager.values()]
  }, [projects])

  // ---------------------------------------------------------------------------
  // Pending actions
  // ---------------------------------------------------------------------------

  const pendingActionsDisplay =
    pendingRecs != null
      ? pendingRecs
      : alerts.length || null

  // ---------------------------------------------------------------------------
  // Recent activity
  // ---------------------------------------------------------------------------

  const recentField = fieldUpdates.slice(0, 5)
  const recentAlerts = alerts.slice(0, 5)

  // ---------------------------------------------------------------------------
  // Dashboard refresh
  // ---------------------------------------------------------------------------

  const refreshDashboard = () => {
    window.location.reload()
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <AdminDashboardLayout activeKey="dashboard">

      {/* ------------------------------------------------------------------ */}
      {/* Modals                                                             */}
      {/* ------------------------------------------------------------------ */}

      <CreateProjectModal
        open={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onCreated={refreshDashboard}
      />

      <ImportProjectsModal
        open={showImportProjects}
        onClose={() => setShowImportProjects(false)}
        onImported={refreshDashboard}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Page Header                                                        */}
      {/* ------------------------------------------------------------------ */}

      <PageHeader
        title="Admin Dashboard"
        subtitle="System-wide overview of land acquisition projects, risks, progress and field activity."
      />

      {/* ------------------------------------------------------------------ */}
      {/* KPI Cards                                                          */}
      {/* ------------------------------------------------------------------ */}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">

        <SummaryCard
          icon={FolderKanban}
          value={
            projectsLoading
              ? '—'
              : metrics.total
          }
          label="Total Projects"
        />

        <SummaryCard
          icon={AlertTriangle}
          value={
            projectsLoading
              ? '—'
              : metrics.high
          }
          label="High Risk"
          accent="text-red-600"
          bg="bg-red-50"
        />

        <SummaryCard
          icon={AlertCircle}
          value={
            projectsLoading
              ? '—'
              : metrics.medium
          }
          label="Medium Risk"
          accent="text-amber-500"
          bg="bg-amber-50"
        />

        <SummaryCard
          icon={CheckCircle2}
          value={
            projectsLoading
              ? '—'
              : metrics.low
          }
          label="Low Risk"
          accent="text-green-600"
          bg="bg-green-50"
        />

        <SummaryCard
          icon={Users}
          value="N/A"
          label="Active Project Managers"
        />

        <SummaryCard
          icon={ListTodo}
          value={
            pendingActionsDisplay == null
              ? 'N/A'
              : pendingActionsDisplay
          }
          label="Pending Actions"
        />

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Charts                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">

        <AdminStageChart
          stageCounts={stageCounts}
        />

        <RiskDistributionChart
          stats={riskStats}
          title="Risk Overview"
        />

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* System Project Map                                                 */}
      {/* ------------------------------------------------------------------ */}

      <section className="mb-5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">

          <div className="flex items-center gap-2.5">

            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <MapPin className="h-4 w-4" />
            </span>

            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                System Project Map
              </h3>

              <p className="text-[11px] text-gray-400">
                Project locations from existing map data
              </p>
            </div>

          </div>

        </div>

        <RiskMap
          onViewDetails={(marker) =>
            navigate(
              `/admin/projects/${marker.id}`,
            )
          }
          popupActionLabel="View Project →"
        />

      </section>

      {/* ------------------------------------------------------------------ */}
      {/* High Risk Projects                                                 */}
      {/* ------------------------------------------------------------------ */}

      <div className="mb-5">

        {projectsLoading ? (
          <Loader label="Loading projects…" />
        ) : (
          <AdminHighRiskTable
            projects={projects}
          />
        )}

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* District + Manager Activity                                        */}
      {/* ------------------------------------------------------------------ */}

      <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-2">

        <AdminDistrictOverview
          rows={districtRows}
        />

        <AdminManagerActivity
          rows={managerRows}
        />

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Alerts + Field Updates + Quick Actions                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* -------------------------------------------------------------- */}
        {/* Recent Alerts                                                  */}
        {/* -------------------------------------------------------------- */}

        <section
          id="recent-alerts"
          className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm lg:col-span-1"
        >

          <div className="mb-3 flex items-center justify-between gap-2">

            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                Recent System Alerts
              </h3>

              <p className="text-[11px] text-gray-400">
                Latest system alerts
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate('/admin/alerts')
              }
              className="text-[11px] font-semibold text-accent hover:text-accent-dark"
            >
              View all
            </button>

          </div>

          {alertsLoading ? (
            <Loader label="Loading alerts…" />
          ) : recentAlerts.length === 0 ? (
            <EmptyState
              title="No Alerts"
              message="No alert records are available."
            />
          ) : (
            <ul className="flex flex-col gap-1">

              {recentAlerts.map((alert) => {

                const severity =
                  TYPE_META[alert.type]?.icon
                    ? alert.type
                    : 'update'

                return (
                  <li
                    key={alert.id}
                    className="rounded-lg border border-transparent hover:border-gray-100"
                  >

                    <div className="px-1 pt-1">

                      <p className="px-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">

                        Severity: {severity}

                        {alert.projectId
                          ? ` · Project: ${alert.projectId}`
                          : ''}

                        {' · '}

                        {timeAgo(
                          alert.timestamp,
                        )}

                      </p>

                    </div>

                    <AlertCard
                      alert={alert}
                      onClick={setSelectedAlert}
                    />

                  </li>
                )
              })}

            </ul>
          )}

        </section>

        {/* -------------------------------------------------------------- */}
        {/* Recent Field Updates                                           */}
        {/* -------------------------------------------------------------- */}

        <section
          id="field-updates"
          className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm lg:col-span-1"
        >

          <div className="mb-3 flex items-center justify-between gap-2">

            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                Recent Field Updates
              </h3>

              <p className="text-[11px] text-gray-400">
                Submitted field activity
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  '/admin/field-updates',
                )
              }
              className="text-[11px] font-semibold text-accent hover:text-accent-dark"
            >
              View all
            </button>

          </div>

          {fieldLoading ? (
            <Loader label="Loading updates…" />
          ) : recentField.length === 0 ? (
            <EmptyState
              title="No Field Updates"
              message="No field updates have been submitted in this session."
            />
          ) : (
            <div className="overflow-x-auto scrollbar-thin">

              <table className="min-w-[360px] w-full text-left text-xs">

                <thead>

                  <tr className="border-b border-gray-100 text-[10px] uppercase tracking-wide text-gray-400">

                    <th className="px-2 py-2 font-semibold">
                      Project
                    </th>

                    <th className="px-2 py-2 font-semibold">
                      District
                    </th>

                    <th className="px-2 py-2 font-semibold">
                      Update Type
                    </th>

                    <th className="px-2 py-2 font-semibold">
                      Progress
                    </th>

                    <th className="px-2 py-2 font-semibold">
                      Date
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {recentField.map((update) => {

                    const project = projects.find(
                      (p) =>
                        p.id === update.projectId,
                    )

                    return (
                      <tr
                        key={update.id}
                        className="border-b border-gray-50 text-gray-700 last:border-0"
                      >

                        <td className="max-w-[120px] truncate px-2 py-2">
                          {update.projectName ||
                            update.projectId ||
                            'N/A'}
                        </td>

                        <td className="px-2 py-2">
                          {project?.district ||
                            'N/A'}
                        </td>

                        <td className="px-2 py-2">
                          {update.updateType ||
                            'N/A'}
                        </td>

                        <td className="px-2 py-2 tabular-nums">
                          {update.progress != null
                            ? `${update.progress}%`
                            : 'N/A'}
                        </td>

                        <td className="whitespace-nowrap px-2 py-2">
                          {update.submittedAt
                            ? formatDate(
                                update.submittedAt,
                              )
                            : 'N/A'}
                        </td>

                      </tr>
                    )
                  })}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* -------------------------------------------------------------- */}
        {/* Quick Actions                                                   */}
        {/* -------------------------------------------------------------- */}

        <AdminQuickActions
          onCreateProject={() =>
            setShowCreateProject(true)
          }
          onImportProjects={() =>
            setShowImportProjects(true)
          }
        />

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* System Activity                                                   */}
      {/* ------------------------------------------------------------------ */}

      <section
        id="system-activity"
        className="mb-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
      >

        <div className="mb-2">

          <h3 className="text-sm font-semibold text-gray-800">
            System Activity
          </h3>

          <p className="text-[11px] text-gray-400">
            Derived from alerts and field updates currently loaded
          </p>

        </div>

        {alerts.length === 0 &&
        fieldUpdates.length === 0 ? (
          <EmptyState
            title="No System Activity"
            message="No recent alerts or field updates are available to summarise."
          />
        ) : (
          <ul className="space-y-2 text-xs text-gray-600">

            <li>
              Alerts loaded:{' '}
              <span className="font-semibold text-gray-800">
                {alerts.length}
              </span>
            </li>

            <li>
              Field updates this session:{' '}
              <span className="font-semibold text-gray-800">
                {fieldUpdates.length}
              </span>
            </li>

            {pendingRecs != null ? (
              <li>
                Pending recommendations:{' '}
                <span className="font-semibold text-gray-800">
                  {pendingRecs}
                </span>
              </li>
            ) : null}

          </ul>
        )}

      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Alert Details Modal                                                */}
      {/* ------------------------------------------------------------------ */}

      <AlertDetailModal
        alert={selectedAlert}
        project={
          selectedAlert
            ? projects.find(
                (project) =>
                  project.id ===
                  selectedAlert.projectId,
              )
            : null
        }
        open={Boolean(selectedAlert)}
        onClose={() =>
          setSelectedAlert(null)
        }
      />

    </AdminDashboardLayout>
  )
}