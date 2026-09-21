import StatusBadge from '../common/StatusBadge.jsx'
import RiskBadge from '../common/RiskBadge.jsx'
import { formatNumber } from '../../utils/formatters'

// Rendered inside a LeafletPopup for each project marker on RiskMap.
// Leaflet itself manages opening/closing the popup, so no onClose is needed.
export default function MapPopup({ marker, onViewDetails, actionLabel = 'View Details' }) {
  return (
    <div className="w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-xs font-bold leading-snug text-gray-800">{marker.name}</p>
        <span className="shrink-0 text-[10px] font-semibold text-gray-400">{marker.id}</span>
      </div>
      <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
        <RiskBadge level={marker.riskLevel} />
        <StatusBadge status={marker.stage} />
      </div>
      <div className="mb-3 space-y-1 text-[11px] text-gray-600">
        <p>
          District: <span className="font-semibold text-gray-800">{marker.district || 'N/A'}</span>
        </p>
        <p>
          Delay Probability: <span className="font-semibold text-gray-800">{marker.delayProbability}%</span>
        </p>
        <p>
          Current Stage: <span className="font-semibold text-gray-800">{marker.stage || 'N/A'}</span>
        </p>
        <p>
          Risk Score: <span className="font-semibold text-gray-800">{marker.riskScore != null ? `${marker.riskScore.toFixed(1)}%` : '—'}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={onViewDetails}
        className="w-full rounded-lg bg-accent px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-accent-dark"
      >
        {actionLabel}
      </button>
    </div>
  )
}
