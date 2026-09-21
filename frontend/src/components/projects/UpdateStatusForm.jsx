import { useState } from 'react'
import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'
import Select from '../common/Select.jsx'
import Input from '../common/Input.jsx'
import { PROJECT_STAGES } from '../../utils/constants'
import { updateProjectStatus } from '../../api/projects.api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useProjects } from '../../hooks/useProjects.js'

export default function UpdateStatusForm({ open, onClose, project }) {
  // Always query projects so we have real data if project is not passed (e.g. from general "Add Update" button)
  const { projects, loading: projectsLoading } = useProjects({ pageSize: 100 })
  
  const initialProjectId = project ? project.id : (projects[0]?.id || '')
  const [projectId, setProjectId] = useState(initialProjectId)
  const [stage, setStage] = useState(project ? project.stage : PROJECT_STAGES[0])
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, payload }) => updateProjectStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setNote('')
        onClose()
      }, 900)
    },
    onError: (err) => {
      // If we need to swallow AbortError by name
      if (err.name === 'AbortError') return
      console.error('Update status failed:', err)
      alert(`Update failed: ${err.message}`)
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Find the currently selected project or use the initial
    const targetId = project ? project.id : (projectId || initialProjectId)
    if (!targetId) return

    mutation.mutate({ id: targetId, payload: { stage, note } })
  }

  const submitting = mutation.isPending

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
          <Button type="submit" form="update-status-form" disabled={submitting || projectsLoading}>
            {submitting ? 'Saving…' : submitted ? 'Saved ✓' : 'Save Update'}
          </Button>
        </>
      }
    >
      <form id="update-status-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Select
          label="Project"
          value={project ? project.id : (projectId || initialProjectId)}
          onChange={(e) => setProjectId(e.target.value)}
          options={projectsLoading ? [{value: '', label: 'Loading...'}] : projects.map((p) => ({ value: p.id, label: `${p.id} — ${p.name}` }))}
          disabled={Boolean(project) || projectsLoading}
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
