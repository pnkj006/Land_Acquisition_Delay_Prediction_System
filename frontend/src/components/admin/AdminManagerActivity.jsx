import EmptyState from '../common/EmptyState.jsx'

/**
 * Project manager activity. Renders N/A empty state when manager assignment
 * data is not present on project records.
 */
export default function AdminManagerActivity({ rows = [] }) {
  return (
    <section id="manager-activity" className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Project Manager Activity</h3>
        <p className="text-[11px] text-gray-400">Manager assignments from available project data</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No Manager Data"
          message="Project manager assignments are not available in the current dataset."
        />
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="min-w-[560px] w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] uppercase tracking-wide text-gray-400">
                <th className="px-2 py-2 font-semibold">Manager</th>
                <th className="px-2 py-2 font-semibold">Assigned Projects</th>
                <th className="px-2 py-2 font-semibold">High Risk</th>
                <th className="px-2 py-2 font-semibold">Pending Actions</th>
                <th className="px-2 py-2 font-semibold">Last Field Update</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.manager} className="border-b border-gray-50 text-gray-700 last:border-0">
                  <td className="px-2 py-2.5 font-medium text-gray-900">{row.manager}</td>
                  <td className="px-2 py-2.5 tabular-nums">{row.assignedProjects ?? 'N/A'}</td>
                  <td className="px-2 py-2.5 tabular-nums">{row.highRisk ?? 'N/A'}</td>
                  <td className="px-2 py-2.5 tabular-nums">{row.pendingActions ?? 'N/A'}</td>
                  <td className="px-2 py-2.5">{row.lastFieldUpdate || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
