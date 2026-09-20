/**
 * The backend already exposes this public endpoint. Other frontend data
 * modules remain mock-backed, but registration must not fabricate success.
 */
export async function registerAccount({ name, email, password, role }) {
  let response
  try {
    response = await fetch('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    })
  } catch {
    throw new Error('Account creation requires the authentication service to be available.')
  }

  let payload = null
  try {
    payload = await response.json()
  } catch {
    throw new Error('The authentication service returned an invalid response.')
  }

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'Unable to create the account. Please try again.')
  }

  return payload.data
}
