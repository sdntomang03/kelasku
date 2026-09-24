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
        updateTimeLeft((seconds) => Math.max(0, Number(seconds) - 1))
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [isEnabled, updateTimeLeft, timeLeft])

  return timeLeft
}
