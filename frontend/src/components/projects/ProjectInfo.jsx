import {
  Briefcase,
  CalendarDays,
  FolderKanban,
  Hash,
  MapPin,
  Milestone,
  Ruler,
  Target,
  Users,
} from 'lucide-react'
import { formatDate } from '../../utils/formatters'

/**
 * Reusable two-column project information grid with an icon beside each field.
 * Consumes the project object exactly as returned by getProjects /
 * getProjectById (projects.api) — no new or invented fields.
 */
export default function ProjectInfo({ project }) {
  if (!project) return null

  const fields = [
    ['Project ID', project.id, Hash],
    ['Name', project.name, FolderKanban],
    ['Type', project.type, Briefcase],
    ['District', project.district, MapPin],
    ['Total Land Area', project.totalLandArea, Ruler],
    ['Affected Families', project.affectedFamilies, Users],
    ['Current Stage', project.stage, Milestone],
    ['Start Date', formatDate(project.startDate), CalendarDays],
    ['Target Completion', formatDate(project.targetCompletion), Target],
  ]

  return (
    <dl className="grid grid-cols-1 gap-x-5 gap-y-2.5 text-[11px] sm:grid-cols-2">
      {fields.map(([label, value, Icon]) => (
        <div key={label} className="flex items-start gap-2">
          <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent/70" />
          <div className="flex min-w-0 flex-col">
            <dt className="text-gray-400">{label}</dt>
            <dd className="truncate font-semibold text-gray-700" title={value}>
              {value}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  )
}
