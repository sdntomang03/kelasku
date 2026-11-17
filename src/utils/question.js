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

function shuffleWithSeed(items, seed) {
  const result = [...items]
  let state = 2166136261
  for (const character of String(seed)) {
    state = Math.imul(state ^ character.charCodeAt(0), 16777619)
  }
  const nextRandom = () => {
    state = (state + 0x6D2B79F5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(nextRandom() * (index + 1))
    ;[result[index], result[randomIndex]] = [result[randomIndex], result[index]]
  }
  return result
}

export function shuffleQuestionIdsBySection(sections, questionIds) {
  const ids = Array.isArray(questionIds) ? questionIds : []
  if (!Array.isArray(sections) || sections.length === 0) return ids

  const availableIds = new Set(ids)
  const groupedIds = new Set()
  const sectionGroups = (Array.isArray(sections) ? sections : []).map((section) => {
    const sectionIds = (Array.isArray(section.question_ids) ? section.question_ids : [])
      .filter((id) => availableIds.has(id) && !groupedIds.has(id))
    sectionIds.forEach((id) => groupedIds.add(id))
    return shuffle(sectionIds)
  })

  if (ids.some((id) => !groupedIds.has(id))) return ids
  return sectionGroups.flat()
}

export function randomizeQuestion(question, config, seed) {
  if (!config?.random_answer) return question
  const randomized = { ...question }
  const randomize = (items, suffix) => seed === undefined ? shuffle(items) : shuffleWithSeed(items, `${seed}:${suffix}`)
  if (Array.isArray(question.options)) randomized.options = randomize(question.options, 'options')
  if (question.type === 'matching' && Array.isArray(question.matches)) {
    randomized.target_options = randomize(question.matches.map((match) => ({ id: match.id, text: match.target_text })), 'targets')
  }
  return randomized
}
