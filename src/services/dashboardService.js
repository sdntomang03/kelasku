import { apiRequest } from '../api/client'

export const dashboardService = {
  get: () => apiRequest('/dashboard'),
}
