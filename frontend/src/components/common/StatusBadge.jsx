import { ACTION_STATUS } from '../../utils/constants'

const STATUS_META = {
  [ACTION_STATUS.PENDING]: 'bg-amber-100 text-amber-700 border border-amber-200',
  [ACTION_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-700 border border-blue-200',
  [ACTION_STATUS.DONE]: 'bg-green-100 text-green-700 border border-green-200',
  Done: 'bg-green-100 text-green-700 border border-green-200',
  Pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  'In Progress': 'bg-blue-100 text-blue-700 border border-blue-200',
}

const STAGE_COLORS = {
  Notification: 'bg-purple-100 text-purple-700 border border-purple-200',
  Approval: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
  'Land Acquisition': 'bg-sky-100 text-sky-700 border border-sky-200',
  Compensation: 'bg-amber-100 text-amber-700 border border-amber-200',
  Rehabilitation: 'bg-teal-100 text-teal-700 border border-teal-200',
  Possession: 'bg-green-100 text-green-700 border border-green-200',
}

export default function StatusBadge({ status, className = '' }) {
  const badgeClass = STATUS_META[status] || STAGE_COLORS[status] || 'bg-gray-100 text-gray-600 border border-gray-200'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass} ${className}`}>
      {status}
    </span>
  )
}
