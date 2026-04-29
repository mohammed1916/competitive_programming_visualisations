import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './TwoSumVisualizer.css'

// ─── Solution code ────────────────────────────────────────────────────────────
const SOLUTION_CODE = [
  { line: 1,  text: 'class Solution(object):' },
  { line: 2,  text: '    def twoSum(self, nums, target):' },
  { line: 3,  text: '        seen = {}  # val -> index' },
  { line: 4,  text: '        for i, num in enumerate(nums):' },
  { line: 5,  text: '            complement = target - num' },
  { line: 6,  text: '            if complement in seen:' },
  { line: 7,  text: '                return [seen[complement], i]' },
  { line: 8,  text: '            seen[num] = i' },
  { line: 9,  text: '        return []' },
]

// ─── Step generator ───────────────────────────────────────────────────────────
function generateSteps(nums, target) {
  const steps = []
  const seen = {}

  // init step
  steps.push({
    phase: 'init',
    i: null,
    num: null,
    complement: null,
    found: false,
    answerPair: null,
    seenSnapshot: {},
    activeLine: 3,
    message: 'Initialise empty hash map seen = {}',
  })

  for (let i = 0; i < nums.length; i++) {
    const num = nums[i]
    const complement = target - num

    // highlight current element, compute complement
    steps.push({
      phase: 'compute',
      i,
      num,
      complement,
      found: false,
      answerPair: null,
      seenSnapshot: { ...seen },
      activeLine: 5,
      message: `i=${i}  num=${num}  →  complement = ${target} - ${num} = ${complement}`,
    })

    if (complement in seen) {
      // found answer
      steps.push({
        phase: 'found',
        i,
        num,
        complement,
        found: true,
        answerPair: [seen[complement], i],
        seenSnapshot: { ...seen },
        activeLine: 7,
        message: `Found! complement ${complement} is at index ${seen[complement]}  →  return [${seen[complement]}, ${i}]`,
      })
      return steps
    }

    // check failed – add to map
    steps.push({
      phase: 'store',
      i,
      num,
      complement,
      found: false,
      answerPair: null,
      seenSnapshot: { ...seen },
      activeLine: 8,
      message: `${complement} not in map. Store seen[${num}] = ${i}`,
    })
    seen[num] = i
  }

  // no answer (shouldn't happen for valid inputs but handled gracefully)
  steps.push({
    phase: 'done',
    i: null,
    num: null,
    complement: null,
    found: false,
    answerPair: null,
    seenSnapshot: { ...seen },
    activeLine: 9,
    message: 'No two-sum pair found.',
  })
  return steps
}

// ─── Default examples ─────────────────────────────────────────────────────────
const EXAMPLES = [
  { label: 'Classic',      nums: [2, 7, 11, 15],     target: 9  },
  { label: 'Middle pair',  nums: [3, 2, 4],           target: 6  },
  { label: 'Duplicate',    nums: [3, 3],              target: 6  },
  { label: 'Longer',       nums: [1, 5, 3, 8, 2, 4], target: 10 },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function TwoSumVisualizer() {
  const [numsInput, setNumsInput]     = useState('[2, 7, 11, 15]')
  const [targetInput, setTargetInput] = useState('9')

  // parse + validate
  const { nums, target, inputError } = useMemo(() => {
    try {
      const n = JSON.parse(numsInput)
      const t = Number(targetInput)
      if (!Array.isArray(n) || n.some((x) => typeof x !== 'number')) throw new Error()
      if (isNaN(t)) throw new Error()
      return { nums: n, target: t, inputError: '' }
    } catch {
      return { nums: [2, 7, 11, 15], target: 9, inputError: 'Invalid input' }
    }
  }, [numsInput, targetInput])

  const steps = useMemo(() => generateSteps(nums, target), [nums, target])

  const {
    stepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length)

  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setNumsInput(JSON.stringify(ex.nums))
    setTargetInput(String(ex.target))
    handleReset()
  }, [handleReset])

  // ── derive cell states ──────────────────────────────────────────────────────
  function cellState(idx) {
    if (!step) return 'idle'
    if (step.found && step.answerPair?.includes(idx)) return 'answer'
    if (step.i === idx) return 'active'
    if (step.seenSnapshot) {
      const seenIdx = Object.values(step.seenSnapshot)
      if (seenIdx.includes(idx)) return 'visited'
    }
    return 'idle'
  }

  // ── code highlight ──────────────────────────────────────────────────────────
  const codeHighlight = step
    ? { activeLine: step.activeLine, relatedLines: [] }
    : { activeLine: null, relatedLines: [] }

  return (
    <div className="twosum-shell">
      {/* ── top: array + hash map ── */}
      <div className="twosum-top">
        {/* Array panel */}
        <div className="ts-panel">
          <div className="ts-panel-head">
            Input Array
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
            <span className="ts-badge" style={{ background: '#1e3a5f', color: '#93c5fd' }}>Array</span>
          </div>
          <div className="ts-panel-body">
            {/* examples */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => applyExample(ex)}
                  style={{
                    padding: '3px 10px', borderRadius: 99, fontSize: 11, cursor: 'pointer',
                    background: '#1e293b', border: '1px solid #334155', color: '#94a3b8',
                  }}
                >
                  {ex.label}
                </button>
              ))}
            </div>

            {/* inputs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
              <input
                value={numsInput}
                onChange={(e) => { setNumsInput(e.target.value); handleReset() }}
                placeholder="[2,7,11,15]"
                style={{
                  flex: 1, padding: '5px 10px', borderRadius: 7, border: '1px solid #334155',
                  background: '#0f172a', color: '#f8fafc', fontFamily: 'monospace', fontSize: 13,
                }}
              />
              <span style={{ color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>target</span>
              <input
                value={targetInput}
                onChange={(e) => { setTargetInput(e.target.value); handleReset() }}
                placeholder="9"
                style={{
                  width: 56, padding: '5px 8px', borderRadius: 7, border: '1px solid #334155',
                  background: '#0f172a', color: '#f8fafc', fontFamily: 'monospace', fontSize: 13,
                  textAlign: 'center',
                }}
              />
            </div>

            {/* array cells */}
            <div className="ts-array-row">
              {nums.map((val, idx) => (
                <motion.div
                  key={idx}
                  className="ts-array-cell"
                  layout
                >
                  <motion.div
                    className={`ts-cell-val ${cellState(idx)}`}
                    layout
                    animate={{ scale: cellState(idx) !== 'idle' ? 1.1 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    {val}
                  </motion.div>
                  <div className="ts-cell-idx">{idx}</div>
                </motion.div>
              ))}
            </div>

            {/* target + complement row */}
            <div className="ts-target-row">
              <span style={{ color: '#64748b' }}>target</span>
              <span className="ts-target-chip">{target}</span>
              {step && step.complement !== null && (
                <>
                  <span style={{ color: '#64748b' }}>complement</span>
                  <span className="ts-complement-chip">{step.complement}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Hash map panel */}
        <div className="ts-panel">
          <div className="ts-panel-head">
            Hash Map <code style={{ marginLeft: 6, fontFamily: 'monospace', fontSize: 11 }}>seen = &#123;val: index&#125;</code>
            <span className="ts-badge" style={{ background: '#1e293b', color: '#a78bfa' }}>HashMap</span>
          </div>
          <div className="ts-panel-body">
            <AnimatePresence mode="sync">
              {(!step || Object.keys(step.seenSnapshot ?? {}).length === 0) ? (
                <p style={{ color: '#475569', fontSize: 12, fontStyle: 'italic' }}>
                  Map is empty — no elements stored yet.
                </p>
              ) : (
                <table className="ts-map-table">
                  <thead>
                    <tr>
                      <th>Value (key)</th>
                      <th>Index (value)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(step.seenSnapshot).map(([val, idx]) => {
                      const isHighlighted =
                        step.found && step.seenSnapshot[step.complement] !== undefined &&
                        Number(val) === step.complement
                      return (
                        <motion.tr
                          key={val}
                          className={`ts-map-row${isHighlighted ? ' highlight' : ''}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <td>{val}</td>
                          <td>{idx}</td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── middle: code + variables ── */}
      <div className="twosum-middle">
        <CodeTracePanel
          lines={SOLUTION_CODE}
          activeLine={codeHighlight.activeLine}
          relatedLines={codeHighlight.relatedLines}
          language="python"
        />

        <div className="ts-panel">
          <div className="ts-panel-head">Variables</div>
          <div className="ts-panel-body">
            <div className="ts-vars">
              <div className="ts-var-row">
                <span className="ts-var-name">i</span>
                <span className="ts-var-val">{step?.i ?? '–'}</span>
              </div>
              <div className="ts-var-row">
                <span className="ts-var-name">num</span>
                <span className="ts-var-val">{step?.num ?? '–'}</span>
              </div>
              <div className="ts-var-row">
                <span className="ts-var-name">complement</span>
                <span className={`ts-var-val${step?.complement !== null ? ' highlight' : ''}`}>
                  {step?.complement ?? '–'}
                </span>
              </div>
              <div className="ts-var-row">
                <span className="ts-var-name">in seen?</span>
                <span className="ts-var-val">
                  {step
                    ? step.complement !== null
                      ? step.complement in (step.seenSnapshot ?? {}) ? '✓ yes' : '✗ no'
                      : '–'
                    : '–'}
                </span>
              </div>
              {step?.found && (
                <div className="ts-var-row" style={{ borderColor: '#22c55e' }}>
                  <span className="ts-var-name">answer</span>
                  <span className="ts-var-val highlight">
                    [{step.answerPair?.join(', ')}]
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── status strip ── */}
      <div className={`ts-status${step?.found ? ' found' : ''}`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      {/* ── playback controls ── */}
      <div className="twosum-dock">
        <PlaybackControls
          isPlaying={isPlaying}
          isDone={isDone}
          speed={speed}
          onTogglePlay={togglePlay}
          onStepBack={stepBack}
          onStepForward={stepForward}
          onReset={handleReset}
          onSpeedChange={setSpeed}
        />
      </div>
    </div>
  )
}
