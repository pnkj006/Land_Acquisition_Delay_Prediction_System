import {
  AlertTriangle,
  CalendarClock,
  CircleCheck,
  FolderKanban,
  ShieldAlert,
} from 'lucide-react'
import SummaryCard from '../dashboard/SummaryCard.jsx'

/**
 * Portfolio summary metrics. Every number is computed by the page from the
 * loaded project records — nothing is hardcoded.
 *
 * "At Risk" and "On Track" are transparent derivations documented in
 * analyticsUtils: high risk OR delay probability >= 50 counts as at risk;
 * completed stage counts as on track.
 */
export default function PerformanceSummary({ metrics }) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
        Project Performance
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <SummaryCard
          label="Total Projects"
          value={metrics.total}
          icon={FolderKanban}
          tone="accent"
          hint="In current selection"
        />
        <SummaryCard
          label="On Track"
          value={metrics.onTrack}
          icon={CircleCheck}
          tone="green"
          hint="Not flagged at risk"
        />
        <SummaryCard
          label="At Risk"
          value={metrics.atRisk}
          icon={ShieldAlert}
          tone="red"
          hint="High risk or ≥50% delay probability"
        />
        <SummaryCard
          label="Average Delay"
          value={`${metrics.avgDelay} days`}
          icon={CalendarClock}
          tone="amber"
          hint="Mean expected delay"
        />
        <SummaryCard
          label="High Risk"
          value={metrics.high}
          icon={AlertTriangle}
          tone="red"
          hint="Risk level: High"
        />
      </div>
    </section>
  )
}