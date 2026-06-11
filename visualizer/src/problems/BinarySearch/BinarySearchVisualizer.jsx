import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { useCodeVisualConnectivity } from '../../hooks/useCodeVisualConnectivity'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './BinarySearchVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution:' },
  { line: 2, text: '    def search(self, nums: List[int], target: int) -> int:' },
  { line: 3, text: '        left, right = 0, len(nums) - 1' },
  { line: 4, text: '        ' },
  { line: 5, text: '        while left <= right:' },
  { line: 6, text: '            mid = left + (right - left) // 2' },
  { line: 7, text: '            ' },
  { line: 8, text: '            if nums[mid] == target:' },
  { line: 9, text: '                return mid' },
  { line: 10, text: '            elif nums[mid] < target:' },
  { line: 11, text: '                left = mid + 1' },
  { line: 12, text: '            else:' },
  { line: 13, text: '                right = mid - 1' },
  { line: 14, text: '                ' },
  { line: 15, text: '        return -1' },
]

function generateSteps(nums, target) {
  const steps = []

  if (!nums || nums.length === 0) {
    steps.push({
      phase: 'done', left: 0, right: -1, mid: null,
      activeLine: 15, message: 'Array is empty. Return -1.'
    })
    return steps
  }

  let left = 0
  let right = nums.length - 1

  steps.push({
    phase: 'init', left, right, mid: null,
    activeLine: 3, message: `Initialize left = 0, right = \${right} (\${nums.length} - 1).`
  })

  while (left <= right) {
    steps.push({
      phase: 'while_check', left, right, mid: null,
      activeLine: 5, message: `Check if left (\${left}) <= right (\${right}). Yes, continue.`
    })

    const mid = Math.floor(left + (right - left) / 2)
    steps.push({
      phase: 'calc_mid', left, right, mid,
      activeLine: 6, message: `Calculate mid = \${left} + (\${right} - \${left}) // 2 = \${mid}.`
    })

    steps.push({
      phase: 'check_target', left, right, mid,
      activeLine: 8, message: `Is nums[mid] (\${nums[mid]}) == target (\${target})?`
    })

    if (nums[mid] === target) {
      steps.push({
        phase: 'found', left, right, mid, foundIndex: mid,
        activeLine: 9, message: `Target found at index \${mid}! Return \${mid}.`
      })
      return steps
    }

    steps.push({
      phase: 'check_less', left, right, mid,
      activeLine: 10, message: `No. Is nums[mid] (\${nums[mid]}) < target (\${target})?`
    })

    if (nums[mid] < target) {
      left = mid + 1
      steps.push({
        phase: 'update_left', left, right, mid,
        activeLine: 11, message: `Yes, target must be in the right half. Update left = mid + 1 = \${left}.`
      })
    } else {
      steps.push({
        phase: 'check_greater', left, right, mid,
        activeLine: 12, message: `No, nums[mid] (\${nums[mid]}) > target (\${target}).`
      })

      right = mid - 1
      steps.push({
        phase: 'update_right', left, right, mid,
        activeLine: 13, message: `Target must be in the left half. Update right = mid - 1 = \${right}.`
      })
    }
  }

  steps.push({
    phase: 'done', left, right, mid: null, foundIndex: -1,
    activeLine: 15, message: `Loop ends (left > right). Target not found, return -1.`
  })

  return steps
}

const EXAMPLES = [
  { label: 'Standard', nums: [-1, 0, 3, 5, 9, 12], target: 9 },
  { label: 'First Element', nums: [-1, 0, 3, 5, 9, 12], target: -1 },
  { label: 'Not Found', nums: [-1, 0, 3, 5, 9, 12], target: 2 },
  { label: 'Single Element', nums: [5], target: 5 },
]

export default function BinarySearchVisualizer() {
  const [numsInput, setNumsInput] = useState('[-1, 0, 3, 5, 9, 12]')
  const [targetInput, setTargetInput] = useState('9')

  const { nums, target, inputError } = useMemo(() => {
    try {
      const n = JSON.parse(numsInput)
      const t = Number(targetInput)
      if (!Array.isArray(n)) throw new Error('nums must be an array')
      if (isNaN(t)) throw new Error('target must be a number')

      // Binary search requires sorted array, we'll sort it if it isn't, but ideally users provide sorted input
      const isSorted = n.every((val, i, arr) => !i || val >= arr[i - 1])
      if (!isSorted) {
        return { nums: [...n].sort((a, b) => a - b), target: t, inputError: 'Input array was automatically sorted.' }
      }
      return { nums: n, target: t, inputError: '' }
    } catch (e) {
      return { nums: [-1, 0, 3, 5, 9, 12], target: 9, inputError: e.message || 'Invalid input' }
    }
  }, [numsInput, targetInput])

  const steps = useMemo(
    () => generateSteps(nums, target).map((current) => ({
      ...current,
      relatedLines: current.relatedLines ?? (current.activeLine != null ? [current.activeLine] : []),
    })),
    [nums, target],
  )

  const {
    stepIndex, setStepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length)

  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setNumsInput(JSON.stringify(ex.nums))
    setTargetInput(String(ex.target))
    handleReset()
  }, [handleReset])

  const connectivity = useCodeVisualConnectivity({
    steps,
    stepIndex,
    onStepJump: setStepIndex,
  })

  return (
    <div className="bs-shell">
      <div className="bs-top">
        <div className="bs-panel" style={{ flex: 1 }}>
          <div className="bs-panel-head">
            Array State & Search Space
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
          </div>
          <div className="bs-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => applyExample(ex)}
                  className="bs-example-btn"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
              <input
                value={numsInput}
                onChange={(e) => { setNumsInput(e.target.value); handleReset() }}
                placeholder="[-1, 0, 3, 5, 9, 12]"
                className="bs-input"
                style={{ flex: 1, margin: 0 }}
              />
              <span style={{ color: '#64748b', fontSize: 13, fontFamily: 'monospace' }}>target=</span>
              <input
                value={targetInput}
                onChange={(e) => { setTargetInput(e.target.value); handleReset() }}
                placeholder="9"
                className="bs-input"
                style={{ width: '60px', margin: 0, textAlign: 'center' }}
              />
            </div>

            <div className="bs-pointers-legend">
              <div className="bs-legend-item left"><div className="bs-legend-swatch" /> Left</div>
              <div className="bs-legend-item mid"><div className="bs-legend-swatch" /> Mid</div>
              <div className="bs-legend-item right"><div className="bs-legend-swatch" /> Right</div>
            </div>

            <div className="bs-array-container">
              {nums.map((num, i) => {
                const isLeft = step?.left === i
                const isRight = step?.right === i
                const isMid = step?.mid === i
                const isOutOfBounds = step && (i < step.left || i > step.right)
                const isFound = step?.phase === 'found' && isMid

                let cellClass = "bs-cell "
                if (isLeft) cellClass += "left "
                if (isRight) cellClass += "right "
                if (isMid) cellClass += "mid "
                if (isFound) cellClass += "found "
                if (isOutOfBounds && !isFound) cellClass += "out-of-bounds "

                return (
                  <div key={i} className="bs-cell-wrapper">
                    <div className="bs-index">{i}</div>
                    <div className={cellClass}>
                      {num}
                    </div>
                    <div className="bs-pointers">
                      {isLeft && <div className="bs-ptr left">L</div>}
                      {isMid && <div className="bs-ptr mid">M</div>}
                      {isRight && <div className="bs-ptr right">R</div>}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bs-stats">
              <div className="bs-stat-box">
                <span className="bs-stat-label">Search Space Size</span>
                <span className="bs-stat-val">{step ? Math.max(0, step.right - step.left + 1) : nums.length}</span>
              </div>
              <div className="bs-stat-box">
                <span className="bs-stat-label">Target</span>
                <span className="bs-stat-val" style={{ color: '#eab308' }}>{target}</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="bs-middle">
        <CodeTracePanel
          step={step}
          codeLines={SOLUTION_CODE}
          highlightedLines={connectivity.highlightedLines}
          onLineSelect={connectivity.handleLineSelect}
          onActiveLineDomChange={setActiveLineDom}
        />
      </div>

      <div className={`bs-status \${step?.phase === 'found' ? 'success' : step?.phase === 'done' ? 'fail' : ''}`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      <div className="bs-dock">
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
          showPatternOverlay={showPatternOverlay}
          onShowPatternOverlayChange={setShowPatternOverlay}
          patternOverlayLabel="Show pattern overlay"
          showPatternOverlayToggle
        />
      </div>

      {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
    </div>
  )
}
