import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import { getProjectById, updateProject } from '../../api/projects.api'

export default function EditProject() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    project_type: '',
    land_area_hectares: '',
    number_of_affected_families: '',
    approval_timeline_days: '',
    legal_disputes_count: '',
    rehabilitation_progress_pct: '',
    historical_performance_score: '',
    altitude_m: '',
    latitude: '',
    longitude: '',
    compensation_status: '',
    possession_status: '',
    stakeholder_responsiveness: '',
  })

  useEffect(() => {
    async function loadProject() {
      try {
        setLoading(true)
        setError('')

        const res = await getProjectById(projectId)
        const project = res.data

        setForm({
          project_type: project.type ?? '',
          land_area_hectares: project.land_area_hectares ?? '',
          number_of_affected_families:
            project.number_of_affected_families ?? '',
          approval_timeline_days: project.approval_timeline_days ?? '',
          legal_disputes_count: project.legal_disputes_count ?? '',
          rehabilitation_progress_pct:
            project.rehabilitation_progress_pct ?? '',
          historical_performance_score:
            project.historical_performance_score ?? '',
          altitude_m: project.altitude_m ?? '',
          latitude: project.latitude ?? '',
          longitude: project.longitude ?? '',
          compensation_status: project.compensation_status ?? '',
          possession_status: project.possession_status ?? '',
          stakeholder_responsiveness:
            project.stakeholder_responsiveness ?? '',
        })
      } catch (err) {
        setError(err.message || 'Failed to load project')
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [projectId])

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError('')

      const payload = {
        project_type: form.project_type,
        land_area_hectares: Number(form.land_area_hectares),
        number_of_affected_families: Number(
          form.number_of_affected_families
        ),
        approval_timeline_days: Number(
          form.approval_timeline_days
        ),
        legal_disputes_count: Number(
          form.legal_disputes_count
        ),
        rehabilitation_progress_pct: Number(
          form.rehabilitation_progress_pct
        ),
        historical_performance_score: Number(
          form.historical_performance_score
        ),
        altitude_m: Number(form.altitude_m),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        compensation_status: form.compensation_status,
        possession_status: form.possession_status,
        stakeholder_responsiveness: form.stakeholder_responsiveness,
      }

      await updateProject(projectId, payload)

      navigate(`/project-manager/projects/${projectId}`)
    } catch (err) {
      setError(err.message || 'Failed to update project')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading project...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Edit Project
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Update project information and refresh the ML risk prediction.
        </p>
      </div>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Project Type */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Project Information
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="project_type"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Project Type
              </label>

              <select
                id="project_type"
                name="project_type"
                value={form.project_type}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              >
                <option value="">Select project type</option>
                <option value="HIGHWAY">Highway</option>
                <option value="RAILWAY">Railway</option>
                <option value="IRRIGATION">Irrigation</option>
                <option value="POWER">Power</option>
                <option value="INDUSTRIAL">Industrial</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Land & Project Data */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Land &amp; Project Data
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Land Area (hectares)"
              name="land_area_hectares"
              type="number"
              value={form.land_area_hectares}
              onChange={handleChange}
            />

            <Input
              label="Affected Families"
              name="number_of_affected_families"
              type="number"
              value={form.number_of_affected_families}
              onChange={handleChange}
            />

            <Input
              label="Approval Timeline (days)"
              name="approval_timeline_days"
              type="number"
              value={form.approval_timeline_days}
              onChange={handleChange}
            />

            <Input
              label="Legal Disputes"
              name="legal_disputes_count"
              type="number"
              value={form.legal_disputes_count}
              onChange={handleChange}
            />

            <Input
              label="Rehabilitation Progress (%)"
              name="rehabilitation_progress_pct"
              type="number"
              value={form.rehabilitation_progress_pct}
              onChange={handleChange}
            />

            <Input
              label="Historical Performance Score"
              name="historical_performance_score"
              type="number"
              value={form.historical_performance_score}
              onChange={handleChange}
            />

            <Input
              label="Altitude (m)"
              name="altitude_m"
              type="number"
              value={form.altitude_m}
              onChange={handleChange}
            />

            <Input
              label="Latitude"
              name="latitude"
              type="number"
              value={form.latitude}
              onChange={handleChange}
            />

            <Input
              label="Longitude"
              name="longitude"
              type="number"
              value={form.longitude}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Project Status */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Project Status Information
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Compensation Status */}
            <div>
              <label
                htmlFor="compensation_status"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Compensation Status
              </label>

              <select
                id="compensation_status"
                name="compensation_status"
                value={form.compensation_status}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              >
                <option value="">Select compensation status</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Possession Status */}
            <div>
              <label
                htmlFor="possession_status"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Possession Status
              </label>

              <select
                id="possession_status"
                name="possession_status"
                value={form.possession_status}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              >
                <option value="">Select possession status</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Stakeholder Responsiveness */}
            <div>
              <label
                htmlFor="stakeholder_responsiveness"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Stakeholder Responsiveness
              </label>

              <select
                id="stakeholder_responsiveness"
                name="stakeholder_responsiveness"
                value={form.stakeholder_responsiveness}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              >
                <option value="">Select responsiveness</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate(`/project-manager/projects/${projectId}`)
            }
          >
            Cancel
          </Button>

          <Button type="submit" disabled={saving}>
            {saving ? 'Updating & Predicting...' : 'Save & Recalculate Risk'}
          </Button>
        </div>
      </form>
    </div>
  )
}