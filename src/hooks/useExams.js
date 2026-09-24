import { useCallback, useState } from 'react'
import { examService } from '../services/examService'

export function useExams(enabled = true) {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(false)
  const refresh = useCallback(async () => {
    setLoading(true)
    try { setExams(await examService.list()) } finally { setLoading(false) }
  }, [])
  return { exams, setExams, loading, refresh, enabled }
}
