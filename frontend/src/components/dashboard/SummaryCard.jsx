import { TrendingDown, TrendingUp } from 'lucide-react'
import { formatNumber } from '../../utils/formatters'

/**
 * KPI card for the dashboard summary row.
 *
 * `trend` is optional: only pass it when the data source actually provides a
 * trend signal ({ direction: 'up' | 'down', value: '12%' }). When no trend
 * data exists the indicator is simply omitted — no trend is ever invented.
 */
export default function SummaryCard({
  icon: Icon,
  value,
  label,
  accent = 'text-primary',
  bg = 'bg-primary-50',
  suffix = '',
  trend = null,
  compactValue = false,
  className = '',
}) {
  return (
    <div
      className={`flex h-full w-full flex-col gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg} ${accent}`}>
          {Icon ? <Icon className="h-[18px] w-[18px]" /> : null}
        </div>
        {trend ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              trend.direction === 'down' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
            }`}
          >
            {trend.direction === 'down' ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <TrendingUp className="h-3 w-3" />
            )}
            {trend.value}
          </span>
        ) : null}
      </div>
      {/* compactValue: for long text values (e.g. a full timestamp) — renders
          smaller so nothing truncates, while keeping the card grid aligned. */}
      <p
        className={`mt-0.5 font-bold leading-tight text-gray-900 ${
          compactValue
            ? 'break-words text-sm'
            : 'truncate text-[26px] leading-none tabular-nums'
        }`}
      >
        {typeof value === 'number' ? formatNumber(value) : value}
        {suffix ? <span className="ml-1 text-sm font-semibold text-gray-500">{suffix}</span> : null}
      </p>
      <p className="truncate text-xs font-medium text-gray-500">{label}</p>
    </div>
  )
}
