import { useEffect } from 'react'

export function useExamSecurity({ enabled, onViolation, locked }) {
  useEffect(() => {
    if (!enabled || locked) return undefined
    const report = () => onViolation()
    const onVisibility = () => { if (document.hidden) report() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', report)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', report)
    }
  }, [enabled, locked, onViolation])
}
