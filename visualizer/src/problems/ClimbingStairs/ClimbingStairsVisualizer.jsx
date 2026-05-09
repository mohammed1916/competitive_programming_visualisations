import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './ClimbingStairsVisualizer.css'

const SOLUTION_CODE = [
  { line: 1,  text: 'class Solution:' },
  { line: 2,  text: '    def climbStairs(self, n: int) -> int:' },
  { line: 3,  text: '        one, two = 1, 1' },
  { line: 4,  text: '        ' },
  { line: 5,  text: '        for i in range(n - 1):' },
  { line: 6,  text: '            temp = one' },
  { line: 7,  text: '            one = one + two' },
  { line: 8,  text: '            two = temp' },
  { line: 9,  text: '            ' },
  { line: 10, text: '        return one' },
]

function generateSteps(n) {
  const steps = []

  if (n <= 0) {
      steps.push({
          phase: 'done', i: null, one: 1, two: 1, temp: null, n,
          activeLine: 10, message: 'Invalid input. Return 1.'
      })
      return steps
  }

  let one = 1
  let two = 1

  steps.push({
    phase: 'init', i: null, one, two, temp: null, n,
    activeLine: 3, message: 'Initialize one = 1, two = 1. (Base cases for n=0, n=1)'
  })

  // We loop n-1 times
  for (let i = 0; i < n - 1; i++) {
    steps.push({
      phase: 'loop', i, one, two, temp: null, n,
      activeLine: 5, message: \`Loop iteration i = \${i} (Target index \${i+2})\`
    })

    const temp = one
    steps.push({
      phase: 'temp', i, one, two, temp, n,
      activeLine: 6, message: \`Store current 'one' (\${one}) into 'temp'.\`
    })

    one = one + two
    steps.push({
      phase: 'add', i, one, two, temp, n,
      activeLine: 7, message: \`Update 'one' = one + two = \${temp} + \${two} = \${one}. (New ways to reach step \${i+2})\`
    })

    two = temp
    steps.push({
      phase: 'shift', i, one, two, temp, n,
      activeLine: 8, message: \`Shift 'two' to the old 'one' (temp = \${temp}).\`
    })
  }

  steps.push({
    phase: 'done', i: null, one, two, temp: null, n,
    activeLine: 10, message: \`Loop finished. Return 'one' = \${one}.\`
  })

  return steps
}

const EXAMPLES = [
  { label: 'n = 2', n: 2 },
  { label: 'n = 3', n: 3 },
  { label: 'n = 5', n: 5 },
  { label: 'n = 8', n: 8 },
]

export default function ClimbingStairsVisualizer() {
  const [nInput, setNInput] = useState('5')

  const { n, inputError } = useMemo(() => {
    try {
      const num = parseInt(nInput, 10)
      if (isNaN(num) || num < 1 || num > 45) throw new Error('n must be between 1 and 45')
      return { n: num, inputError: '' }
    } catch (e) {
      return { n: 5, inputError: e.message || 'Invalid input' }
    }
  }, [nInput])

  const steps = useMemo(() => generateSteps(n), [n])

  const {
    stepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length)

  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setNInput(String(ex.n))
    handleReset()
  }, [handleReset])

  // To visualize stairs, we can draw actual stairs!
  // DP array mapping: step.one represents answer for (step.i + 2) during the loop, 
  // 'two' is answer for (step.i + 1).

  // Generate the full sequence of answers to draw the DP table up to n
  const dpTable = useMemo(() => {
      const table = [1, 1] // dp[0]=1, dp[1]=1
      for (let i = 2; i <= n; i++) {
          table.push(table[i-1] + table[i-2])
      }
      return table
  }, [n])

  const currentStairIndex = step ? (step.i !== null ? step.i + 2 : (step.phase === 'init' ? 1 : n)) : 1

  return (
    <div className="cs-dp-shell">
      <div className="cs-dp-top">
        <div className="cs-dp-panel" style={{ flex: 1.5 }}>
          <div className="cs-dp-panel-head">
            Stairs & DP Array
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
          </div>
          <div className="cs-dp-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => applyExample(ex)}
                  className="cs-dp-example-btn"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: 13, fontFamily: 'monospace' }}>n =</span>
              <input
                type="number"
                value={nInput}
                onChange={(e) => { setNInput(e.target.value); handleReset() }}
                placeholder="5"
                className="cs-dp-input"
                style={{ width: '80px', margin: 0, textAlign: 'center' }}
                min="1"
                max="45"
              />
            </div>

            <div className="cs-dp-visual-area">
                <div className="cs-dp-stairs-container">
                    {/* Draw actual stairs SVG */}
                    <svg width="100%" height="200px" viewBox={\`0 0 \${Math.max(300, (n+1) * 40)} 200\`}>
                        <g transform="translate(20, 180)">
                            {Array.from({ length: n + 1 }).map((_, idx) => {
                                const stepWidth = 40
                                const stepHeight = 150 / n
                                const x = idx * stepWidth
                                const y = -idx * stepHeight
                                
                                const isActive = currentStairIndex === idx
                                const isTarget = idx === n
                                const isVisited = currentStairIndex >= idx

                                return (
                                    <g key={idx}>
                                        <rect 
                                            x={x} y={y} 
                                            width={stepWidth} height={180 - y} 
                                            fill={isActive ? 'rgba(14, 165, 233, 0.2)' : isVisited ? '#1e293b' : '#0f172a'}
                                            stroke={isActive ? '#0ea5e9' : '#334155'}
                                            strokeWidth={isActive ? 2 : 1}
                                        />
                                        <text 
                                            x={x + stepWidth/2} y={y - 10} 
                                            textAnchor="middle" 
                                            fill={isActive ? '#38bdf8' : isVisited ? '#94a3b8' : '#475569'}
                                            fontSize="12"
                                            fontWeight={isActive ? "bold" : "normal"}
                                        >
                                            {idx === 0 ? "Ground" : \`Stair \${idx}\`}
                                        </text>
                                        {/* Draw a little character */}
                                        {isActive && (
                                            <circle cx={x + stepWidth/2} cy={y - 30} r="8" fill="#eab308" />
                                        )}
                                        {isTarget && !isActive && (
                                            <text x={x + stepWidth/2} y={y - 30} textAnchor="middle" fontSize="16">🏁</text>
                                        )}
                                    </g>
                                )
                            })}
                        </g>
                    </svg>
                </div>

                <div className="cs-dp-array-container">
                    <span className="cs-dp-section-title">DP Array (Ways to reach each step)</span>
                    <div className="cs-dp-array">
                        {dpTable.map((val, idx) => {
                            const isOne = idx === currentStairIndex
                            const isTwo = idx === currentStairIndex - 1
                            
                            let cellClass = "cs-dp-cell "
                            if (isOne) cellClass += "one "
                            if (isTwo) cellClass += "two "
                            if (idx > currentStairIndex && idx !== 0 && idx !== 1) cellClass += "unknown "

                            return (
                                <div key={idx} className="cs-dp-cell-wrapper">
                                    <span className="cs-dp-index">{idx}</span>
                                    <motion.div 
                                        className={cellClass}
                                        animate={isOne || isTwo ? { y: -5 } : { y: 0 }}
                                    >
                                        {(idx > currentStairIndex && idx > 1) ? "?" : val}
                                    </motion.div>
                                    <div className="cs-dp-ptr-container">
                                        {isTwo && step?.phase !== 'done' && <div className="cs-dp-ptr two">two</div>}
                                        {isOne && step?.phase !== 'done' && <div className="cs-dp-ptr one">one</div>}
                                        {step?.phase === 'done' && idx === n && <div className="cs-dp-ptr one">Ans</div>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

          </div>
        </div>

        <div className="cs-dp-panel" style={{ flex: 1 }}>
          <div className="cs-dp-panel-head">Variables</div>
          <div className="cs-dp-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div className="cs-dp-var-card one">
                <span className="cs-dp-var-name">one</span>
                <span className="cs-dp-var-val">{step?.one ?? 1}</span>
                <span className="cs-dp-var-desc">Ways to reach current step</span>
            </div>
            
            <div className="cs-dp-var-card two">
                <span className="cs-dp-var-name">two</span>
                <span className="cs-dp-var-val">{step?.two ?? 1}</span>
                <span className="cs-dp-var-desc">Ways to reach previous step</span>
            </div>

            <div className="cs-dp-var-card temp">
                <span className="cs-dp-var-name">temp</span>
                <span className="cs-dp-var-val">{step?.temp === null ? 'null' : step?.temp ?? 'null'}</span>
                <span className="cs-dp-var-desc">Temporary holder</span>
            </div>

            {step && step.phase !== 'init' && step.i !== null && (
                <div className="cs-dp-equation">
                    <div className="cs-dp-eq-title">DP Transition:</div>
                    <div className="cs-dp-eq-body">
                        <span className="cs-dp-eq-var one">one</span>
                        <span className="cs-dp-eq-op">=</span>
                        <span className="cs-dp-eq-var temp">temp</span>
                        <span className="cs-dp-eq-op">+</span>
                        <span className="cs-dp-eq-var two">two</span>
                    </div>
                    {step.phase === 'add' && (
                        <div className="cs-dp-eq-body vals">
                            <span className="cs-dp-eq-var one">{step.one}</span>
                            <span className="cs-dp-eq-op">=</span>
                            <span className="cs-dp-eq-var temp">{step.temp}</span>
                            <span className="cs-dp-eq-op">+</span>
                            <span className="cs-dp-eq-var two">{step.two}</span>
                        </div>
                    )}
                </div>
            )}

          </div>
        </div>
      </div>

      <div className="cs-dp-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      </div>

      <div className={\`cs-dp-status \${step?.phase === 'done' ? 'success' : step?.phase === 'add' ? 'add' : ''}\`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      <div className="cs-dp-dock">
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
