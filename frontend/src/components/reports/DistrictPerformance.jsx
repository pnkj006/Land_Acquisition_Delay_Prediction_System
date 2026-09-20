import { MapPin } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import EmptyState from '../common/EmptyState.jsx'

/**
 * District performance — horizontal bar chart of the derived performance index
 * plus a per-district breakdown.
 *
 * `rows` is produced upstream by analyticsUtils from the real project records
 * (the same source the Dashboard / Risk Analysis / My Projects pages read).
 * Nothing is generated or estimated in this component.
 *
 * Performance index definition (kept deliberately simple and transparent):
 *   100 − average delay probability of the district's projects
 * It is NOT an ML score — it is arithmetic over the delay probabilities that
 * already exist on each project record.
 */
export default function DistrictPerformance({ rows = [] }) {
  if (rows.length === 0) {
    return (
      <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800">District Performance</h3>
        <p className="text-[11px] text-gray-400">
          Derived from the delay probability of the projects shown
        </p>
        <EmptyState
          icon={MapPin}
          title="District performance data unavailable."
          message="No projects match the selected filters."
        />
      </section>
    )
  }

  const chartData = rows.map((row) => ({
    district: row.district,
    performance: row.performance,
  }))

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-800">District Performance</h3>
        <p className="text-[11px] text-gray-400">
          Derived index = 100 − average delay probability of the district&apos;s projects
        </p>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              unit="%"
            />
            <YAxis
              type="category"
              dataKey="district"
              width={140}
              tick={{ fontSize: 11, fill: '#475569' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              formatter={(value) => [`${value}%`, 'Performance']}
              contentStyle={{
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                fontSize: 12,
              }}
            />
            <Bar
              dataKey="performance"
              className="fill-accent"
              radius={[0, 4, 4, 0]}
              barSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* District detail — only values that exist in the project data */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-[11px]">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] uppercase tracking-wide text-gray-400">
              <th className="py-2 pr-3 font-semibold">District</th>
              <th className="py-2 pr-3 font-semibold">Projects</th>
              <th className="py-2 pr-3 font-semibold">On Track</th>
              <th className="py-2 pr-3 font-semibold">At Risk</th>
              <th className="py-2 pr-3 font-semibold">High Risk</th>
              <th className="py-2 pr-3 font-semibold">Avg Delay</th>
              <th className="py-2 pr-3 font-semibold">Performance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row) => (
              <tr key={row.district} className="text-gray-700">
                <td className="py-2 pr-3 font-semibold text-gray-800">{row.district}</td>
                <td className="py-2 pr-3">{row.total}</td>
                <td className="py-2 pr-3 text-green-600">{row.onTrack}</td>
                <td className="py-2 pr-3 text-amber-600">{row.atRisk}</td>
                <td className="py-2 pr-3 text-red-600">{row.highRisk}</td>
                <td className="py-2 pr-3">{row.averageDelay} days</td>
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${row.performance}%` }}
                      />
                    </div>
                    <span className="font-semibold text-gray-600">{row.performance}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}