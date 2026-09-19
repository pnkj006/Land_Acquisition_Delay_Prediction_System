import { RISK_LEVELS } from '../../utils/constants'
import { getRiskMeta } from '../../utils/riskUtils'

export default function RiskBadge({ level, className = '' }) {
  const meta = getRiskMeta(level)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.badgeClass} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.shortLabel}
    </span>
  )
}
