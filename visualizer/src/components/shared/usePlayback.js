import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Shared playback hook for all algorithm visualizers.
 * Encapsulates step navigation, play/pause, speed, and interval management.
 *
 * @param {Array} steps - The pre-computed step array from the visualizer.
 * @returns Playback state and handlers.
 */
export function usePlayback(steps) {
  const [stepIndex, setStepIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(520) // ms per step
  const intervalRef = useRef(null)

  // stepForward deps on steps.length so the interval always uses the latest total.
  const stepForward = useCallback(() => {
    setStepIndex(cur => {
      if (cur >= steps.length - 1) {
        setIsPlaying(false)
        return cur
      }
      return cur + 1
    })
  }, [steps.length])

  const stepBack = useCallback(() => {
    setStepIndex(cur => Math.max(-1, cur - 1))
  }, [])

  /** Reset to the initial unstarted state. Call this when new steps are generated. */
  const reset = useCallback(() => {
    setStepIndex(-1)
    setIsPlaying(false)
  }, [])

  /**
   * Toggle play/pause. If at the last step, rewinds to the beginning before playing.
   * Uses functional updates to avoid stale closures on stepIndex.
   */
  const togglePlay = useCallback(() => {
    // Rewind if at end
    setStepIndex(cur => (cur >= steps.length - 1 ? -1 : cur))
    setIsPlaying(p => !p)
  }, [steps.length])

  // Playback interval — recreated whenever isPlaying, speed, or stepForward changes.
  useEffect(() => {
    clearInterval(intervalRef.current)
    if (isPlaying) {
      intervalRef.current = setInterval(stepForward, speed)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, speed, stepForward])

  const currentStep = stepIndex >= 0 ? steps[stepIndex] : null
  const isDone = steps.length > 0 && stepIndex === steps.length - 1
  const progress = steps.length > 0 ? ((stepIndex + 1) / steps.length) * 100 : 0

  return {
    stepIndex,
    setStepIndex,
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
    stepForward,
    stepBack,
    reset,
    togglePlay,
    currentStep,
    isDone,
    progress,
  }
}
