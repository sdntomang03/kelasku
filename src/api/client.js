const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1/student'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('cbt_token')
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const payload = await response.json()
  if (!response.ok || payload.success === false) {
    throw new ApiError(payload.message || 'Request gagal', response.status)
  }
  return payload.data
}

export { API_BASE }
