import { useState } from 'react'
import { X } from 'lucide-react'
import { fetchClient } from '../../api/fetchClient'

const PROJECT_TYPES = [
  { value: 'HIGHWAY', label: 'Highway' },
  { value: 'RAILWAY', label: 'Railway' },
  { value: 'IRRIGATION', label: 'Irrigation' },
  { value: 'POWER', label: 'Power' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
  { value: 'OTHER', label: 'Other' },
]

const RESPONSIVENESS_LEVELS = ['HIGH', 'MEDIUM', 'LOW']

const DELAY_STATUSES = [
  { value: 'ON_TIME', label: 'On Time' },
  { value: 'DELAYED', label: 'Delayed' },
]

const INITIAL_FORM = {
  project_id: '',
  project_type: '',
  land_area_hectares: '',
  number_of_affected_families: '',
  compensation_status: '',
  approval_timeline_days: '',
  legal_disputes_count: '',
  possession_status: '',
  rehabilitation_progress_pct: '',
  stakeholder_responsiveness: '',
  historical_performance_score: '',
  manager: '',
  location: '',
  state: '',
  district: '',
  altitude_m: '',
  latitude: '',
  longitude: '',
  delay_status: 'ON_TIME',
  delay_days: '',
}

export default function CreateProjectModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!open) {
    return null
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))

    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')

    if (!form.project_id.trim()) {
      setError('Project ID is required.')
      return
    }

    const payload = {
      project_id: form.project_id.trim().toUpperCase(),
    }

    if (form.project_type) {
      payload.project_type = form.project_type
    }

    if (form.land_area_hectares !== '') {
      payload.land_area_hectares = Number(form.land_area_hectares)
    }

    if (form.number_of_affected_families !== '') {
      payload.number_of_affected_families = Number(
        form.number_of_affected_families,
      )
    }

    if (form.compensation_status.trim()) {
      payload.compensation_status = form.compensation_status.trim()
    }

    if (form.approval_timeline_days !== '') {
      payload.approval_timeline_days = Number(
        form.approval_timeline_days,
      )
    }

    if (form.legal_disputes_count !== '') {
      payload.legal_disputes_count = Number(
        form.legal_disputes_count,
      )
    }

    if (form.possession_status.trim()) {
      payload.possession_status = form.possession_status.trim()
    }

    if (form.rehabilitation_progress_pct !== '') {
      payload.rehabilitation_progress_pct = Number(
        form.rehabilitation_progress_pct,
      )
    }

    if (form.stakeholder_responsiveness) {
      payload.stakeholder_responsiveness =
        form.stakeholder_responsiveness
    }

    if (form.historical_performance_score !== '') {
      payload.historical_performance_score = Number(
        form.historical_performance_score,
      )
    }

    if (form.manager.trim()) {
      payload.manager = form.manager.trim()
    }

    if (form.location.trim()) {
      payload.location = form.location.trim()
    }

    if (form.state.trim()) {
      payload.state = form.state.trim()
    }

    if (form.district.trim()) {
      payload.district = form.district.trim()
    }

    if (form.altitude_m !== '') {
      payload.altitude_m = Number(form.altitude_m)
    }

    if (form.latitude !== '') {
      payload.latitude = Number(form.latitude)
    }

    if (form.longitude !== '') {
      payload.longitude = Number(form.longitude)
    }

    if (form.delay_status) {
      payload.delay_status = form.delay_status
    }

    if (form.delay_days !== '') {
      payload.delay_days = Number(form.delay_days)
    }

    try {
      setSubmitting(true)

      const response = await fetchClient('/projects', {
        method: 'POST',
        body: payload,
      })

      const createdProject = response?.data || response

      setForm(INITIAL_FORM)

      if (onCreated) {
        onCreated(createdProject)
      }

      onClose()
    } catch (err) {
      console.error('Failed to create project:', err)

      const message =
        err?.info?.message ||
        err?.info?.error ||
        err?.message ||
        'Failed to create project.'

      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (submitting) {
      return
    }

    setError('')
    setForm(INITIAL_FORM)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              Create New Project
            </h2>

            <p className="mt-0.5 text-xs text-gray-400">
              Enter the project information below.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto px-5 py-5"
        >
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <section className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                label="Project ID"
                name="project_id"
                value={form.project_id}
                onChange={handleChange}
                required
                placeholder="e.g. P109"
              />

              <SelectField
                label="Project Type"
                name="project_type"
                value={form.project_type}
                onChange={handleChange}
                options={PROJECT_TYPES}
              />

              <InputField
                label="Project Name / Location"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. NH-16 Expansion"
              />

              <InputField
                label="State"
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="e.g. Odisha"
              />

              <InputField
                label="District"
                name="district"
                value={form.district}
                onChange={handleChange}
                placeholder="e.g. Cuttack"
              />

              <InputField
                label="Project Manager"
                name="manager"
                value={form.manager}
                onChange={handleChange}
                placeholder="Manager name"
              />
            </div>
          </section>

          {/* Land & Family Information */}
          <section className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              Land & Affected Families
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                label="Land Area (hectares)"
                name="land_area_hectares"
                type="number"
                min="0"
                step="any"
                value={form.land_area_hectares}
                onChange={handleChange}
              />

              <InputField
                label="Affected Families"
                name="number_of_affected_families"
                type="number"
                min="0"
                step="1"
                value={form.number_of_affected_families}
                onChange={handleChange}
              />

              <InputField
                label="Compensation Status"
                name="compensation_status"
                value={form.compensation_status}
                onChange={handleChange}
                placeholder="e.g. Pending"
              />

              <InputField
                label="Possession Status"
                name="possession_status"
                value={form.possession_status}
                onChange={handleChange}
                placeholder="e.g. Pending"
              />
            </div>
          </section>

          {/* Progress & Legal */}
          <section className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              Progress & Legal Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                label="Approval Timeline (days)"
                name="approval_timeline_days"
                type="number"
                min="0"
                step="1"
                value={form.approval_timeline_days}
                onChange={handleChange}
              />

              <InputField
                label="Legal Disputes"
                name="legal_disputes_count"
                type="number"
                min="0"
                step="1"
                value={form.legal_disputes_count}
                onChange={handleChange}
              />

              <InputField
                label="Rehabilitation Progress (%)"
                name="rehabilitation_progress_pct"
                type="number"
                min="0"
                max="100"
                step="any"
                value={form.rehabilitation_progress_pct}
                onChange={handleChange}
              />

              <SelectField
                label="Stakeholder Responsiveness"
                name="stakeholder_responsiveness"
                value={form.stakeholder_responsiveness}
                onChange={handleChange}
                options={RESPONSIVENESS_LEVELS.map((value) => ({
                  value,
                  label:
                    value.charAt(0) +
                    value.slice(1).toLowerCase(),
                }))}
              />
            </div>
          </section>

          {/* Location */}
          <section className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              Geographic Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <InputField
                label="Altitude (m)"
                name="altitude_m"
                type="number"
                step="any"
                value={form.altitude_m}
                onChange={handleChange}
              />

              <InputField
                label="Latitude"
                name="latitude"
                type="number"
                min="-90"
                max="90"
                step="any"
                value={form.latitude}
                onChange={handleChange}
              />

              <InputField
                label="Longitude"
                name="longitude"
                type="number"
                min="-180"
                max="180"
                step="any"
                value={form.longitude}
                onChange={handleChange}
              />
            </div>
          </section>

          {/* Delay Information */}
          <section className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              Delay Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SelectField
                label="Delay Status"
                name="delay_status"
                value={form.delay_status}
                onChange={handleChange}
                options={DELAY_STATUSES}
              />

              <InputField
                label="Delay Days"
                name="delay_days"
                type="number"
                min="0"
                step="1"
                value={form.delay_days}
                onChange={handleChange}
              />
            </div>
          </section>

          {/* ML input */}
          <section className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              Historical Performance
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                label="Historical Performance Score"
                name="historical_performance_score"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={form.historical_performance_score}
                onChange={handleChange}
              />
            </div>

            <p className="mt-2 text-[11px] text-gray-400">
              Enter a value between 0 and 1. Risk score is not entered
              manually; it can be generated by the prediction workflow.
            </p>
          </section>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function InputField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  ...props
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-xs font-medium text-gray-700"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/10"
        {...props}
      />
    </div>
  )
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-xs font-medium text-gray-700"
      >
        {label}
      </label>

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
      >
        <option value="">Select...</option>

        {options.map((option) => {
          const item =
            typeof option === 'string'
              ? { value: option, label: option }
              : option

          return (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          )
        })}
      </select>
    </div>
  )
}