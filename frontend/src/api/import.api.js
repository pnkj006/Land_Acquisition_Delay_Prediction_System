import { fetchClient } from './fetchClient'

/**
 * Import projects from a CSV file.
 *
 * Important:
 * Do NOT set Content-Type manually.
 * The browser sets multipart/form-data with the boundary.
 */
export async function importProjects(file) {
  const token = localStorage.getItem('token')

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/v1/imports/projects', {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  if (response.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  let result

  try {
    result = await response.json()
  } catch {
    throw new Error('Invalid response from server')
  }

  if (!response.ok) {
    const message =
      result?.message ||
      result?.error ||
      'Failed to import projects'

    const error = new Error(message)
    error.status = response.status
    error.info = result

    throw error
  }

  return result
}