import { useMemo } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout.jsx'
import PageHeader from '../../components/layout/PageHeader.jsx'
import ProjectTable from '../../components/projects/ProjectTable.jsx'
import { useProjects } from '../../hooks/useProjects.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function MyProjects() {
  const { user } = useAuth()
  const { projects, pagination, loading, error, filters, setFilters, refetch } = useProjects({ pageSize: 8 })

  const subtitle = useMemo(() => `${user ? user.district : ''} · ${pagination.total} projects`, [user, pagination.total])

  return (
    <DashboardLayout activeKey="my-projects">
      <PageHeader title="My Projects" subtitle={subtitle} />
      <ProjectTable
        projects={projects}
        loading={loading}
        error={error}
        pagination={pagination}
        filters={filters}
        onFiltersChange={setFilters}
        onRetry={refetch}
        title="All Projects"
      />
    </DashboardLayout>
  )
}
