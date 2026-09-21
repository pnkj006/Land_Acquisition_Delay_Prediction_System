import { fetchClient } from './fetchClient'

export async function getConfig() {
  const res = await fetchClient('/config')
  return res.data
}
