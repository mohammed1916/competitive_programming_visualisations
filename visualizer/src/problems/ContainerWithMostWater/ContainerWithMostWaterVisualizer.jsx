import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './ContainerWithMostWaterVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution:' },
  { line: 2, text: '    def maxArea(self, height: List[int]) -> int:' },
  { line: 3, text: '        left, right = 0, len(height) - 1' },
  { line: 4, text: '        max_area = 0' },
  { line: 5, text: '        while left < right:' },
  { line: 6, text: '            area = min(height[left], height[right]) * (right - left)' },
  { line: 7, text: '            max_area = max(max_area, area)' },
  { line: 8, text: '            if height[left] < height[right]:' },
  { line: 9, text: '                left += 1' },
  { line: 10, text: '            else:' },
  { line: 11, text: '                right -= 1' },
  { line: 12, text: '        return max_area' },
]

function generateSteps(height) {
  const steps = []
  let left = 0
  let right = height.length - 1
  let maxArea = 0

  steps.push({
    phase: 'init',
    left,
    right,
    maxArea,
    currentArea: null,
    activeLine: 3,
    message: 'Initialize left and right pointers at the ends of the array.',
  })

  while (left < right) {
    const w = right - left
    const h = Math.min(height[left], height[right])
    const area = w * h

    steps.push({
      phase: 'compute',
      left,
      right,
      maxArea,
      currentArea: area,
      activeLine: 6,
      message: `Calculate area: width=${w}, height=min(${height[left]}, ${height[right]})=${h}. Area=${area}.`,
    })

    if (area > maxArea) {
      maxArea = area
      steps.push({
        phase: 'update',
        left,
        right,
        maxArea,
        currentArea: area,
        activeLine: 7,
        message: `New max area found! Update max_area to ${maxArea}.`,
      })
    } else {
      steps.push({
        phase: 'skip',
        left,
        right,
        maxArea,
        currentArea: area,
        activeLine: 7,
        message: `Area ${area} is not greater than max_area ${maxArea}.`,
      })
    }

    if (height[left] < height[right]) {
      steps.push({
        phase: 'move',
        left,
        right,
        maxArea,
        currentArea: null,
        activeLine: 9,
        message: `height[left] < height[right] (${height[left]} < ${height[right]}). Move left pointer inwards to find a taller line.`,
      })
      left++
    } else {
      steps.push({
        phase: 'move',
        left,
        right,
        maxArea,
        currentArea: null,
        activeLine: 11,
        message: `height[left] >= height[right] (${height[left]} >= ${height[right]}). Move right pointer inwards to find a taller line.`,
      })
      right--
    }
  }

  steps.push({
    phase: 'done',
    left,
    right,
    maxArea,
    currentArea: null,
    activeLine: 12,
    message: `Pointers met. Maximum area is ${maxArea}.`,
  })

  return steps
}

const EXAMPLES = [
  { label: 'Classic', height: [1, 8, 6, 2, 5, 4, 8, 3, 7] },
  { label: 'Simple', height: [1, 1] },
  { label: 'Mountain', height: [2, 3, 4, 5, 18, 17, 6] },
  { label: 'Valley', height: [10, 2, 1, 3, 9] },
]

export default function ContainerWithMostWaterVisualizer() {
  const [heightInput, setHeightInput] = useState('[1, 8, 6, 2, 5, 4, 8, 3, 7]')

  const { height, inputError } = useMemo(() => {
    try {
      const h = JSON.parse(heightInput)
      if (!Array.isArray(h) || h.some((x) => typeof x !== 'number' || x < 0)) throw new Error()
      if (h.length < 2) throw new Error('Array must have at least 2 elements')
      return { height: h, inputError: '' }
    } catch {
      return { height: [1, 8, 6, 2, 5, 4, 8, 3, 7], inputError: 'Invalid input array' }
    }
  }, [heightInput])

  const steps = useMemo(() => generateSteps(height), [height])

  const {
    stepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length)

  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setHeightInput(JSON.stringify(ex.height))
    handleReset()
  }, [handleReset])

  const maxHeightValue = Math.max(...height, 1)

  return (
    <div className="container-water-shell">
      <div className="container-water-top">
        <div className="cw-panel">
          <div className="cw-panel-head">
            Input Array (Heights)
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
          </div>
          <div className="cw-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => applyExample(ex)}
                  className="cw-example-btn"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <input
              value={heightInput}
              onChange={(e) => { setHeightInput(e.target.value); handleReset() }}
              placeholder="[1,8,6,2,5,4,8,3,7]"
              className="cw-input"
            />

            <div className="cw-chart-container">
              {step && step.left !== null && step.right !== null && step.phase !== 'done' && (
                <div
                  className="cw-water-fill"
                  style={{
                    left: `calc(${(step.left / Math.max(height.length - 1, 1)) * 100}% + 12px)`,
                    right: `calc(${100 - (step.right / Math.max(height.length - 1, 1)) * 100}% - 12px)`,
                    height: `${(Math.min(height[step.left], height[step.right]) / maxHeightValue) * 100}%`,
                  }}
                />
              )}
              {height.map((h, i) => {
                const isLeft = step?.left === i
                const isRight = step?.right === i
                const isActive = isLeft || isRight

                return (
                  <div key={i} className="cw-bar-wrapper">
                    <div className="cw-bar-value">{h}</div>
                    <motion.div
                      className={`cw-bar ${isActive ? 'active' : ''}`}
                      style={{ height: `${(h / maxHeightValue) * 100}%` }}
                      layout
                    />
                    <div className="cw-pointer-label">
                      {isLeft ? 'L' : isRight ? 'R' : ''}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="container-water-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />

        <div className="cw-panel">
          <div className="cw-panel-head">Variables</div>
          <div className="cw-panel-body">
            <div className="cw-vars">
              <div className="cw-var-row">
                <span className="cw-var-name">left</span>
                <span className="cw-var-val">{step?.left ?? '–'}</span>
              </div>
              <div className="cw-var-row">
                <span className="cw-var-name">right</span>
                <span className="cw-var-val">{step?.right ?? '–'}</span>
              </div>
              <div className="cw-var-row">
                <span className="cw-var-name">height[left]</span>
                <span className="cw-var-val">{step ? height[step.left] : '–'}</span>
              </div>
              <div className="cw-var-row">
                <span className="cw-var-name">height[right]</span>
                <span className="cw-var-val">{step ? height[step.right] : '–'}</span>
              </div>
              <div className="cw-var-row">
                <span className="cw-var-name">current_area</span>
                <span className="cw-var-val">{step?.currentArea ?? '–'}</span>
              </div>
              <div className="cw-var-row" style={{ borderColor: '#22c55e' }}>
                <span className="cw-var-name">max_area</span>
                <span className="cw-var-val highlight">{step?.maxArea ?? '–'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`cw-status ${step?.phase === 'update' ? 'found' : ''}`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      <div className="cw-dock">
        <PlaybackControls
          isPlaying={isPlaying}
          isDone={isDone}
          speed={speed}
          onPlayToggle={togglePlay}
          onPrev={stepBack}
          onNext={stepForward}
          onReset={handleReset}
          prevDisabled={stepIndex < 0}
          nextDisabled={isDone}
          resetDisabled={stepIndex < 0}
          onSpeedChange={(e) => setSpeed(Number(e.target.value))}
        />
      </div>
    </div>
  )
}
