import AlertList from '../alerts/AlertList.jsx'
import { useAlerts } from '../../hooks/useAlerts'

export default function RecentAlerts({ projectId, maxItems = 4 }) {
  const { alerts, loading, error } = useAlerts({ projectId })

  return <AlertList alerts={alerts} loading={loading} error={error} maxItems={maxItems} />
}
