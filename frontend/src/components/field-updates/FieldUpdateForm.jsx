import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Camera, CheckCircle2, MapPin, Navigation, Paperclip, X } from 'lucide-react'
import Button from '../common/Button.jsx'
import Select from '../common/Select.jsx'
import Input from '../common/Input.jsx'
import ProgressBar from '../common/ProgressBar.jsx'
import ProjectInfo from '../projects/ProjectInfo.jsx'
import { PROJECT_STAGES, FIELD_UPDATE_TYPES } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext.jsx'

const NOTE_LIMIT = 500
const MAX_FILE_SIZE = 10 * 1024 * 1024 // same limit the backend upload middleware uses
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
// Distance (km) within which a device GPS reading is considered to match the
// project's registered site location.
const LOCATION_MATCH_KM = 5

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`
}

// Great-circle distance between two {lat, lng} points (haversine).
function distanceKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Derives the pre-loaded form values for a project so the manager never has to
 * re-enter information that already exists. Everything comes from the real
 * project record; fields the project does not track start blank.
 */
function defaultsFor(project) {
  if (!project) {
    return {
      projectId: '',
      stage: PROJECT_STAGES[0],
      progress: { affected: '', compensated: '', progressPct: '' },
      location: null,
    }
  }
  return {
    projectId: project.id,
    stage: project.stage,
    progress: { affected: String(project.affectedFamilies), compensated: '', progressPct: '' },
    location: { lat: project.lat, lng: project.lng, source: 'project' },
  }
}

/**
 * Field update submission form (inline card) for the Field Updates page.
 * Progress / attachment / location are captured for the future backend →
 * ML pipeline. Nothing is fabricated: project context comes from the
 * existing projects data, submittedBy from AuthContext, and there is no
 * upload destination (attachment metadata is captured client-side only).
 */
export default function FieldUpdateForm({ projects = [], submitting = false, onSubmit, onReset }) {
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  // Object URL for the local image preview. Kept in a ref as well so it can be
  // revoked deterministically (replace / remove / unmount) without leaking.
  const previewUrlRef = useRef('')
  const initial = defaultsFor(projects[0] || null)

  const [projectId, setProjectId] = useState(initial.projectId)
  const [stage, setStage] = useState(initial.stage)
  const [updateType, setUpdateType] = useState('')
  const [note, setNote] = useState('')
  const [progress, setProgress] = useState(initial.progress)
  const [attachment, setAttachment] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [fileError, setFileError] = useState('')
  const [location, setLocation] = useState(initial.location)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState('')
  const [locDenied, setLocDenied] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(false)
  const [saved, setSaved] = useState(false)

  const selectedProject = projects.find((p) => p.id === projectId) || null

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    },
    [],
  )

  // `projects` loads asynchronously (useProjects). If this form mounted before
  // the projects arrived it would have no default selection, so adopt the first
  // project's values once — without ever overriding a choice the manager made.
  useEffect(() => {
    if (projectId || projects.length === 0) return
    const defaults = defaultsFor(projects[0])
    setProjectId(defaults.projectId)
    setStage(defaults.stage)
    setProgress(defaults.progress)
    setLocation(defaults.location)
  }, [projects, projectId])

  const setProgressField = (key) => (e) => {
    setProgress((prev) => ({ ...prev, [key]: e.target.value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleProjectChange = (e) => {
    const defaults = defaultsFor(projects.find((p) => p.id === e.target.value) || null)
    setProjectId(defaults.projectId)
    setStage(defaults.stage)
    setProgress(defaults.progress)
    setLocation(defaults.location)
    setLocError('')
    setErrors((prev) => ({ ...prev, projectId: undefined }))
  }

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Location services are not supported by this browser.')
      return
    }
    setLocating(true)
    setLocError('')
    setLocDenied(false)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        setLocation({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          source: 'device',
        })
      },
      () => {
        // Permission denied / timeout — keep the project location as fallback.
        setLocating(false)
        setLocDenied(true)
      },
      { timeout: 10000, enableHighAccuracy: false },
    )
  }

  const clearPreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = ''
    }
    setPreviewUrl('')
  }

  const removeAttachment = () => {
    clearPreview()
    setAttachment(null)
    setFileError('')
  }

  const handleAttachmentChange = (e) => {
    const file = e.target.files && e.target.files[0]
    setFileError('')
    if (!file) return
    const extension = file.name.split('.').pop().toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setFileError('File type is not supported. Use PDF, JPG, PNG, DOC or DOCX.')
    } else if (file.size > MAX_FILE_SIZE) {
      setFileError('File size exceeds the allowed limit (10 MB).')
    } else {
      clearPreview()
      // Local object-URL preview for images. The File object is retained so a
      // future multipart/form-data upload needs no rewrite — but nothing is
      // sent anywhere today (the backend has no evidence-upload endpoint).
      if (file.type && file.type.startsWith('image/')) {
        previewUrlRef.current = URL.createObjectURL(file)
        setPreviewUrl(previewUrlRef.current)
      }
      setAttachment({ name: file.name, size: file.size, type: file.type, file })
    }
    e.target.value = ''
  }

  /** Clears the form back to the selected project's real defaults. */
  const handleReset = () => {
    const defaults = defaultsFor(selectedProject || projects[0] || null)
    setProjectId(defaults.projectId)
    setStage(defaults.stage)
    setProgress(defaults.progress)
    setLocation(defaults.location)
    setUpdateType('')
    setNote('')
    removeAttachment()
    setLocError('')
    setLocDenied(false)
    setErrors({})
    setSubmitError(false)
    if (typeof onReset === 'function') onReset()
  }

  const validate = () => {
    const next = {}
    if (!projectId) next.projectId = 'Project is required.'
    if (!stage) next.stage = 'Current stage is required.'
    if (!updateType) next.updateType = 'Update type is required.'

    const affected = progress.affected === '' ? null : Number(progress.affected)
    const compensated = progress.compensated === '' ? null : Number(progress.compensated)
    const pct = progress.progressPct === '' ? null : Number(progress.progressPct)

    if (affected !== null && (Number.isNaN(affected) || affected < 0 || !Number.isInteger(affected))) {
      next.affected = 'Families affected must be a whole number of 0 or more.'
    }
    if (compensated !== null && (Number.isNaN(compensated) || compensated < 0 || !Number.isInteger(compensated))) {
      next.compensated = 'Families compensated must be a whole number of 0 or more.'
    }
    if (!next.affected && !next.compensated && affected !== null && compensated !== null && compensated > affected) {
      next.compensated = 'Families compensated cannot exceed affected families.'
    }
    if (pct !== null && (Number.isNaN(pct) || pct < 0 || pct > 100)) {
      next.progressPct = 'Progress must be between 0 and 100.'
    }
    if (note.length > NOTE_LIMIT) {
      next.note = `Remarks must be ${NOTE_LIMIT} characters or fewer.`
    }
    return next
  }

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault()
    if (submitting) return
    const validation = validate()
    if (Object.values(validation).some(Boolean)) {
      setErrors(validation)
      return
    }
    setErrors({})
    setSubmitError(false)

    const progressPayload = {}
    if (progress.affected !== '') progressPayload.affectedFamilies = Number(progress.affected)
    if (progress.compensated !== '') progressPayload.familiesCompensated = Number(progress.compensated)
    if (progress.progressPct !== '') progressPayload.currentProgressPct = Number(progress.progressPct)

    try {
      await onSubmit({
        projectId,
        stage,
        updateType,
        note,
        progress: Object.keys(progressPayload).length ? progressPayload : null,
        // Metadata only — the File object stays in local state (there is no
        // evidence-upload endpoint, so nothing is transmitted).
        attachment: attachment
          ? { name: attachment.name, size: attachment.size, type: attachment.type }
          : null,
        location,
        submittedBy: user ? { name: user.name, role: user.role } : null,
      })
    } catch (err) {
      // Submission failed — keep every entered value so the user can retry.
      setSubmitError(true)
      return
    }

    setSaved(true)
    setNote('')
    removeAttachment()
    setProgress((prev) => ({ ...prev, compensated: '', progressPct: '' }))
    setTimeout(() => setSaved(false), 1500)
  }

  // Live progress indicator value (invalid/empty input simply shows nothing).
  const progressPctValue =
    progress.progressPct === '' || Number.isNaN(Number(progress.progressPct))
      ? null
      : Number(progress.progressPct)

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25'

  // Location state labels (§16) — derived from real state, never invented.
  const locationStateNote = () => {
    if (locError) {
      return (
        <p className="flex items-center gap-1 text-[10px] text-amber-600">
          <AlertTriangle className="h-3 w-3" /> {locError}
        </p>
      )
    }
    if (locDenied) {
      return (
        <p className="flex items-center gap-1 text-[10px] text-amber-600">
          <AlertTriangle className="h-3 w-3" /> Location permission was denied. Project location retained.
        </p>
      )
    }
    if (location && location.source === 'device') {
      return (
        <p className="flex items-center gap-1 text-[10px] text-green-600">
          <CheckCircle2 className="h-3 w-3" /> Using your current location.
        </p>
      )
    }
    return (
      <p className="flex items-center gap-1 text-[10px] text-gray-500">
        <MapPin className="h-3 w-3" /> Using project location.
      </p>
    )
  }

  // Real distance check (haversine) against the project's registered
  // coordinates — only when a device reading exists. No fake GPS validation.
  const distanceNote = (() => {
    if (!selectedProject || !location || location.source !== 'device') return null
    const distance = distanceKm(location, selectedProject)
    return distance <= LOCATION_MATCH_KM ? (
      <p className="flex items-center gap-1 text-[10px] text-green-600">
        <CheckCircle2 className="h-3 w-3" /> Location verified — {distance.toFixed(1)} km from the project site.
      </p>
    ) : (
      <p className="flex items-center gap-1 text-[10px] text-amber-600">
        <AlertTriangle className="h-3 w-3" /> Location differs from the project site — {distance.toFixed(1)} km away.
      </p>
    )
  })()

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Field Update</h3>
        <p className="text-[11px] text-gray-400">Record a new field-level project update</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {submitError ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <span>Unable to submit field update. Your entries are preserved — please retry.</span>
            <Button type="button" variant="outline" size="sm" onClick={handleSubmit}>
              Retry
            </Button>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
          <Select
            label="Current Stage"
            value={stage}
            onChange={(e) => {
              setStage(e.target.value)
              setErrors((prev) => ({ ...prev, stage: undefined }))
            }}
            options={PROJECT_STAGES.map((s) => ({ value: s, label: s }))}
            error={errors.stage}
          />
          <Select
            label="Update Type"
            value={updateType}
            onChange={(e) => {
              setUpdateType(e.target.value)
              setErrors((prev) => ({ ...prev, updateType: undefined }))
            }}
            options={[
              { value: '', label: 'Select update type' },
              ...FIELD_UPDATE_TYPES.map((t) => ({ value: t, label: t })),
            ]}
            error={errors.updateType}
          />
        </div>

        {/* Read-only project summary — real data from the selected project */}
        {selectedProject ? (
          <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Selected Project
            </p>
            <ProjectInfo project={selectedProject} />
          </div>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-600">Project Status</span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              label="Families Affected"
              type="number"
              min="0"
              step="1"
              value={progress.affected}
              onChange={setProgressField('affected')}
              error={errors.affected}
            />
            <Input
              label="Families Compensated"
              type="number"
              min="0"
              step="1"
              value={progress.compensated}
              onChange={setProgressField('compensated')}
              error={errors.compensated}
              placeholder="Optional"
            />
            <Input
              label="Current Progress (%)"
              type="number"
              min="0"
              max="100"
              step="1"
              value={progress.progressPct}
              onChange={setProgressField('progressPct')}
              error={errors.progressPct}
              placeholder="Optional · 0–100"
            />
          </div>
          {/* Live progress indicator — updates as the value changes */}
          {progressPctValue !== null ? (
            <ProgressBar value={progressPctValue} color="bg-accent" showLabel className="pt-0.5" />
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label htmlFor="field-update-note" className="text-xs font-medium text-gray-600">
              Remarks / Field Observations
            </label>
            <span className={`text-[10px] ${NOTE_LIMIT - note.length < 50 ? 'text-amber-600' : 'text-gray-400'}`}>
              {NOTE_LIMIT - note.length} characters remaining
            </span>
          </div>
          <textarea
            id="field-update-note"
            rows={4}
            maxLength={NOTE_LIMIT}
            placeholder="Enter observations, issues, progress details, or important field information..."
            value={note}
            onChange={(e) => {
              setNote(e.target.value)
              setErrors((prev) => ({ ...prev, note: undefined }))
            }}
            className={inputClass}
          />
          {errors.note ? <span className="text-xs text-red-600">{errors.note}</span> : null}
        </div>

        {/* Evidence — optional. The backend has no evidence-upload endpoint, so
            the file stays client-side: filename/size metadata plus a local
            image preview. The File object is retained for a future
            multipart/form-data integration; nothing is uploaded. */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-600">Evidence</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleAttachmentChange}
            className="hidden"
          />

          {attachment ? (
            <div className="flex flex-wrap items-start gap-3 rounded-lg border border-gray-200 bg-gray-50/60 p-3">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={attachment.name}
                  className="h-20 w-28 shrink-0 rounded-md border border-gray-200 object-cover"
                />
              ) : (
                <span className="flex h-20 w-28 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400">
                  <Paperclip className="h-6 w-6" />
                </span>
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="truncate text-xs font-semibold text-gray-700" title={attachment.name}>
                  {attachment.name}
                </p>
                <p className="text-[10px] text-gray-400">{formatBytes(attachment.size)}</p>
                <button
                  type="button"
                  onClick={removeAttachment}
                  className="mt-1 inline-flex w-fit items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-100"
                >
                  <X className="h-3 w-3" /> Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Camera}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                Choose Photo
              </Button>
              <span className="text-[10px] text-gray-400">
                Optional · JPG, PNG images, or PDF, DOC, DOCX documents up to 10 MB
              </span>
            </div>
          )}
          {fileError ? <span className="text-xs text-red-600">{fileError}</span> : null}
        </div>

        {/* Location — the project's registered coordinates by default, with an
            optional device GPS reading and a real distance check (§14) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-600">📍 Update Location</span>

          <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Project Location
            </p>
            <dl className="grid grid-cols-1 gap-x-5 gap-y-2 text-[11px] sm:grid-cols-3">
              <div className="flex min-w-0 flex-col">
                <dt className="text-gray-400">District</dt>
                <dd className="truncate font-semibold text-gray-700">
                  {selectedProject ? selectedProject.district : '—'}
                </dd>
              </div>
              <div className="flex min-w-0 flex-col">
                <dt className="text-gray-400">Latitude</dt>
                <dd className="truncate font-semibold text-gray-700">
                  {selectedProject ? selectedProject.lat : '—'}
                </dd>
              </div>
              <div className="flex min-w-0 flex-col">
                <dt className="text-gray-400">Longitude</dt>
                <dd className="truncate font-semibold text-gray-700">
                  {selectedProject ? selectedProject.lng : '—'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {location && location.source === 'device' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-600">
                <Navigation className="h-3 w-3" />
                {location.lat}, {location.lng} · Current location
              </span>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Navigation}
              onClick={handleUseMyLocation}
              disabled={locating}
            >
              {locating ? 'Locating…' : 'Use My Location'}
            </Button>
          </div>
          {locationStateNote()}
          {distanceNote}
        </div>

        <div className="flex items-center justify-between border-t border-gray-50 pt-3">
          <p className="text-[10px] text-gray-400">
            Submitted as {user ? `${user.name} · ${user.role}` : '—'}
          </p>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : saved ? 'Saved ✓' : 'Submit Update'}
          </Button>
        </div>
      </form>
    </section>
  )
}
