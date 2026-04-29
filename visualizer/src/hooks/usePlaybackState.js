import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Custom hook for managing playback state across visualizers.
 * Consolidates: stepIndex, isPlaying, speed management + interval loop + handlers
 * 
 * @param {number} stepsLength - Total number of steps available
 * @param {number} initialSpeed - Initial speed in milliseconds per step
 * @returns {Object} Playback state and handlers
 */
export function usePlaybackState(stepsLength, initialSpeed = 500) {
  const [stepIndex, setStepIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(initialSpeed)
  const intervalRef = useRef(null)

  const isDone = stepIndex === stepsLength - 1
  const currentStep = stepIndex >= 0 ? stepIndex : null

  // Step forward
  const stepForward = useCallback(() => {
    setStepIndex((prev) => {
      if (prev >= stepsLength - 1) {
        setIsPlaying(false)
        return prev
      }
      return prev + 1
    })
  }, [stepsLength])

  // Step backward
  const stepBack = useCallback(() => {
    setStepIndex((prev) => Math.max(-1, prev - 1))
  }, [])

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    setStepIndex((prev) => {
      if (prev >= stepsLength - 1) return -1
      return prev
    })
    setIsPlaying((prev) => !prev)
  }, [stepsLength])

  // Reset to beginning
  const handleReset = useCallback(() => {
    setStepIndex(-1)
    setIsPlaying(false)
  }, [])

  // Playback interval effect
  useEffect(() => {
    clearInterval(intervalRef.current)
    if (isPlaying && stepsLength > 0) {
      intervalRef.current = setInterval(() => {
        setStepIndex((prev) => {
          if (prev >= stepsLength - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, speed)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, speed, stepsLength])

  return {
    stepIndex,
    setStepIndex,
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
    stepForward,
    stepBack,
    togglePlay,
    handleReset,
    isDone,
    currentStep,
  }
}
