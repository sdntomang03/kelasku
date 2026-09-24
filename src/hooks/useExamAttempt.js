import { useCallback, useState } from 'react'
import { attemptService } from '../services/attemptService'

export function useExamAttempt(attemptId) {
  const [questions, setQuestions] = useState({})
  const [answers, setAnswers] = useState({})
  const [doubtful, setDoubtful] = useState([])
  const [questionIds, setQuestionIds] = useState([])
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [attempt, setAttempt] = useState(null)

  const loadQuestion = useCallback(async (questionId, examConfig = {}) => {
    if (!attemptId || !questionId) return null
    const data = await attemptService.question(attemptId, questionId)
    setQuestions((current) => ({
      ...current,
      [questionId]: { ...data.question, _randomized: examConfig.random_question ?? false },
    }))
    if (data.answer !== null && data.answer !== undefined) {
      let savedAnswer = data.answer
      if (typeof savedAnswer === 'string' && ['multiple_choice', 'complex_choice', 'matching', 'true_false', 'true_false_multi'].includes(data.question.type)) {
        try {
          savedAnswer = JSON.parse(savedAnswer)
        } catch {
          // API can return a plain string/JSON depending on the answer type.
        }
      }
      setAnswers((current) => ({ ...current, [questionId]: savedAnswer }))
    }
    setDoubtful((current) => {
      const next = data.is_doubtful && !current.includes(questionId)
        ? [...current, questionId]
        : current.filter((id) => id !== questionId || data.is_doubtful)
      return next
    })
    return data
  }, [attemptId])

  const saveAnswer = useCallback(async (questionId, answer, isDoubtful = doubtful.includes(questionId)) => {
    if (!attemptId) return null
    setAnswers((current) => ({ ...current, [questionId]: answer }))
    const data = await attemptService.answer(attemptId, {
      question_id: questionId,
      answer,
      is_doubtful: isDoubtful,
    })
    if (data?.is_doubtful) {
      setDoubtful((current) => current.includes(questionId) ? current : [...current, questionId])
    }
    return data
  }, [attemptId, doubtful])

  const toggleDoubtful = useCallback(async (questionId, existingAnswers = answers) => {
    const nextValue = !doubtful.includes(questionId)
    setDoubtful((current) => nextValue ? [...current, questionId] : current.filter((id) => id !== questionId))
    if (existingAnswers[questionId] !== undefined) {
      return saveAnswer(questionId, existingAnswers[questionId], nextValue)
    }
    return null
  }, [answers, doubtful, saveAnswer])

  return {
    attempt,
    setAttempt,
    questions,
    setQuestions,
    answers,
    setAnswers,
    doubtful,
    setDoubtful,
    questionIds,
    setQuestionIds,
    activeQuestion,
    setActiveQuestion,
    loadQuestion,
    saveAnswer,
    toggleDoubtful,
  }
}
