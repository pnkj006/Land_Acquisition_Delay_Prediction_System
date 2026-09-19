import { useParams } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout.jsx'
import PageHeader from '../../components/layout/PageHeader.jsx'
import RiskGauge from '../../components/projects/RiskGauge.jsx'
import RiskFactors from '../../components/projects/RiskFactors.jsx'
import ProjectProgress from '../../components/projects/ProjectProgress.jsx'
import Recommendations from '../../components/projects/Recommendations.jsx'
import ProjectInfo from '../../components/projects/ProjectInfo.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import RiskBadge from '../../components/common/RiskBadge.jsx'
import Loader from '../../components/common/Loader.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import { useProjectDetails } from '../../hooks/useProjects.js'
import { useRisk } from '../../hooks/useRisk.js'
import { getRecommendations } from '../../api/recommendations.api'
import { useEffect, useState } from 'react'

export default function ProjectDetails() {
  const { projectId } = useParams()
  const { project, loading, error, refetch } = useProjectDetails(projectId)
  const { prediction, loading: riskLoading } = useRisk(projectId)
  const [recommendations, setRecommendations] = useState([])
  const [recsLoading, setRecsLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    let isMounted = true
    setRecsLoading(true)
    getRecommendations(projectId)
      .then((res) => {
        if (isMounted) setRecommendations(res.data)
      })
      .finally(() => {
        if (isMounted) setRecsLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [projectId])

  return (
    <DashboardLayout activeKey="my-projects">
      <PageHeader
        title={project ? `${project.id} — ${project.name}` : 'Project Details'}
        subtitle={project ? `${project.type} · ${project.district}` : undefined}
      />

      {loading ? (
        <Loader fullPage />
      ) : error || !project ? (
        <ErrorState message="Failed to load project details." onRetry={refetch} />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Left: info + progress */}
          <div className="flex flex-col gap-5">
            <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Project Information</h3>
                <div className="flex items-center gap-2">
                  <StatusBadge status={project.type} />
                  <RiskBadge level={project.riskLevel} />
                </div>
              </div>
              <ProjectInfo project={project} />
            </section>

            <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">Project Stage Progress</h3>
              <ProjectProgress currentStage={project.stage} />
            </section>

            <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">AI Recommendation</h3>
              <Recommendations recommendations={recommendations} loading={recsLoading} />
            </section>
          </div>

          {/* Right: risk */}
          <div className="flex flex-col gap-5">
            <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">Risk Prediction</h3>
              {riskLoading || !prediction ? (
                <Loader className="py-10" />
              ) : (
                <RiskGauge
                  probability={prediction.delayProbability}
                  riskLevel={prediction.riskLevel}
                  expectedDelayDays={prediction.expectedDelayDays}
                  warningMessage={prediction.warningMessage}
                />
              )}
            </section>

            <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">Key Risk Factors (SHAP Explanation)</h3>
              <RiskFactors
                factors={prediction ? prediction.shapFactors : []}
                summary={prediction ? prediction.summary : ''}
                loading={riskLoading}
              />
            </section>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
