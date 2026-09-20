import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import EmptyState from '../common/EmptyState.jsx'
import { RISK_LEVELS } from '../../utils/constants'
import { RISK_META } from '../../utils/riskUtils'

const TOOLTIP_STYLE = {
  borderRadius: '8px',
  border: '1px solid #f3f4f6',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  fontSize: '12px',
}

const LEVELS = [RISK_LEVELS.HIGH, RISK_LEVELS.MEDIUM, RISK_LEVELS.LOW]

/**
 * Donut chart of the filtered portfolio split by risk level. Counts come from
 * the same filtered project list that feeds the summary cards; colors come
 * from the shared RISK_META palette (High = red, Medium = amber, Low = green)
 * — the same colors used by risk badges and the map markers.
 */
export default function RiskDistributionChart({ stats, title = 'Risk Distribution', subtitle = 'Filtered projects by predicted risk level' }) {
  const total = stats.total
  const data = LEVELS.map((level) => ({
    level,
    name: RISK_META[level].shortLabel,
    value: stats[level.toLowerCase()] || 0,
  }))

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <p className="text-[11px] text-gray-400">{subtitle}</p>
      </div>

      {total === 0 ? (
        <EmptyState title="No Data" message="No projects match the selected filters." />
      ) : (
        <>
          <div className="relative">
            <ResponsiveContainer width="100%" height={216}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={86}
                  paddingAngle={3}
                  cornerRadius={4}
                  stroke="none"
                >
                  {data.map((entry) => (
                    <Cell key={entry.level} fill={RISK_META[entry.level].color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value, name) => [`${value} ${value === 1 ? 'project' : 'projects'}`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label — total of the filtered set */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[26px] font-bold leading-none tabular-nums text-gray-900">{total}</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">Projects</p>
            </div>
          </div>

          {/* Legend — same risk colors as badges and map markers */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-gray-50 pt-3">
            {data.map((entry) => (
              <div key={entry.level} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RISK_META[entry.level].color }} />
                <span className="text-xs font-medium text-gray-600">{entry.name}</span>
                <span className="text-xs font-semibold tabular-nums text-gray-800">{entry.value}</span>
                <span className="text-[10px] text-gray-400">({Math.round((entry.value / total) * 100)}%)</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
