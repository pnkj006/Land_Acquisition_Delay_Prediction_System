import { fetchClient } from './fetchClient'

/**
 * Get the Project Manager assigned to a project.
 */
export async function getProjectAssignment(projectId) {
  const res = await fetchClient(
    `/projects/${projectId}/assignments`,
  )

  return {
    data: res.data ?? null,
  }
}

/**
 * Assign a Project Manager to a project.
 *
 * userId:
 *   number -> assign PM
 *   null   -> remove PM
 */
export async function assignProjectManager(
  projectId,
  userId,
) {
  const res = await fetchClient(
    `/projects/${projectId}/assignments`,
    {
      method: 'PUT',
      body: {
        userIds: userId ? [Number(userId)] : [],
      },
    },
  )

  return {
    data: res.data,
  }
}