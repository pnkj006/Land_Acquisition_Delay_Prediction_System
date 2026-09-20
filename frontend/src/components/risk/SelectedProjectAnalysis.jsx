import { ArrowRight, BrainCircuit } from 'lucide-react'
import RiskBadge from '../common/RiskBadge.jsx'
import StatusBadge from '../common/StatusBadge.jsx'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import Loader from '../common/Loader.jsx'
import RiskGauge from '../projects/RiskGauge.jsx'
import RiskFactors from '../projects/RiskFactors.jsx'
import Recommendations from '../projects/Recommendations.jsx'
import { getTypeIcon } from '../../utils/typeIcons'

/**
 * Selected project analysis panel for the Risk Analysis page. Everything shown
 * comes from existing data sources: the project row (projects.api), the ML
 * prediction with SHAP factors (risk.api via useRisk) and recommended actions
 * (recommendations.api). No values are invented here.
 */
export default function SelectedProjectAnalysis({
  project,
  prediction,
  predictionLoading,
  recommendations,
  recommendationsLoading,
  onOpenDetails,
}) {
  if (!project) {
    return (
      <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <EmptyState
          title="No Project Selected"
          message="Select a project from the table above to see its detailed risk analysis."
        />
      </section>
    )
  }

  const TypeIcon = getTypeIcon(project.type)

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      {/* Panel header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Selected Project Analysis
          </p>
          <h3 className="truncate text-sm font-semibold text-gray-800">
            {project.id} — {project.name}
          </h3>
        </div>
        {/* Reuses the project details route (/projects/:id)
            — same navigation as the dashboard "Take Action" CTA. */}
        <Button
          size="sm"
          variant="outline"
          icon={ArrowRight}
          onClick={() => onOpenDetails && onOpenDetails(project.id)}
        >
          Open Project Details
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Project information */}
        <div className="rounded-lg border border-gray-100 p-3">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <TypeIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-800">{project.name}</p>
              <p className="text-[11px] text-gray-400">
                {project.id} · {project.district}
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
            <Info label="Project Type" value={project.type} />
            <Info label="District" value={project.district} />
            <Info label="Current Stage" value={<StatusBadge status={project.stage} />} />
            <Info label="Risk Level" value={<RiskBadge level={project.riskLevel} />} />
            <Info
              label="Delay Probability"
              value={<span className="font-bold tabular-nums text-gray-900">{project.delayProbability}%</span>}
            />
            <Info
              label="Expected Delay"
              value={
                <span className="font-bold tabular-nums text-gray-900">{project.expectedDelayDays} days</span>
              }
            />
          </dl>
        </div>

        {/* Risk Prediction — values from risk.api via useRisk() (same
            RiskGauge used on the dashboard and project details page) */}
        <div className="rounded-lg border border-gray-100 p-3">
          <div className="mb-2.5 flex items-center justify-between">
            <h4 className="text-xs font-semibold text-gray-700">Risk Prediction</h4>
            <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-semibold text-accent">
              AI Model
            </span>
          </div>
          {predictionLoading ? (
            <Loader className="py-8" label="Loading prediction…" />
          ) : prediction ? (
            <RiskGauge
              probability={prediction.delayProbability}
              riskLevel={prediction.riskLevel}
              expectedDelayDays={prediction.expectedDelayDays}
              warningMessage={prediction.warningMessage}
            />
          ) : (
            <EmptyState
              title="Prediction Unavailable"
              message="Risk prediction data is currently unavailable."
            />
          )}
        </div>

        {/* SHAP / XAI — bars and values come straight from the prediction
            shapFactors (risk.api); nothing is hardcoded here. */}
        <div className="rounded-lg border border-gray-100 p-3">
          <h4 className="mb-2.5 text-xs font-semibold text-gray-700">
            Key Risk Factors (SHAP Explanation)
          </h4>
          {predictionLoading ? (
            <RiskFactors factors={[]} loading />
          ) : prediction ? (
            <RiskFactors
              factors={prediction.shapFactors || []}
              summary={prediction.summary || ''}
              loading={false}
            />
          ) : (
            <EmptyState
              title="Explanation Unavailable"
              message="Risk prediction data is currently unavailable."
            />
          )}
        </div>

      </div>

      {/* Recommended Actions — from the existing recommendations.api.
          Narrative order: Prediction → Why (SHAP) → Action. */}
      <div className="mt-4 rounded-lg border border-gray-100 p-3">
        <div className="mb-2.5 flex items-center justify-between">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
            <BrainCircuit className="h-3.5 w-3.5 text-accent" /> Recommended Actions
          </h4>
          <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-semibold text-accent">
            Auto-generated
          </span>
        </div>
        <Recommendations recommendations={recommendations} loading={recommendationsLoading} />
      </div>
    </section>
  )
}

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-xs font-medium text-gray-700">{value ?? '—'}</dd>
    </div>
  )
}
