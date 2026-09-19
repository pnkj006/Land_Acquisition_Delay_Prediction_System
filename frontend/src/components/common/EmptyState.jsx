import { Inbox } from 'lucide-react'

export default function EmptyState({ title = 'No Data', message, icon: Icon = Inbox, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 py-10 text-center ${className}`}>
      <div className="rounded-full bg-gray-100 p-3 text-gray-400">
        <Icon className="h-6 w-6" />
      </div>
      <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
      {message ? <p className="max-w-xs text-xs text-gray-500">{message}</p> : null}
    </div>
  )
}
