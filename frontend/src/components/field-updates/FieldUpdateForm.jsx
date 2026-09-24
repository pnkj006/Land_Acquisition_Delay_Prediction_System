import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

import Button from '../common/Button.jsx'
import Select from '../common/Select.jsx'
import Input from '../common/Input.jsx'
import ProjectInfo from '../projects/ProjectInfo.jsx'

const STAGE_OPTIONS = [
  {
    value: 'NOTIFICATION',
    label: 'Notification',
  },
  {
    value: 'APPROVAL',
    label: 'Approval',
  },
  {
    value: 'LAND_ACQUISITION',
    label: 'Land Acquisition',
  },
  {
    value: 'COMPENSATION',
    label: 'Compensation',
  },
  {
    value: 'REHABILITATION',
    label: 'Rehabilitation',
  },
  {
    value: 'POSSESSION',
    label: 'Possession',
  },
]

function normalizeStage(stage) {
  if (!stage) return STAGE_OPTIONS[0].value

  const value = String(stage).trim()

  // Already a backend enum value
  const enumStage = STAGE_OPTIONS.find(
    (option) => option.value === value,
  )

  if (enumStage) {
    return enumStage.value
  }

  // Convert display label to backend enum value
  const labelStage = STAGE_OPTIONS.find(
    (option) => option.label === value,
  )

  return labelStage
    ? labelStage.value
    : STAGE_OPTIONS[0].value
}

function defaultsFor(project) {
  return {
    projectId: project?.id || '',
    stage: normalizeStage(project?.stage),
    progressPct: '',
  }
}

export default function FieldUpdateForm({
  projects = [],
  submitting = false,
  onSubmit,
}) {
  const initial = defaultsFor(projects[0] || null)

  const [projectId, setProjectId] = useState(
    initial.projectId,
  )

  const [stage, setStage] = useState(initial.stage)

  const [progressPct, setProgressPct] = useState(
    initial.progressPct,
  )

  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const selectedProject =
    projects.find((p) => p.id === projectId) || null

  /*
   * When projects load asynchronously,
   * select the first project.
   */
  useEffect(() => {
    if (projectId || projects.length === 0) return

    const defaults = defaultsFor(projects[0])

    setProjectId(defaults.projectId)
    setStage(defaults.stage)
    setProgressPct('')
  }, [projects, projectId])

  /*
   * When project changes, use its current stage
   * as the initial stage selection.
   */
  const handleProjectChange = (e) => {
    const project =
      projects.find((p) => p.id === e.target.value) ||
      null

    const defaults = defaultsFor(project)

    setProjectId(defaults.projectId)
    setStage(defaults.stage)
    setProgressPct('')

    setErrors({})
    setSubmitError('')
    setSaved(false)
  }

  const validate = () => {
    const next = {}

    if (!projectId) {
      next.projectId = 'Project is required.'
    }

    if (!stage) {
      next.stage = 'Current stage is required.'
    }

    if (progressPct === '') {
      next.progressPct =
        'Current stage progress is required.'
    } else {
      const value = Number(progressPct)

      if (
        Number.isNaN(value) ||
        value < 0 ||
        value > 100
      ) {
        next.progressPct =
          'Progress must be between 0 and 100.'
      }
    }

    return next
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (submitting) return

    const validation = validate()

    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }

    setErrors({})
    setSubmitError('')
    setSaved(false)

    try {
      await onSubmit({
        projectId,
        stage,
        progressPct: Number(progressPct),
      })

      setSaved(true)

      /*
       * Keep the selected project and stage,
       * but clear the percentage so another update
       * can be entered.
       */
      setProgressPct('')

      setTimeout(() => {
        setSaved(false)
      }, 2000)
    } catch (err) {
      setSubmitError(
        err.message ||
          'Unable to update project stage progress.',
      )
    }
  }

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">
          Update Stage Progress
        </h3>

        <p className="text-[11px] text-gray-400">
          Select the project's current stage and enter its
          completion percentage.
        </p>
      </div>

      {submitError ? (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {submitError}
        </div>
      ) : null}

      {saved ? (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          Stage progress updated successfully.
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

          {/* Project */}
          <Select
            label="Project"
            value={projectId}
            onChange={handleProjectChange}
            options={projects.map((p) => ({
              value: p.id,
              label: `${p.id} — ${p.name} · ${p.district}`,
            }))}
            error={errors.projectId}
          />

          {/* Current Stage */}
          <Select
            label="Current Stage"
            value={stage}
            onChange={(e) => {
              setStage(e.target.value)

              setErrors((prev) => ({
                ...prev,
                stage: undefined,
              }))
            }}
            options={STAGE_OPTIONS}
            error={errors.stage}
          />

          {/* Current Stage Progress */}
          <Input
            label="Current Stage Progress (%)"
            type="number"
            min="0"
            max="100"
            step="1"
            value={progressPct}
            onChange={(e) => {
              setProgressPct(e.target.value)

              setErrors((prev) => ({
                ...prev,
                progressPct: undefined,
              }))
            }}
            placeholder="0–100"
            error={errors.progressPct}
          />
        </div>

        {/* Selected project information */}
        {selectedProject ? (
          <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Selected Project
            </p>

            <ProjectInfo project={selectedProject} />
          </div>
        ) : null}

        {/* Explanation */}
        <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2">
          <p className="text-[11px] leading-relaxed text-blue-700">
            Previous stages will automatically be marked
            <strong> 100%</strong>, the selected stage will use
            the percentage you entered, and future stages will
            be set to <strong>0%</strong>.
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between border-t border-gray-50 pt-3">
          <p className="text-[10px] text-gray-400">
            Example: Compensation → 60%
          </p>

          <Button
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? 'Updating…'
              : 'Update Progress'}
          </Button>
        </div>
      </form>
    </section>
  )
}