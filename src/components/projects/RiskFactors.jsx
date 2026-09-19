import Loader from '../common/Loader.jsx'
import EmptyState from '../common/EmptyState.jsx'

/**
 * SHAP contribution bars — "feature → contribution to delay risk".
 * Bars and values come straight from the prediction's shapFactors
 * (risk.api); nothing is hardcoded. Strongest contributors are highlighted
 * in red/amber; the value column shows the signed SHAP weight (+0.34 style).
 */
export default function RiskFactors({ factors = [], summary, loading = false }) {
  if (loading) return <Loader label="Computing SHAP explanation…" className="py-8" />
  if (!factors || factors.length === 0) {
    return <EmptyState title="No Explanation Available" message="Risk factor data will appear once the model runs." />
  }

  const maxWeight = Math.max(...factors.map((f) => Math.abs(Number(f.weight) || 0)), 0.01)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2.5">
        {factors.map((factor, index) => {
          const weight = Number(factor.weight) || 0
          const positive = weight >= 0
          // Bars are scaled against the largest contribution so the ranking
          // is easy to read at a glance.
          const width = Math.min(100, (Math.abs(weight) / maxWeight) * 100)
          const barColor = index === 0 ? 'bg-red-500' : index === 1 ? 'bg-amber-400' : 'bg-accent'

          return (
            <div key={factor.factor} className="flex items-center gap-3">
              <p className="w-28 shrink-0 truncate text-right text-[11px] font-medium text-gray-600 sm:w-36" title={factor.factor}>
                {factor.factor}
              </p>
              <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${width}%` }}
                />
              </div>
              <span
                className={`w-10 shrink-0 text-right text-[11px] font-bold tabular-nums ${
                  positive ? 'text-red-600' : 'text-green-700'
                }`}
              >
                {positive ? '+' : ''}
                {weight.toFixed(2)}
              </span>
            </div>
          )
        })}
      </div>
      {summary ? (
        <p className="rounded-lg bg-gray-50 px-3 py-2 text-[11px] leading-snug text-gray-600">
          <span className="font-semibold text-gray-700">In plain terms: </span>
          {summary}
        </p>
      ) : null}
    </div>
  )
}
