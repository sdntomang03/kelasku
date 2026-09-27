import { apiRequest } from '../api/client'

export const authService = {
  login: (credentials) => apiRequest('/login', { method: 'POST', body: credentials }),
  register: (registration) => apiRequest('/register', { method: 'POST', body: registration }),
  resendVerification: (email) => apiRequest('/email/verification-notification', { method: 'POST', body: { email } }),
  logout: () => apiRequest('/logout', { method: 'POST', body: {} }),
  profile: () => apiRequest('/profile'),
}
