import { useCallback, useEffect, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import EmptyState from '../common/EmptyState.jsx'
import ErrorState from '../common/ErrorState.jsx'
import Loader from '../common/Loader.jsx'
import { getRiskHistory } from '../../api/risk.api'

// Same accent blue as the design system (tailwind accent DEFAULT).
const ACCENT = '#2563eb'

const TOOLTIP_STYLE = {
  borderRadius: '8px',
  border: '1px solid #f3f4f6',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  fontSize: '12px',
}

/**
 * Risk trend for the SELECTED project, using the existing getRiskHistory
 * endpoint (risk.api). The backend only tracks history per project, so no
 * portfolio-level aggregate trend is fabricated here — the chart always
 * reflects the real per-project series returned by the API. When the API
 * returns no history the card shows the proper empty state.
 */
export default function RiskTrendChart({ projectId }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadHistory = useCallback(() => {
    if (!projectId) {
      setHistory([])
      return undefined
    }
    let isMounted = true
    setLoading(true)
    setError(null)
    getRiskHistory(projectId)
      .then((res) => {
        if (isMounted) setHistory(res.data.history || [])
      })
      .catch((err) => {
        if (isMounted) setError(err)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [projectId])

  useEffect(() => loadHistory(), [loadHistory])

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Risk Trend</h3>
          <p className="text-[11px] text-gray-400">Monthly delay probability for the selected project</p>
        </div>
        <span className="hidden rounded-full bg-gray-50 px-2.5 py-1 text-[10px] font-semibold text-gray-500 sm:inline">
          Per-project history
        </span>
      </div>

      {!projectId ? (
        <EmptyState
          title="No Project Selected"
          message="Select a project from the table to view its risk trend."
        />
      ) : loading ? (
        <Loader label="Loading risk trend…" className="py-16" />
      ) : error ? (
        <ErrorState message="Unable to load risk trend." onRetry={loadHistory} />
      ) : history.length === 0 ? (
        <EmptyState title="No Historical Data" message="No historical risk data available." />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={216}>
            <LineChart data={history} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                domain={[0, 100]}
                width={42}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value) => [`${value}%`, 'Delay Probability']}
                cursor={{ stroke: '#e5e7eb' }}
              />
              <Line
                type="monotone"
                dataKey="probability"
                name="Delay Probability"
                stroke={ACCENT}
                strokeWidth={2}
                dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center justify-center gap-1.5 border-t border-gray-50 pt-2.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ACCENT }} />
            <span className="text-[11px] text-gray-500">Delay Probability (%)</span>
          </div>
        </>
      )}
    </section>
  )
}
