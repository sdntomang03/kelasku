import { useCallback, useState } from 'react'
import { authService } from '../services/authService'

export function useAuth() {
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(false)
  const login = useCallback(async (credentials) => {
    setLoading(true)
    try {
      const data = await authService.login(credentials)
      localStorage.setItem('cbt_token', data.token)
      setStudent(data.student)
      return data
    } finally {
      setLoading(false)
    }
  }, [])
  const logout = useCallback(async () => {
    await authService.logout()
    localStorage.removeItem('cbt_token')
    setStudent(null)
  }, [])
  return { student, setStudent, loading, login, logout }
}
