export function isExamCompleted(exam) {
  return String(exam?.status || '').toLowerCase() === 'completed'
}

export function isExamOngoing(exam) {
  return ['ongoing', 'in_progress', 'active'].includes(exam?.status)
}

export function isExamLocked(exam) {
  return Boolean(exam?.is_locked || exam?.locked || exam?.attempt?.is_locked)
}

export function examRequiresToken(exam) {
  return Boolean(exam?.require_token ?? exam?.requires_token ?? exam?.config?.require_token)
}

export function examShowsExplanation(exam, result) {
  return Boolean(result?.show_explanation ?? result?.config?.show_explanation ?? exam?.show_explanation ?? exam?.config?.show_explanation)
}

export function getSchoolName(student) {
  return student?.school?.name || student?.school_name || 'Sekolah'
}

export function getClassName(student) {
  return student?.classroom?.name || student?.classroom_name || 'Kelas belum tersedia'
}
