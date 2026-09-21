import EmptyState from '../common/EmptyState.jsx'

/**
 * District overview from computeDistrictRows — never invents districts.
 */
export default function AdminDistrictOverview({ rows = [] }) {
  return (
    <section id="district-overview" className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-800">District Performance</h3>
        <p className="text-[11px] text-gray-400">Aggregated from loaded project records</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No District Data" message="District statistics are not available for the current dataset." />
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="min-w-[520px] w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] uppercase tracking-wide text-gray-400">
                <th className="px-2 py-2 font-semibold">District</th>
                <th className="px-2 py-2 font-semibold">Projects</th>
                <th className="px-2 py-2 font-semibold">High Risk</th>
                <th className="px-2 py-2 font-semibold">Delayed</th>
                <th className="px-2 py-2 font-semibold">Avg. Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.district} className="border-b border-gray-50 text-gray-700 last:border-0">
                  <td className="px-2 py-2.5 font-medium text-gray-900">{row.district}</td>
                  <td className="px-2 py-2.5 tabular-nums">{row.total}</td>
                  <td className="px-2 py-2.5 tabular-nums text-red-600">{row.highRisk}</td>
                  <td className="px-2 py-2.5 tabular-nums">{row.atRisk != null ? row.atRisk : 'N/A'}</td>
                  <td className="px-2 py-2.5 tabular-nums">
                    {row.avgRiskScore != null ? `${row.avgRiskScore.toFixed(1)}%` : 'N/A'}
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
