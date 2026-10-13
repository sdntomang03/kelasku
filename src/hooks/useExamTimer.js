import { useEffect } from 'react'

export function useExamTimer(timeLeftOrConfig, setTimeLeft, enabled = true) {
  const config = typeof timeLeftOrConfig === 'object' && timeLeftOrConfig !== null
    ? timeLeftOrConfig
    : { timeLeft: timeLeftOrConfig, setTimeLeft, enabled }
  const { timeLeft, setTimeLeft: updateTimeLeft, enabled: isEnabled = true } = config

  useEffect(() => {
    if (!isEnabled) return undefined
    const timer = setInterval(() => {
      if (typeof updateTimeLeft === 'function') {
        updateTimeLeft((seconds) => {
          const remaining = Number(seconds)
          return Number.isFinite(remaining) ? Math.max(0, remaining - 1) : 0
        })
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [isEnabled, updateTimeLeft])

  return timeLeft
}
