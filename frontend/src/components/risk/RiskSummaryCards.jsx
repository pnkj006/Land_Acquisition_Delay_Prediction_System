import { AlertCircle, AlertTriangle, CalendarClock, CheckCircle2, FolderKanban } from 'lucide-react'
import SummaryCard from '../dashboard/SummaryCard.jsx'

/**
 * Risk summary KPIs for the Risk Analysis page. All values are computed from
 * the currently filtered project list (existing projects API data) — nothing
 * is hardcoded. Uses the same SummaryCard and accent colors as the dashboard
 * so the page stays visually consistent.
 */
export default function RiskSummaryCards({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <SummaryCard icon={FolderKanban} value={stats.total} label="Total Projects" />
      <SummaryCard
        icon={AlertTriangle}
        value={stats.high}
        label="High Risk"
        accent="text-red-600"
        bg="bg-red-50"
      />
      <SummaryCard
        icon={AlertCircle}
        value={stats.medium}
        label="Medium Risk"
        accent="text-amber-500"
        bg="bg-amber-50"
      />
      <SummaryCard
        icon={CheckCircle2}
        value={stats.low}
        label="Low Risk"
        accent="text-green-600"
        bg="bg-green-50"
      />
      <SummaryCard icon={CalendarClock} value={stats.avgDelay} label="Avg Expected Delay" suffix="days" />
    </div>
  )
}
