import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './MaximumSubarrayVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution:' },
  { line: 2, text: '    def maxSubArray(self, nums: List[int]) -> int:' },
  { line: 3, text: '        maxSub = nums[0]' },
  { line: 4, text: '        curSum = 0' },
  { line: 5, text: '        ' },
  { line: 6, text: '        for n in nums:' },
  { line: 7, text: '            if curSum < 0:' },
  { line: 8, text: '                curSum = 0' },
  { line: 9, text: '            curSum += n' },
  { line: 10, text: '            maxSub = max(maxSub, curSum)' },
  { line: 11, text: '            ' },
  { line: 12, text: '        return maxSub' },
]

function generateSteps(nums) {
  const steps = []

  if (!nums || nums.length === 0) {
    steps.push({
      phase: 'done', i: null, maxSub: 0, curSum: 0, n: null, currentSubarray: [],
      activeLine: 12, message: 'Empty array. Return 0.'
    })
    return steps
  }

  let maxSub = nums[0]
  let curSum = 0
  let currentSubarray = [] // stores indices

  steps.push({
    phase: 'init', i: null, maxSub, curSum, n: null, currentSubarray: [...currentSubarray],
    activeLine: 4, message: `Initialize maxSub = nums[0] (\${maxSub}), curSum = 0.`
  })

  for (let i = 0; i < nums.length; i++) {
    const n = nums[i]

    steps.push({
      phase: 'loop', i, maxSub, curSum, n, currentSubarray: [...currentSubarray],
      activeLine: 6, message: `Process nums[\${i}] = \${n}.`
    })

    steps.push({
      phase: 'check_cur', i, maxSub, curSum, n, currentSubarray: [...currentSubarray],
      activeLine: 7, message: `Is curSum (\${curSum}) < 0?`
    })

    if (curSum < 0) {
      curSum = 0
      currentSubarray = []
      steps.push({
        phase: 'reset_cur', i, maxSub, curSum, n, currentSubarray: [...currentSubarray],
        activeLine: 8, message: `Yes. Reset curSum to 0 (discard previous negative prefix).`
      })
    } else {
      steps.push({
        phase: 'keep_cur', i, maxSub, curSum, n, currentSubarray: [...currentSubarray],
        activeLine: 9, message: `No. Keep curSum (\${curSum}).`
      })
    }

    curSum += n
    currentSubarray.push(i)
    steps.push({
      phase: 'add', i, maxSub, curSum, n, currentSubarray: [...currentSubarray],
      activeLine: 9, message: `Add n to curSum. curSum is now \${curSum}.`
    })

    const newMaxSub = Math.max(maxSub, curSum)
    const updatedMax = newMaxSub !== maxSub
    maxSub = newMaxSub

    steps.push({
      phase: 'update_max', i, maxSub, curSum, n, currentSubarray: [...currentSubarray], updatedMax,
      activeLine: 10, message: `maxSub = max(\${maxSub === newMaxSub ? maxSub : maxSub - curSum + n /* roughly previous maxSub */}, \${curSum}) = \${maxSub}.`
    })
  }

  steps.push({
    phase: 'done', i: null, maxSub, curSum, n: null, currentSubarray: [...currentSubarray],
    activeLine: 12, message: `Loop finished. Return maxSub = \${maxSub}.`
  })

  return steps
}

const EXAMPLES = [
  { label: 'Standard', nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
  { label: 'All Negative', nums: [-5, -2, -9, -1] },
  { label: 'All Positive', nums: [1, 2, 3, 4, 5] },
  { label: 'Single Element', nums: [1] },
]

export default function MaximumSubarrayVisualizer() {
  const [numsInput, setNumsInput] = useState('[-2, 1, -3, 4, -1, 2, 1, -5, 4]')

  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

  const { nums, inputError } = useMemo(() => {
    try {
      const n = JSON.parse(numsInput)
      if (!Array.isArray(n)) throw new Error('nums must be an array')
      return { nums: n.map(Number), inputError: '' }
    } catch (e) {
      return { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4], inputError: e.message || 'Invalid input' }
    }
  }, [numsInput])

  const steps = useMemo(() => generateSteps(nums), [nums])

  const {
    stepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length)

  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setNumsInput(JSON.stringify(ex.nums))
    handleReset()
  }, [handleReset])

  return (
    <div className="maxsub-shell">
      <div className="maxsub-top">
        <div className="maxsub-panel" style={{ flex: 1.5 }}>
          <div className="maxsub-panel-head">
            Array & Current Subarray
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
          </div>
          <div className="maxsub-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => applyExample(ex)}
                  className="maxsub-example-btn"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: 13, fontFamily: 'monospace' }}>nums=</span>
              <input
                value={numsInput}
                onChange={(e) => { setNumsInput(e.target.value); handleReset() }}
                placeholder="[-2, 1, -3, 4, -1, 2, 1, -5, 4]"
                className="maxsub-input"
                style={{ flex: 1, margin: 0 }}
              />
            </div>

            <div className="maxsub-array-container">
              {nums.map((num, idx) => {
                const isActive = step?.i === idx
                const inSubarray = step?.currentSubarray?.includes(idx)

                let cellClass = "maxsub-cell "
                if (isActive) cellClass += "active "
                if (inSubarray) cellClass += "in-sub "
                if (num < 0) cellClass += "neg "

                return (
                  <div key={idx} className="maxsub-cell-wrapper">
                    <span className="maxsub-index">{idx}</span>
                    <motion.div
                      className={cellClass}
                      animate={isActive ? { y: -5 } : { y: 0 }}
                    >
                      {num}
                    </motion.div>
                    <div className="maxsub-ptr-container">
                      {isActive && <div className="maxsub-ptr">n</div>}
                    </div>
                  </div>
                )
              })}
            </div>

            {step && step.phase !== 'init' && step.i !== null && (
              <div className="maxsub-math-box">
                <div className="maxsub-math-row">
                  <span className="maxsub-math-label">Current Addition:</span>
                  <div className="maxsub-math-formula">
                    <span className="maxsub-var">curSum</span>
                    <span className="maxsub-op">+</span>
                    <span className="maxsub-var">n</span>
                    <span className="maxsub-op">=</span>
                    <span className="maxsub-var new">new curSum</span>
                  </div>
                </div>
                <div className="maxsub-math-row vals">
                  <span className="maxsub-math-label"></span>
                  <div className="maxsub-math-formula">
                    <span className="maxsub-val">{step.curSum - (step.phase === 'add' || step.phase === 'update_max' ? step.n : 0)}</span>
                    <span className="maxsub-op">+</span>
                    <span className="maxsub-val n">{step.n}</span>
                    <span className="maxsub-op">=</span>
                    <span className={`maxsub-val new \${step.phase === 'add' || step.phase === 'update_max' ? 'highlight' : ''}`}>
                      {step.curSum}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="maxsub-panel" style={{ flex: 1 }}>
          <div className="maxsub-panel-head">State Variables</div>
          <div className="maxsub-panel-body" style={{ gap: 16 }}>

            <div className="maxsub-var-card curSum">
              <div className="maxsub-var-header">
                <span className="maxsub-var-title">curSum</span>
                {step?.phase === 'reset_cur' && <span className="maxsub-badge reset">RESET to 0</span>}
              </div>
              <div className={`maxsub-var-value \${step?.curSum < 0 ? 'neg' : ''}`}>
                {step?.curSum ?? 0}
              </div>
              <span className="maxsub-var-desc">Sum of current contiguous subarray</span>
            </div>

            <div className="maxsub-var-card maxSub">
              <div className="maxsub-var-header">
                <span className="maxsub-var-title">maxSub</span>
                {step?.updatedMax && <span className="maxsub-badge newmax">NEW MAX!</span>}
              </div>
              <div className="maxsub-var-value">
                {step?.maxSub ?? nums[0] ?? 0}
              </div>
              <span className="maxsub-var-desc">Maximum sum seen so far</span>
            </div>

          </div>
        </div>
      </div>

      <div className="maxsub-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
      </div>

      <div className={`maxsub-status \${step?.phase === 'done' ? 'success' : step?.phase === 'reset_cur' ? 'reset' : step?.updatedMax ? 'newmax' : ''}`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      <div className="maxsub-dock">
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
