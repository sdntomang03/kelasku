export function getSectionScoreDetails(section) {
  const questionCount = getQuestionCount(section)
  const isTkp = isTkpSection(section)
  const unanswered = Math.max(0, Number(section.tidak_dijawab) || 0)
  const stats = [
    {
      label: isTkp ? 'Dijawab' : 'Benar',
      value: isTkp ? Math.max(0, questionCount - unanswered) : section.benar ?? 0,
      className: 'correct',
    },
    {
      label: 'Salah',
      value: isTkp ? 0 : section.salah ?? 0,
      className: 'incorrect',
    },
    {
      label: 'Tidak dijawab',
      value: section.tidak_dijawab ?? 0,
      className: 'unanswered',
    },
  ]

  return {
    questionCount,
    maximum: isTkp ? questionCount * 5 : section.maximum,
    stats,
  }
}

function getQuestionCount(section) {
  const explicitCount = section.question_count ?? section.total_questions ?? section.metadata?.question_count ?? section.metadata?.total_questions
  if (explicitCount !== null && explicitCount !== undefined && explicitCount !== '' && Number.isFinite(Number(explicitCount))) {
    return Number(explicitCount)
  }
  const counts = [section.benar, section.salah, section.tidak_dijawab].map((value) => Number(value))
  return counts.every(Number.isFinite) ? counts.reduce((total, count) => total + count, 0) : 0
}

function isTkpSection(section) {
  if (section.is_tkp === true) return true

  const labels = [
    section.section_name,
    section.name,
    section.code,
    section.type,
    section.question_type,
    section.section?.name,
    section.scoring_profile?.code,
    section.scoring_profile?.name,
  ]
  return labels.some((label) => typeof label === 'string' && /(?:\btkp\b|tes\s+karakteristik\s+pribadi)/i.test(label))
}
