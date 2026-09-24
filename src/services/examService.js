import { apiRequest } from '../api/client'

export const examService = {
  list: () => apiRequest('/exams'),
  detail: (id) => apiRequest(`/exams/${id}`),
  start: (id, token = '') => apiRequest(`/exams/${id}/start`, {
    method: 'POST',
    body: token.trim() ? { token: token.trim() } : {},
  }),
}
