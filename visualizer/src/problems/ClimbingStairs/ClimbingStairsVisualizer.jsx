import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './ClimbingStairsVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution(object):' },
  { line: 2, text: '    def climbStairs(self, n):' },
  { line: 3, text: '        if n <= 2: return n' },
  { line: 4, text: '        dp = [0] * (n + 1)' },
  { line: 5, text: '        dp[1] = 1' },
  { line: 6, text: '        dp[2] = 2' },
  { line: 7, text: '        for i in range(3, n + 1):' },
  { line: 8, text: '            dp[i] = dp[i-1] + dp[i-2]' },
  { line: 9, text: '        return dp[n]' },
]

function generateSteps(n) {
  const steps = []
  if (n <= 0) return steps

  if (n <= 2) {
    steps.push({ phase: 'trivial', i: null, dp: Array(n + 1).fill(0), activeLine: 3, message: `n=${n} ≤ 2 → return ${n}` })
    return steps
  }

  const dp = Array(n + 1).fill(0)

  steps.push({ phase: 'init', i: null, dp: [...dp], activeLine: 4, message: 'Allocate dp array of zeros.' })

  dp[1] = 1
  steps.push({ phase: 'base1', i: 1, dp: [...dp], activeLine: 5, message: 'dp[1] = 1  (one way to reach step 1)' })

  dp[2] = 2
  steps.push({ phase: 'base2', i: 2, dp: [...dp], activeLine: 6, message: 'dp[2] = 2  (1+1 or 2)' })

  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2]
    steps.push({
      phase: 'fill',
      i,
      dp: [...dp],
      activeLine: 8,
      message: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}`,
    })
  }

  steps.push({ phase: 'done', i: n, dp: [...dp], activeLine: 9, message: `Return dp[${n}] = ${dp[n]}` })
  return steps
}

const EXAMPLES = [
  { label: 'n = 5', n: 5 },
  { label: 'n = 10', n: 10 },
  { label: 'n = 3', n: 3 },
  { label: 'n = 1', n: 1 },
]

export default function ClimbingStairsVisualizer() {
  const [nInput, setNInput] = useState('10')

  const { n, inputError } = useMemo(() => {
    const v = parseInt(nInput, 10)
    if (isNaN(v) || v < 1 || v > 40) return { n: 10, inputError: 'n must be 1–40' }
    return { n: v, inputError: '' }
  }, [nInput])

  const steps = useMemo(() => generateSteps(n), [n])

  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => { setNInput(String(ex.n)); handleReset() }, [handleReset])

  function cellState(idx) {
    if (!step) return 'idle'
    if (step.i === idx) return 'active'
    if (idx === step.i - 1 || idx === step.i - 2) return 'prev'
    if (step.dp[idx] > 0) return 'filled'
    return 'idle'
  }

  return (
    <div className="cs-shell">
      <div className="cs-top">
        {/* DP table panel */}
        <div className="cs-panel">
          <div className="cs-panel-head">
            DP Table
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
            <span className="cs-badge" style={{ background: '#1e293b', color: '#a78bfa' }}>1D DP</span>
          </div>
          <div className="cs-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {EXAMPLES.map((ex) => (
                <button key={ex.label} onClick={() => applyExample(ex)} style={{
                  padding: '3px 10px', borderRadius: 99, fontSize: 11, cursor: 'pointer',
                  background: '#1e293b', border: '1px solid #334155', color: '#94a3b8',
                }}>
                  {ex.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>n =</span>
              <input
                value={nInput}
                onChange={(e) => { setNInput(e.target.value); handleReset() }}
                style={{
                  width: 60, padding: '5px 8px', borderRadius: 7, border: '1px solid #334155',
                  background: '#0f172a', color: '#f8fafc', fontFamily: 'monospace', fontSize: 14,
                  textAlign: 'center',
                }}
              />
            </div>

            {/* dp cells */}
            <div className="cs-dp-row">
              {(step ? step.dp : Array(n + 1).fill(0)).map((val, idx) => (
                idx === 0 ? null : (
                  <div className="cs-dp-cell" key={idx}>
                    <div className="cs-dp-idx">dp[{idx}]</div>
                    <motion.div
                      className={`cs-dp-val ${cellState(idx)}`}
                      animate={{ scale: cellState(idx) === 'active' ? 1.15 : 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    >
                      {val || 0}
                    </motion.div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>

        {/* Stairs visual */}
        <div className="cs-panel">
          <div className="cs-panel-head">
            Staircase
            <span className="cs-badge" style={{ background: '#1e293b', color: '#fb923c' }}>Visual</span>
          </div>
          <div className="cs-panel-body">
            <div className="cs-stairs">
              {Array.from({ length: Math.min(n, 12) }, (_, k) => {
                const stairNum = k + 1
                const st = cellState(stairNum)
                return (
                  <motion.div
                    key={stairNum}
                    className={`cs-stair${st === 'active' ? ' active' : st === 'filled' ? ' filled' : ''}`}
                    style={{ width: `${stairNum * (100 / Math.min(n, 12))}%` }}
                    animate={{ opacity: 1 }}
                  >
                    <span className="cs-stair-label">{stairNum}</span>
                    {step && step.dp[stairNum] > 0 && (
                      <span className="cs-stair-ways">{step.dp[stairNum]}</span>
                    )}
                  </motion.div>
                )
              })}
            </div>
            {n > 12 && <p style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>Showing steps 1–12 of {n}</p>}
          </div>
        </div>
      </div>

      <div className="cs-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
        <div className="cs-panel">
          <div className="cs-panel-head">Variables</div>
          <div className="cs-panel-body">
            <div className="cs-vars">
              <div className="cs-var-row"><span className="cs-var-name">n</span><span className="cs-var-val">{n}</span></div>
              <div className="cs-var-row"><span className="cs-var-name">i</span><span className="cs-var-val">{step?.i ?? '–'}</span></div>
              <div className="cs-var-row"><span className="cs-var-name">dp[i-1]</span><span className="cs-var-val">{step?.i ? (step.dp[step.i - 1] ?? '–') : '–'}</span></div>
              <div className="cs-var-row"><span className="cs-var-name">dp[i-2]</span><span className="cs-var-val">{step?.i ? (step.dp[step.i - 2] ?? '–') : '–'}</span></div>
              <div className="cs-var-row"><span className="cs-var-name">dp[i]</span><span className="cs-var-val highlight">{step?.i ? step.dp[step.i] : '–'}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className={`cs-status${step?.phase === 'done' ? ' done' : ''}`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      <div className="cs-dock">
        <PlaybackControls isPlaying={isPlaying} isDone={isDone} speed={speed}
          onTogglePlay={togglePlay} onStepBack={stepBack} onStepForward={stepForward}
          onReset={handleReset} onSpeedChange={setSpeed} />
      </div>
    </div>
  )
}
