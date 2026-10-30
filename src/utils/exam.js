export function isExamCompleted(exam) {
  return String(exam?.status || '').toLowerCase() === 'completed'
}

export function isExamExpired(exam, now = Date.now()) {
  const endTime = Date.parse(exam?.end_time)
  return Number.isFinite(endTime) && endTime <= now
}

export function getExamQuestionCount(exam) {
  const count = [
    exam?.total_questions,
    exam?.question_count,
    exam?.questions_count,
    exam?.question_ids?.length,
    exam?.questionIds?.length,
    exam?.questions?.length,
  ].find((value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0)
  if (count !== undefined) return Number(count)

  const sectionCounts = (exam?.sections || []).map((section) => section.question_count ?? section.total_questions)
  if (sectionCounts.length && sectionCounts.every((value) => Number.isFinite(Number(value)))) {
    return sectionCounts.reduce((total, value) => total + Number(value), 0)
  }
  return null
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
  const value = exam?.show_explanation
    ?? exam?.config?.show_explanation
    ?? result?.exam?.show_explanation
    ?? result?.show_explanation
    ?? result?.config?.show_explanation
  return value === true || value === 1 || value === '1' || value === 'true'
}

export function getSchoolName(student) {
  return student?.school?.name || student?.school_name || 'Sekolah'
}

export function getClassName(student) {
  return student?.classroom?.name || student?.classroom_name || 'Kelas belum tersedia'
}
