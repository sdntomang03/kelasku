import { apiRequest } from '../api/client'

export const authService = {
  login: (credentials) => apiRequest('/login', { method: 'POST', body: credentials }),
  logout: () => apiRequest('/logout', { method: 'POST', body: {} }),
  profile: () => apiRequest('/profile'),
}
