import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts'
import EmptyState from '../common/EmptyState.jsx'

const TOOLTIP_STYLE = {
  borderRadius: '8px',
  border: '1px solid #f3f4f6',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  fontSize: '12px',
}

const BAR_COLORS = ['#1a5e3f', '#2563eb', '#0d9488', '#d97706', '#7c3aed', '#64748b']

/**
 * Project distribution by acquisition stage — counts derived from loaded projects only.
 */
export default function AdminStageChart({ stageCounts = [] }) {
  const data = stageCounts.filter((row) => row.count > 0)

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Project Status Overview</h3>
        <p className="text-[11px] text-gray-400">Distribution by current project stage</p>
      </div>

      {data.length === 0 ? (
        <EmptyState title="No Stage Data" message="No projects available to chart by stage." />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#6b7280' }} interval={0} angle={-20} textAnchor="end" height={56} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${value} project${value === 1 ? '' : 's'}`, 'Count']} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={42}>
              {data.map((entry, index) => (
                <Cell key={entry.stage} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  )
}
