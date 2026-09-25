import { apiRequest } from '../api/client'

export const attemptService = {
  list: () => apiRequest('/attempts'),
  detail: (attemptId) => apiRequest(`/attempts/${attemptId}`),
  start: (examId, token = '') => apiRequest(`/exams/${examId}/start`, {
    method: 'POST',
    body: token.trim() ? { token: token.trim() } : {},
  }),
  question: (attemptId, questionId) => apiRequest(`/attempts/${attemptId}/questions/${questionId}`),
  answer: (attemptId, body) => apiRequest(`/attempts/${attemptId}/answers`, { method: 'POST', body }),
  violation: (attemptId) => apiRequest(`/attempts/${attemptId}/violation`, { method: 'POST', body: {} }),
  submit: (attemptId) => apiRequest(`/attempts/${attemptId}/submit`, { method: 'POST', body: {} }),
  result: (attemptId) => apiRequest(`/attempts/${attemptId}/result`),
  discussion: (attemptId) => apiRequest(`/attempts/${attemptId}/discussion`),
}
