import { useState } from 'react'
import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'
import Select from '../common/Select.jsx'
import Input from '../common/Input.jsx'
import { PROJECT_STAGES } from '../../utils/constants'
import { updateProjectStatus, MOCK_PROJECTS } from '../../api/projects.api'

export default function UpdateStatusForm({ open, onClose, project }) {
  const [projectId, setProjectId] = useState(project ? project.id : MOCK_PROJECTS[0].id)
  const [stage, setStage] = useState(project ? project.stage : PROJECT_STAGES[0])
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    // Mock submit — swap for a real API endpoint later.
    await updateProjectStatus(projectId, { stage, note })
    setSubmitting(false)
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setNote('')
      onClose()
    }, 900)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Field Update"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="update-status-form" disabled={submitting}>
            {submitting ? 'Saving…' : submitted ? 'Saved ✓' : 'Save Update'}
          </Button>
        </>
      }
    >
      <form id="update-status-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Select
          label="Project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          options={MOCK_PROJECTS.map((p) => ({ value: p.id, label: `${p.id} — ${p.name}` }))}
          disabled={Boolean(project)}
        />
        <Select
          label="New Stage"
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          options={PROJECT_STAGES.map((s) => ({ value: s, label: s }))}
        />
        <Input
          label="Field Note"
          placeholder="e.g. Joint survey completed for 3 disputed parcels"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </form>
    </Modal>
  )
}
