import { AlertTriangle, Banknote, ClipboardList, FileCheck, Scale } from 'lucide-react'
import { timeAgo } from '../../utils/dateUtils'

const TYPE_META = {
  risk: { icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
  legal: { icon: Scale, color: 'text-purple-500 bg-purple-50' },
  compensation: { icon: Banknote, color: 'text-amber-500 bg-amber-50' },
  approval: { icon: FileCheck, color: 'text-blue-500 bg-blue-50' },
  update: { icon: ClipboardList, color: 'text-green-500 bg-green-50' },
}

export default function AlertCard({ alert }) {
  const meta = TYPE_META[alert.type] || TYPE_META.update
  const Icon = meta.icon

  return (
    <div className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-gray-50">
      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${meta.color}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs leading-snug text-gray-700">{alert.message}</p>
        <p className="mt-0.5 text-[10px] text-gray-400">{timeAgo(alert.timestamp)}</p>
      </div>
    </div>
  )
}
