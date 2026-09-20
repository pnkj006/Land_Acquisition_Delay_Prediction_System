import { useNavigate } from 'react-router-dom'
import RiskBadge from '../common/RiskBadge.jsx'
import EmptyState from '../common/EmptyState.jsx'
import { RISK_LEVELS } from '../../utils/constants'

/**
 * High-risk projects table. Project Manager column shows N/A when the
 * project record has no manager assignment field.
 */
export default function AdminHighRiskTable({ projects = [] }) {
  const navigate = useNavigate()
  const rows = projects.filter((p) => p.riskLevel === RISK_LEVELS.HIGH)

  return (
    <section id="high-risk-projects" className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">High-Risk Projects</h3>
          <p className="text-[11px] text-gray-400">Projects currently flagged as high risk</p>
        </div>
        {rows.length > 0 ? (
          <button
            type="button"
            onClick={() => navigate('/admin/risk-analysis')}
            className="text-[11px] font-semibold text-accent hover:text-accent-dark"
          >
            View All →
          </button>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No High-Risk Projects" message="No projects are currently marked high risk." />
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="min-w-[720px] w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] uppercase tracking-wide text-gray-400">
                <th className="px-2 py-2 font-semibold">Project ID</th>
                <th className="px-2 py-2 font-semibold">Project Name</th>
                <th className="px-2 py-2 font-semibold">District</th>
                <th className="px-2 py-2 font-semibold">Project Manager</th>
                <th className="px-2 py-2 font-semibold">Risk Level</th>
                <th className="px-2 py-2 font-semibold">Delay Probability</th>
                <th className="px-2 py-2 font-semibold">Expected Delay</th>
                <th className="px-2 py-2 font-semibold">Current Stage</th>
                <th className="px-2 py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((project) => (
                <tr key={project.id} className="border-b border-gray-50 text-gray-700 last:border-0">
                  <td className="px-2 py-2.5 font-semibold text-gray-900">{project.id}</td>
                  <td className="max-w-[160px] truncate px-2 py-2.5">{project.name}</td>
                  <td className="px-2 py-2.5">{project.district || 'N/A'}</td>
                  <td className="px-2 py-2.5 text-gray-400">{project.projectManager || project.manager || 'N/A'}</td>
                  <td className="px-2 py-2.5">
                    <RiskBadge level={project.riskLevel} />
                  </td>
                  <td className="px-2 py-2.5 tabular-nums">
                    {project.delayProbability != null ? `${project.delayProbability}%` : 'N/A'}
                  </td>
                  <td className="px-2 py-2.5 tabular-nums">
                    {project.expectedDelayDays != null ? `${project.expectedDelayDays} days` : 'N/A'}
                  </td>
                  <td className="px-2 py-2.5">{project.stage || 'N/A'}</td>
                  <td className="px-2 py-2.5">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/projects/${project.id}`)}
                      className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-accent transition-colors hover:border-accent hover:bg-accent-50"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
