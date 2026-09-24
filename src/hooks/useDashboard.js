import { useCallback, useState } from 'react'
import { dashboardService } from '../services/dashboardService'

export function useDashboard(enabled = true) {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(false)
  const refresh = useCallback(async () => {
    setLoading(true)
    try { setDashboard(await dashboardService.get()) } finally { setLoading(false) }
  }, [])
  return { dashboard, setDashboard, loading, refresh, enabled }
}
