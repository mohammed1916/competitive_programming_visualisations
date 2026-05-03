import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './TrappingRainWaterVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution:' },
  { line: 2, text: '    def trap(self, height: List[int]) -> int:' },
  { line: 3, text: '        if not height: return 0' },
  { line: 4, text: '        left, right = 0, len(height) - 1' },
  { line: 5, text: '        left_max, right_max = height[left], height[right]' },
  { line: 6, text: '        water = 0' },
  { line: 7, text: '        while left < right:' },
  { line: 8, text: '            if left_max < right_max:' },
  { line: 9, text: '                left += 1' },
  { line: 10, text: '                left_max = max(left_max, height[left])' },
  { line: 11, text: '                water += left_max - height[left]' },
  { line: 12, text: '            else:' },
  { line: 13, text: '                right -= 1' },
  { line: 14, text: '                right_max = max(right_max, height[right])' },
  { line: 15, text: '                water += right_max - height[right]' },
  { line: 16, text: '        return water' },
]

function generateSteps(height) {
  const steps = []
  if (!height || height.length === 0) {
    steps.push({
      phase: 'done', left: null, right: null, leftMax: null, rightMax: null, water: 0,
      activeLine: 3, message: 'Empty array. Return 0.'
    })
    return steps
  }

  let left = 0
  let right = height.length - 1
  let leftMax = height[left]
  let rightMax = height[right]
  let water = 0
  const waterAmounts = new Array(height.length).fill(0)

  steps.push({
    phase: 'init',
    left, right, leftMax, rightMax, water, waterAmounts: [...waterAmounts],
    activeLine: 5,
    message: `Initialize left=0, right=${right}, left_max=${leftMax}, right_max=${rightMax}.`
  })

  while (left < right) {
    steps.push({
      phase: 'check', left, right, leftMax, rightMax, water, waterAmounts: [...waterAmounts],
      activeLine: 8,
      message: `Compare left_max (${leftMax}) and right_max (${rightMax}).`
    })

    if (leftMax < rightMax) {
      left++
      steps.push({
        phase: 'move_left', left, right, leftMax, rightMax, water, waterAmounts: [...waterAmounts],
        activeLine: 9, message: `left_max < right_max. Move left pointer to index ${left}.`
      })

      leftMax = Math.max(leftMax, height[left])
      steps.push({
        phase: 'max_left', left, right, leftMax, rightMax, water, waterAmounts: [...waterAmounts],
        activeLine: 10, message: `Update left_max = max(${leftMax}, ${height[left]}) = ${leftMax}.`
      })

      const added = leftMax - height[left]
      water += added
      waterAmounts[left] = added

      steps.push({
        phase: 'add_water', left, right, leftMax, rightMax, water, waterAmounts: [...waterAmounts],
        activeLine: 11, message: `Add ${added} units of water at index ${left}. Total water = ${water}.`
      })
    } else {
      right--
      steps.push({
        phase: 'move_right', left, right, leftMax, rightMax, water, waterAmounts: [...waterAmounts],
        activeLine: 13, message: `left_max >= right_max. Move right pointer to index ${right}.`
      })

      rightMax = Math.max(rightMax, height[right])
      steps.push({
        phase: 'max_right', left, right, leftMax, rightMax, water, waterAmounts: [...waterAmounts],
        activeLine: 14, message: `Update right_max = max(${rightMax}, ${height[right]}) = ${rightMax}.`
      })

      const added = rightMax - height[right]
      water += added
      waterAmounts[right] = added

      steps.push({
        phase: 'add_water', left, right, leftMax, rightMax, water, waterAmounts: [...waterAmounts],
        activeLine: 15, message: `Add ${added} units of water at index ${right}. Total water = ${water}.`
      })
    }
  }

  steps.push({
    phase: 'done', left, right, leftMax, rightMax, water, waterAmounts: [...waterAmounts],
    activeLine: 16, message: `Pointers met. Total trapped water is ${water}.`
  })

  return steps
}

const EXAMPLES = [
  { label: 'Classic', height: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1] },
  { label: 'Mountain', height: [4, 2, 0, 3, 2, 5] },
  { label: 'Pyramid', height: [1, 2, 3, 4, 3, 2, 1] },
  { label: 'Bowl', height: [5, 1, 1, 1, 5] },
  { label: 'Steps', height: [5, 4, 3, 2, 1, 2, 3] },
]

export default function TrappingRainWaterVisualizer() {
  const [heightInput, setHeightInput] = useState('[0,1,0,2,1,0,1,3,2,1,2,1]')

  const { height, inputError } = useMemo(() => {
    try {
      const h = JSON.parse(heightInput)
      if (!Array.isArray(h) || h.some((x) => typeof x !== 'number' || x < 0)) throw new Error()
      return { height: h, inputError: '' }
    } catch {
      return { height: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1], inputError: 'Invalid input array' }
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

  const maxHeightValue = Math.max(...height, 5)

  return (
    <div className="trapping-water-shell">
      <div className="tw-top">
        <div className="tw-panel">
          <div className="tw-panel-head">
            Elevation Map
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
          </div>
          <div className="tw-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => applyExample(ex)}
                  className="tw-example-btn"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <input
              value={heightInput}
              onChange={(e) => { setHeightInput(e.target.value); handleReset() }}
              placeholder="[0,1,0,2,1,0,1,3,2,1,2,1]"
              className="tw-input"
            />

            <div className="tw-chart-container">
              {height.map((h, i) => {
                const isLeft = step?.left === i
                const isRight = step?.right === i
                const isActive = isLeft || isRight
                const waterAmt = step ? step.waterAmounts[i] : 0

                return (
                  <div key={i} className="tw-column">
                    <div className="tw-column-value">{h + waterAmt > 0 ? (h + waterAmt === h ? h : `${h}+${waterAmt}`) : ''}</div>
                    <div className="tw-blocks-wrapper" style={{ height: `${(Math.max(h + waterAmt, 1) / maxHeightValue) * 100}%` }}>
                      <motion.div
                        className="tw-water-block"
                        style={{ height: `${(waterAmt / Math.max(h + waterAmt, 1)) * 100}%` }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, height: `${(waterAmt / Math.max(h + waterAmt, 1)) * 100}%` }}
                      />
                      <motion.div
                        className={`tw-ground-block ${isActive ? 'active' : ''}`}
                        style={{ height: `${(h / Math.max(h + waterAmt, 1)) * 100}%` }}
                        layout
                      />
                    </div>
                    <div className="tw-pointer-label">
                      {isLeft ? 'L' : isRight ? 'R' : ''}
                    </div>
                  </div>
                )
              })}

              {/* Max level indicators */}
              {step && step.leftMax !== null && step.rightMax !== null && step.phase !== 'done' && (
                <>
                  <div
                    className="tw-max-line left"
                    style={{
                      bottom: 24,
                      height: `${(step.leftMax / maxHeightValue) * 100}%`,
                      left: `calc(${(step.left / Math.max(height.length - 1, 1)) * 100}%)`
                    }}
                  />
                  <div
                    className="tw-max-line right"
                    style={{
                      bottom: 24,
                      height: `${(step.rightMax / maxHeightValue) * 100}%`,
                      right: `calc(${100 - (step.right / Math.max(height.length - 1, 1)) * 100}%)`
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="trapping-water-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />

        <div className="tw-panel">
          <div className="tw-panel-head">Variables</div>
          <div className="tw-panel-body">
            <div className="tw-vars">
              <div className="tw-var-row">
                <span className="tw-var-name">left</span>
                <span className="tw-var-val">{step?.left ?? '–'}</span>
              </div>
              <div className="tw-var-row">
                <span className="tw-var-name">right</span>
                <span className="tw-var-val">{step?.right ?? '–'}</span>
              </div>
              <div className="tw-var-row">
                <span className="tw-var-name">left_max</span>
                <span className="tw-var-val">{step?.leftMax ?? '–'}</span>
              </div>
              <div className="tw-var-row">
                <span className="tw-var-name">right_max</span>
                <span className="tw-var-val">{step?.rightMax ?? '–'}</span>
              </div>
              <div className="tw-var-row" style={{ borderColor: '#3b82f6' }}>
                <span className="tw-var-name">water</span>
                <span className="tw-var-val" style={{ color: '#60a5fa' }}>{step?.water ?? '–'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`tw-status ${step?.phase === 'add_water' ? 'found' : ''}`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      <div className="tw-dock">
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
