export function formatQuestionType(type) {
  return {
    single_choice: 'Pilihan tunggal',
    tkp: 'Pilihan tunggal',
    multiple_choice: 'Pilihan kompleks',
    complex_choice: 'Pilihan kompleks',
    true_false: 'Benar / Salah',
    true_false_multi: 'Benar / Salah',
    matching: 'Menjodohkan',
    essay: 'Isian singkat',
  }[type] || type?.replaceAll('_', ' ') || 'Soal'
}

export function answerExists(answer) {
  return Array.isArray(answer)
    ? answer.length > 0
    : answer && typeof answer === 'object'
      ? Object.keys(answer).length > 0
      : answer !== undefined && answer !== null && answer !== ''
}

export function shuffle(items) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[randomIndex]] = [result[randomIndex], result[index]]
  }
  return result
}

export function randomizeQuestion(question, config) {
  if (!config?.random_answer) return question
  const randomized = { ...question }
  if (Array.isArray(question.options)) randomized.options = shuffle(question.options)
  if (question.type === 'matching' && Array.isArray(question.matches)) {
    randomized.target_options = shuffle(question.matches.map((match) => ({ id: match.id, text: match.target_text })))
  }
  return randomized
}
