import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { AlertCircle, Info } from 'lucide-react'
import EmptyState from '../common/EmptyState'

/**
 * Major delay drivers.
 *
 * The only real driver data in the system is the SHAP feature contribution set
 * returned by the risk API for an individual project. This component renders
 * those weights (normalised to a share) and NEVER invents portfolio-level
 * percentages. When no SHAP data is available it shows an explicit
 * "unavailable" state, as required.
 */
const DRIVER_COLORS = ['#dc2626', '#f59e0b', '#2563eb', '#0d9488', '#7c3aed', '#64748b']

export default function DelayDrivers({ drivers = [], scopeLabel, loading = false }) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Major Delay Drivers</h3>
          <p className="text-[11px] text-gray-400">
            {scopeLabel
              ? `Feature contributions (SHAP) for ${scopeLabel}`
              : 'Feature contributions (SHAP) from the risk model'}
          </p>
        </div>
        {drivers.length > 0 ? (
          <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
            Model output
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-xs text-gray-400">
          Loading model explanation…
        </div>
      ) : drivers.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="Delay cause analytics are currently unavailable."
          message="No SHAP explanation is available for the current selection, so no driver breakdown can be shown. Percentages are never estimated."
        />
      ) : (
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={drivers}
                  dataKey="weight"
                  nameKey="feature"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={2}
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {drivers.map((d, i) => (
                    <Cell key={d.feature} fill={DRIVER_COLORS[i % DRIVER_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [Number(value).toFixed(2), name]}
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="flex flex-col gap-2">
            {drivers.map((d, i) => (
              <li key={d.feature} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: DRIVER_COLORS[i % DRIVER_COLORS.length] }}
                    />
                    <span className="truncate font-medium text-gray-700" title={d.feature}>
                      {d.feature}
                    </span>
                  </span>
                  <span className="ml-2 shrink-0 font-semibold text-gray-500">
                    {d.share}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(d.share, 100)}%`,
                      backgroundColor: DRIVER_COLORS[i % DRIVER_COLORS.length],
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">
                  Weight {d.weight.toFixed(2)} · normalised share of total |contribution|
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {drivers.length > 0 ? (
        <p className="mt-3 flex items-start gap-1.5 border-t border-gray-50 pt-2 text-[10px] text-gray-400">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          Shares are computed only from the contribution weights returned by the risk
          service. They are relative, not absolute delay reductions.
        </p>
      ) : null}
    </section>
  )
}