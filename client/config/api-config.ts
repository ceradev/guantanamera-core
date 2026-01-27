export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
export const API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || ''

export type ApiHeaders = {
  'Content-Type': string
  'x-api-key'?: string
}

export const getHeaders = (isProtected: boolean = false): ApiHeaders => {
  const headers: ApiHeaders = {
    'Content-Type': 'application/json',
  }
  if (isProtected && API_KEY) {
    headers['x-api-key'] = API_KEY
  }
  return headers
}

