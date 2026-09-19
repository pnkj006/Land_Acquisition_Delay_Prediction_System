import { AlertTriangle } from 'lucide-react'
import RiskBadge from '../common/RiskBadge.jsx'
import { getRiskMeta } from '../../utils/riskUtils'
import { formatDays } from '../../utils/formatters'
import { RISK_LEVELS } from '../../utils/constants'

/**
 * Prominent AI risk prediction card. Renders the prediction values returned
 * by getRiskPrediction (risk.api) — delay probability, expected delay, risk
 * level and an attention status derived from the risk level. No values are
 * invented here; when there is no prediction the parent shows a loader.
 */
const ATTENTION_TEXT = {
  [RISK_LEVELS.HIGH]: 'Immediate attention required',
  [RISK_LEVELS.MEDIUM]: 'Needs monitoring — review blockers regularly',
  [RISK_LEVELS.LOW]: 'On track — routine review only',
}

export default function RiskGauge({ probability = 0, riskLevel, expectedDelayDays, warningMessage }) {
  const pct = Math.max(0, Math.min(100, Number(probability) || 0))
  const meta = getRiskMeta(riskLevel)
  const attention = ATTENTION_TEXT[riskLevel] || ATTENTION_TEXT[RISK_LEVELS.MEDIUM]

  return (
    <div className="flex flex-col gap-3">
      {/* Hero prediction */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl px-4 py-4"
        style={{ backgroundColor: `${meta.color}14` }}
      >
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Delay Probability</p>
          <p className="text-[40px] font-bold leading-none tabular-nums" style={{ color: meta.color }}>
            {pct}%
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Expected Delay</p>
            <p className="text-lg font-bold leading-tight tabular-nums text-gray-900">{formatDays(expectedDelayDays)}</p>
          </div>
          <RiskBadge level={riskLevel || RISK_LEVELS.MEDIUM} />
        </div>
      </div>

      {/* Attention status */}
      <div className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-semibold ${meta.badgeClass}`}>
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span>{attention}</span>
      </div>

      {warningMessage ? (
        <div className="flex w-full items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span>{warningMessage}</span>
        </div>
      ) : null}
    </div>
  )
}
