import AlertCard from './AlertCard.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Loader from '../common/Loader.jsx'
import ErrorState from '../common/ErrorState.jsx'
import { BellOff } from 'lucide-react'

export default function AlertList({ alerts, loading = false, error = null, maxItems, className = '' }) {
  if (loading) return <Loader label="Loading alerts…" className="py-6" />
  if (error) return <ErrorState message="Failed to load alerts." className="py-6" />
  if (!alerts || alerts.length === 0) {
    return <EmptyState icon={BellOff} title="No Alerts" message="You're all caught up." />
  }

  const visible = maxItems ? alerts.slice(0, maxItems) : alerts

  return (
    <div className={`flex flex-col divide-y divide-gray-50 ${className}`}>
      {visible.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  )
}
