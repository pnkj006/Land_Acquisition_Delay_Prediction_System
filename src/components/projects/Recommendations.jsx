import StatusBadge from '../common/StatusBadge.jsx'
import { PRIORITY_LEVELS } from '../../utils/constants'

const PRIORITY_BADGES = {
  [PRIORITY_LEVELS.HIGH]: 'bg-red-100 text-red-700 border border-red-200',
  [PRIORITY_LEVELS.MEDIUM]: 'bg-amber-100 text-amber-700 border border-amber-200',
  [PRIORITY_LEVELS.LOW]: 'bg-green-100 text-green-700 border border-green-200',
}

export default function Recommendations({ recommendations = [], loading = false }) {
  if (loading) {
    return <p className="py-6 text-center text-xs text-gray-400">Loading recommendations…</p>
  }
  if (!recommendations || recommendations.length === 0) {
    return <p className="py-6 text-center text-xs text-gray-400">No recommended actions for this project.</p>
  }

  return (
    <ol className="flex flex-col gap-3">
      {recommendations.map((rec, index) => (
        <li key={rec.id} className="flex items-start gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-50 text-[10px] font-bold text-accent">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs leading-snug text-gray-700">{rec.title}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_BADGES[rec.priority] || PRIORITY_BADGES[PRIORITY_LEVELS.MEDIUM]}`}
              >
                {rec.priority} Priority
              </span>
              <StatusBadge status={rec.status} className="text-[10px]" />
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
