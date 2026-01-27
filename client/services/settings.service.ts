import { fetchAPI } from '@/lib/api'

export async function getSettings(): Promise<Record<string, any>> {
  return fetchAPI<Record<string, any>>('/settings', { method: 'GET' }, true)
}

export async function updateSettings(settings: Record<string, any>): Promise<Record<string, any>> {
  return fetchAPI<Record<string, any>>(
    '/settings',
    {
      method: 'PATCH',
      body: JSON.stringify(settings),
    },
    true
  )
}
