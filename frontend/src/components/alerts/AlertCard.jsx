import { AlertTriangle, Banknote, ClipboardList, FileCheck, Scale } from 'lucide-react'
import { timeAgo } from '../../utils/dateUtils'

// Shared alert type → icon/color map. Exported so other alert surfaces
// (e.g. the alert detail modal) reuse the exact same visual language.
export const TYPE_META = {
  risk: { icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
  legal: { icon: Scale, color: 'text-purple-500 bg-purple-50' },
  compensation: { icon: Banknote, color: 'text-amber-500 bg-amber-50' },
  approval: { icon: FileCheck, color: 'text-blue-500 bg-blue-50' },
  update: { icon: ClipboardList, color: 'text-green-500 bg-green-50' },
}

/**
 * Single alert row. Renders exactly as before (a plain div) when no onClick
 * is provided — the dashboard's RecentAlerts usage is unaffected. When an
 * onClick IS provided it renders as a full-width button so the row can be
 * clicked to open the alert detail modal.
 */
export default function AlertCard({ alert, onClick, selected = false, className = '' }) {
  const meta = TYPE_META[alert.type] || TYPE_META.update
  const Icon = meta.icon

  const content = (
    <>
      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${meta.color}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs leading-snug text-gray-700">{alert.message}</p>
        <p className="mt-0.5 text-[10px] text-gray-400">{timeAgo(alert.timestamp)}</p>
      </div>
    </>
  )

  const baseClass = `flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-gray-50 ${
    selected ? 'bg-accent-50/60' : ''
  } ${className}`

  if (typeof onClick !== 'function') {
    return <div className={baseClass}>{content}</div>
  }

  return (
    <button type="button" onClick={() => onClick(alert)} className={`w-full cursor-pointer text-left ${baseClass}`}>
      {content}
    </button>
  )
}
