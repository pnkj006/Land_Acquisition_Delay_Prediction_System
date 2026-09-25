import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ClipboardList,
  FileBarChart,
  FolderKanban,
  Bell,
  Plus,
  Upload,
} from 'lucide-react'

const ACTIONS = [
  {
    label: 'Create Project',
    action: 'create',
    icon: Plus,
  },
  {
    label: 'Import Projects (CSV)',
    action: 'import',
    icon: Upload,
  },
  {
    label: 'View All Projects',
    path: '/admin/projects',
    icon: FolderKanban,
  },
  {
    label: 'Review High-Risk Projects',
    path: '/admin/risk-analysis',
    icon: AlertTriangle,
  },
  {
    label: 'View Alerts',
    path: '/admin/alerts',
    icon: Bell,
  },
  {
    label: 'View Field Updates',
    path: '/admin/field-updates',
    icon: ClipboardList,
  },
  {
    label: 'Generate Report',
    path: '/admin/reports',
    icon: FileBarChart,
  },
]

export default function AdminQuickActions({
  onCreateProject,
  onImportProjects,
}) {
  const navigate = useNavigate()

  const handleAction = (action, path) => {
    if (action === 'create') {
      onCreateProject?.()
      return
    }

    if (action === 'import') {
      onImportProjects?.()
      return
    }

    if (path) {
      navigate(path)
    }
  }

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-800">
          Quick Actions
        </h3>

        <p className="text-[11px] text-gray-400">
          Create, import and manage system projects
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1">
        {ACTIONS.map(({ label, path, action, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => handleAction(action, path)}
            className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5 text-left text-xs font-semibold text-gray-700 transition-colors hover:border-primary/30 hover:bg-primary-50 hover:text-primary"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
              <Icon className="h-4 w-4" />
            </span>

            {label}
          </button>
        ))}
      </div>
    </section>
  )
}