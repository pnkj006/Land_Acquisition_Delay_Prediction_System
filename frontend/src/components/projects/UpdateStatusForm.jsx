import { useEffect, useState } from 'react'
import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'
import Select from '../common/Select.jsx'
import Input from '../common/Input.jsx'
import { PROJECT_STAGES } from '../../utils/constants'
import { updateProjectStatus } from '../../api/projects.api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useProjects } from '../../hooks/useProjects.js'

const STAGE_VALUES = {
  Notification: 'NOTIFICATION',
  Approval: 'APPROVAL',
  'Land Acquisition': 'LAND_ACQUISITION',
  Compensation: 'COMPENSATION',
  Rehabilitation: 'REHABILITATION',
  Possession: 'POSSESSION',
}

const STAGE_LABELS = {
  NOTIFICATION: 'Notification',
  APPROVAL: 'Approval',
  LAND_ACQUISITION: 'Land Acquisition',
  COMPENSATION: 'Compensation',
  REHABILITATION: 'Rehabilitation',
  POSSESSION: 'Possession',
}

function getStageLabel(stage) {
  if (!stage) return PROJECT_STAGES[0]

  // Backend enum → frontend label
  if (STAGE_LABELS[stage]) {
    return STAGE_LABELS[stage]
  }

  // Already a frontend label
  if (STAGE_VALUES[stage]) {
    return stage
  }

  return PROJECT_STAGES[0]
}

export default function UpdateStatusForm({
  open,
  onClose,
  project,
}) {
  const {
    projects,
    loading: projectsLoading,
  } = useProjects({
    pageSize: 100,
  })

  const queryClient = useQueryClient()

  const [projectId, setProjectId] = useState('')
  const [stage, setStage] = useState(PROJECT_STAGES[0])
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)

  /*
   * Reset form whenever the modal opens or
   * the selected project changes.
   */
  useEffect(() => {
    if (!open) return

    const selectedProjectId =
      project?.id ||
      projects[0]?.id ||
      ''

    const selectedStage = getStageLabel(
      project?.stage
    )

    setProjectId(selectedProjectId)
    setStage(selectedStage)
    setNote('')
    setSubmitted(false)
  }, [open, project, projects])

  const mutation = useMutation({
    mutationFn: ({ id, payload }) =>
      updateProjectStatus(id, payload),

    onSuccess: async () => {
      /*
       * Refresh project list.
       */
      await queryClient.invalidateQueries({
        queryKey: ['projects'],
      })

      /*
       * Refresh the currently opened project.
       */
      if (projectId) {
        await queryClient.invalidateQueries({
          queryKey: ['projects', projectId],
        })
      }

      setSubmitted(true)

      setTimeout(() => {
        setSubmitted(false)
        setNote('')
        onClose()
      }, 900)
    },

    onError: (err) => {
      if (err?.name === 'AbortError') return

      console.error(
        'Update status failed:',
        err
      )

      alert(
        `Update failed: ${
          err?.info?.message ||
          err?.message ||
          'Unknown error'
        }`
      )
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    const targetId =
      project?.id ||
      projectId

    if (!targetId) {
      alert('Please select a project.')
      return
    }

    /*
     * Convert frontend display value:
     *
     * "Land Acquisition"
     *
     * into backend Prisma enum:
     *
     * "LAND_ACQUISITION"
     */
    const backendStage =
      STAGE_VALUES[stage] || stage

    mutation.mutate({
      id: targetId,
      payload: {
        stage: backendStage,
      },
    })
  }

  const submitting = mutation.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Field Update"
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="update-status-form"
            disabled={
              submitting ||
              projectsLoading
            }
          >
            {submitting
              ? 'Saving…'
              : submitted
                ? 'Saved ✓'
                : 'Save Update'}
          </Button>
        </>
      }
    >
      <form
        id="update-status-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-3"
      >
        {/* Project */}
        <Select
          label="Project"
          value={project?.id || projectId}
          onChange={(e) =>
            setProjectId(e.target.value)
          }
          options={
            projectsLoading
              ? [
                  {
                    value: '',
                    label: 'Loading...',
                  },
                ]
              : projects.map((p) => ({
                  value: p.id,
                  label: `${p.id} — ${p.name}`,
                }))
          }
          disabled={
            Boolean(project) ||
            projectsLoading
          }
        />

        {/* New stage */}
        <Select
          label="New Stage"
          value={stage}
          onChange={(e) =>
            setStage(e.target.value)
          }
          options={PROJECT_STAGES.map(
            (stageName) => ({
              value: stageName,
              label: stageName,
            })
          )}
        />

        {/* Note */}
        <Input
          label="Field Note"
          placeholder="e.g. Joint survey completed for 3 disputed parcels"
          value={note}
          onChange={(e) =>
            setNote(e.target.value)
          }
        />
      </form>
    </Modal>
  )
}