export const endpoints = {
  login: '/login',
  logout: '/logout',
  profile: '/profile',
  dashboard: '/dashboard',
  exams: '/exams',
  exam: (id) => `/exams/${id}`,
  startExam: (id) => `/exams/${id}/start`,
  question: (attemptId, questionId) => `/attempts/${attemptId}/questions/${questionId}`,
  answer: (attemptId) => `/attempts/${attemptId}/answers`,
  violation: (attemptId) => `/attempts/${attemptId}/violation`,
  submit: (attemptId) => `/attempts/${attemptId}/submit`,
  result: (attemptId) => `/attempts/${attemptId}/result`,
}
