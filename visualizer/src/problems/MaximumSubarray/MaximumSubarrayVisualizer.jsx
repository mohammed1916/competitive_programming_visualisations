import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './MaximumSubarrayVisualizer.css'

// ─── Solution code (Kadane's algorithm) ──────────────────────────────────────
const SOLUTION_CODE = [
  { line: 1, text: 'class Solution(object):' },
  { line: 2, text: '    def maxSubArray(self, nums):' },
  { line: 3, text: '        max_sum = nums[0]' },
  { line: 4, text: '        curr_sum = nums[0]' },
  { line: 5, text: '        best_start = best_end = 0' },
  { line: 6, text: '        curr_start = 0' },
  { line: 7, text: '        for i in range(1, len(nums)):' },
  { line: 8, text: '            if curr_sum + nums[i] < nums[i]:' },
  { line: 9, text: '                curr_sum = nums[i]' },
  { line: 10, text: '                curr_start = i' },
  { line: 11, text: '            else:' },
  { line: 12, text: '                curr_sum += nums[i]' },
  { line: 13, text: '            if curr_sum > max_sum:' },
  { line: 14, text: '                max_sum = curr_sum' },
  { line: 15, text: '                best_start = curr_start' },
  { line: 16, text: '                best_end = i' },
  { line: 17, text: '        return max_sum' },
]

// ─── Step generator ───────────────────────────────────────────────────────────
function generateSteps(nums) {
  const steps = []
  if (nums.length === 0) return steps

  let maxSum = nums[0]
  let currSum = nums[0]
  let bestStart = 0, bestEnd = 0
  let currStart = 0

  steps.push({
    phase: 'init',
    i: 0,
    currSum,
    maxSum,
    currStart,
    bestStart,
    bestEnd,
    activeLine: 3,
    message: `Init: max_sum = curr_sum = nums[0] = ${nums[0]}`,
  })

  for (let i = 1; i < nums.length; i++) {
    // check reset
    if (currSum + nums[i] < nums[i]) {
      steps.push({
        phase: 'reset',
        i,
        currSum: nums[i],
        maxSum,
        currStart: i,
        bestStart,
        bestEnd,
        activeLine: 9,
        message: `curr_sum (${currSum}) + nums[${i}] (${nums[i]}) < nums[${i}] → reset curr_sum = ${nums[i]}, curr_start = ${i}`,
      })
      currSum = nums[i]
      currStart = i
    } else {
      steps.push({
        phase: 'extend',
        i,
        currSum: currSum + nums[i],
        maxSum,
        currStart,
        bestStart,
        bestEnd,
        activeLine: 12,
        message: `Extend: curr_sum = ${currSum} + ${nums[i]} = ${currSum + nums[i]}`,
      })
      currSum += nums[i]
    }

    if (currSum > maxSum) {
      maxSum = currSum
      bestStart = currStart
      bestEnd = i
      steps.push({
        phase: 'update-max',
        i,
        currSum,
        maxSum,
        currStart,
        bestStart,
        bestEnd,
        activeLine: 14,
        message: `New maximum! max_sum = ${maxSum}  (indices ${bestStart}..${bestEnd})`,
      })
    }
  }

  steps.push({
    phase: 'done',
    i: nums.length - 1,
    currSum,
    maxSum,
    currStart,
    bestStart,
    bestEnd,
    activeLine: 17,
    message: `Return ${maxSum}  (subarray nums[${bestStart}..${bestEnd}] = [${nums.slice(bestStart, bestEnd + 1).join(', ')}])`,
  })

  return steps
}

// ─── Examples ─────────────────────────────────────────────────────────────────
const EXAMPLES = [
  { label: 'Classic',   nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
  { label: 'All neg',   nums: [-3, -1, -2] },
  { label: 'All pos',   nums: [1, 2, 3, 4, 5] },
  { label: 'Single',    nums: [1] },
]

// ─── Bar height helper ─────────────────────────────────────────────────────────
function barHeight(val, maxAbs) {
  if (maxAbs === 0) return 4
  return Math.max(4, Math.abs(val) / maxAbs * 60)
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MaximumSubarrayVisualizer() {
  const [numsInput, setNumsInput] = useState('[-2, 1, -3, 4, -1, 2, 1, -5, 4]')

  const { nums, inputError } = useMemo(() => {
    try {
      const n = JSON.parse(numsInput)
      if (!Array.isArray(n) || n.length === 0) throw new Error()
      return { nums: n, inputError: '' }
    } catch {
      return { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4], inputError: 'Invalid input' }
    }
  }, [numsInput])

  const steps = useMemo(() => generateSteps(nums), [nums])
  const maxAbs = useMemo(() => Math.max(...nums.map(Math.abs), 1), [nums])

  const {
    stepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length)

  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setNumsInput(JSON.stringify(ex.nums))
    handleReset()
  }, [handleReset])

  function cellState(idx) {
    if (!step) return 'idle'
    const { i, bestStart, bestEnd, currStart } = step
    if (step.phase === 'done' && idx >= bestStart && idx <= bestEnd) return 'best'
    if (idx === i) return (step.phase !== 'done' && idx >= bestStart && idx <= bestEnd) ? 'best active' : 'active'
    if (idx >= step.currStart && idx < i) return 'in-window'
    if (idx >= bestStart && idx <= bestEnd && step.phase !== 'done') return 'best'
    return 'idle'
  }

  return (
    <div className="ms-shell">
      {/* ── top ── */}
      <div className="ms-top">
        {/* Array panel */}
        <div className="ms-panel">
          <div className="ms-panel-head">
            Input Array (Kadane's)
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
            <span className="ms-badge" style={{ background: '#1e293b', color: '#93c5fd' }}>Array</span>
          </div>
          <div className="ms-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button key={ex.label} onClick={() => applyExample(ex)} style={{
                  padding: '3px 10px', borderRadius: 99, fontSize: 11, cursor: 'pointer',
                  background: '#1e293b', border: '1px solid #334155', color: '#94a3b8',
                }}>
                  {ex.label}
                </button>
              ))}
            </div>
            <input
              value={numsInput}
              onChange={(e) => { setNumsInput(e.target.value); handleReset() }}
              style={{
                width: '100%', padding: '5px 10px', borderRadius: 7, border: '1px solid #334155',
                background: '#0f172a', color: '#f8fafc', fontFamily: 'monospace', fontSize: 13,
                marginBottom: 14, boxSizing: 'border-box',
              }}
            />
            <div className="ms-array-row">
              {nums.map((val, idx) => (
                <div className="ms-cell" key={idx}>
                  <motion.div
                    className={`ms-cell-val ${cellState(idx)}`}
                    animate={{ scale: cellState(idx).includes('active') ? 1.12 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                  >{val}</motion.div>
                  <div className="ms-cell-idx">{idx}</div>
                </div>
              ))}
            </div>

            {/* bar chart */}
            <div className="ms-bars">
              {nums.map((val, idx) => {
                const h = barHeight(val, maxAbs)
                const st = cellState(idx)
                const color = st.includes('best') ? '#22c55e'
                  : st.includes('active') ? '#f97316'
                  : st.includes('in-window') ? '#0ea5e9'
                  : val >= 0 ? '#334155' : '#991b1b'
                return (
                  <div className="ms-bar-wrap" key={idx}>
                    <motion.div
                      className="ms-bar"
                      style={{ background: color }}
                      animate={{ height: h }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Running sums panel */}
        <div className="ms-panel">
          <div className="ms-panel-head">
            Running curr_sum vs max_sum
            <span className="ms-badge" style={{ background: '#14532d', color: '#86efac' }}>Kadane</span>
          </div>
          <div className="ms-panel-body">
            {step ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* curr_sum bar */}
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>curr_sum</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      height: 20, borderRadius: 4,
                      background: '#0ea5e9',
                      width: `${Math.min(100, Math.max(4, Math.abs(step.currSum) / (Math.abs(step.maxSum) || 1) * 100))}%`,
                      minWidth: 4,
                    }} />
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#93c5fd' }}>{step.currSum}</span>
                  </div>
                </div>
                {/* max_sum bar */}
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>max_sum</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      height: 20, borderRadius: 4,
                      background: '#22c55e',
                      width: '100%',
                      minWidth: 4,
                    }} />
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#86efac' }}>{step.maxSum}</span>
                  </div>
                </div>

                {/* best window */}
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Best subarray so far</div>
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {nums.slice(step.bestStart, step.bestEnd + 1).map((v, k) => (
                      <span key={k} style={{
                        padding: '2px 8px', borderRadius: 6, background: '#14532d',
                        border: '1px solid #22c55e', color: '#86efac',
                        fontFamily: 'monospace', fontWeight: 700, fontSize: 13,
                      }}>{v}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                    indices [{step.bestStart}, {step.bestEnd}]
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: '#475569', fontSize: 12, fontStyle: 'italic' }}>
                Step through to see running sums.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── middle: code + vars ── */}
      <div className="ms-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
        <div className="ms-panel">
          <div className="ms-panel-head">Variables</div>
          <div className="ms-panel-body">
            <div className="ms-vars">
              <div className="ms-var-row">
                <span className="ms-var-name">i</span>
                <span className="ms-var-val">{step?.i ?? '–'}</span>
              </div>
              <div className="ms-var-row">
                <span className="ms-var-name">curr_sum</span>
                <span className="ms-var-val">{step?.currSum ?? '–'}</span>
              </div>
              <div className="ms-var-row">
                <span className="ms-var-name">max_sum</span>
                <span className="ms-var-val highlight">{step?.maxSum ?? '–'}</span>
              </div>
              <div className="ms-var-row">
                <span className="ms-var-name">curr_start</span>
                <span className="ms-var-val">{step?.currStart ?? '–'}</span>
              </div>
              <div className="ms-var-row">
                <span className="ms-var-name">best [s,e]</span>
                <span className="ms-var-val">
                  {step ? `[${step.bestStart}, ${step.bestEnd}]` : '–'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── status ── */}
      <div className={`ms-status${step?.phase === 'done' ? ' done' : ''}`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      {/* ── dock ── */}
      <div className="ms-dock">
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
