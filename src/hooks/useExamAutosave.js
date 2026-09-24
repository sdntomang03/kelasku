import { useCallback } from 'react'
import { attemptService } from '../services/attemptService'

export function useExamAutosave(attemptId) {
  return useCallback((questionId, answer, isDoubtful = false) => {
    if (!attemptId) return Promise.resolve(null)
    return attemptService.answer(attemptId, { question_id: questionId, answer, is_doubtful: isDoubtful })
  }, [attemptId])
}
