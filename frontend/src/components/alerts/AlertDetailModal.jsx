import { useNavigate } from 'react-router-dom'
import { ArrowRight, Clock } from 'lucide-react'
import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'
import StatusBadge from '../common/StatusBadge.jsx'
import RiskBadge from '../common/RiskBadge.jsx'
import { TYPE_META } from './AlertCard.jsx'
import { getTypeIcon } from '../../utils/typeIcons'
import { formatDateTimeShort } from '../../utils/formatters'
import { timeAgo } from '../../utils/dateUtils'

/**
 * Alert detail modal for the Alerts page. A thin wrapper over the EXISTING
 * Modal component. All displayed data comes from the alert (alerts.api) and
 * the linked project (projects.api data) — nothing is invented. The CTA
 * navigates to the EXISTING project details route.
 */
export default function AlertDetailModal({ alert, project, open, onClose }) {
  const navigate = useNavigate()

  if (!alert) return null

  const meta = TYPE_META[alert.type] || TYPE_META.update
  const TypeIcon = meta.icon
  const ProjectIcon = project ? getTypeIcon(project.type) : null

  return (
    <Modal open={open} onClose={onClose} title="Alert Details" size="md">
      {alert ? (
        <div className="flex flex-col gap-4">
          {/* Alert body */}
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.color}`}>
              <TypeIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug text-gray-800">{alert.message}</p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-gray-400">
                <Clock className="h-3 w-3" />
                <span>
                  {formatDateTimeShort(alert.timestamp)} · {timeAgo(alert.timestamp)}
                </span>
              </div>
            </div>
          </div>

          {/* Linked project context — data from the existing project row */}
          {project ? (
            <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3">
              <div className="mb-2.5 flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                  <ProjectIcon className="h-4 w-4" />
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
          ) : null}

          {/* CTA — reuses the EXISTING project details route, same as the
              dashboard's "Take Action" and Risk Analysis panel CTA */}
          {project ? (
            <Button
              icon={ArrowRight}
              onClick={() => {
                onClose()
                navigate(`/projects/${project.id}`)
              }}
            >
              Open Project Details
            </Button>
          ) : null}
        </div>
      ) : null}
    </Modal>
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
