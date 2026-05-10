import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './DailyTemperaturesVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution:' },
  { line: 2, text: '    def dailyTemperatures(self, temps):' },
  { line: 3, text: '        res = [0] * len(temps)' },
  { line: 4, text: '        stack = []  # indices, monotonic decreasing temps' },
  { line: 5, text: '        for i, t in enumerate(temps):' },
  { line: 6, text: '            while stack and temps[stack[-1]] < t:' },
  { line: 7, text: '                j = stack.pop()' },
  { line: 8, text: '                res[j] = i - j' },
  { line: 9, text: '            stack.append(i)' },
  { line: 10, text: '        return res' },
]

function parseTemps(input) {
  const arr = JSON.parse(input)
  if (!Array.isArray(arr)) throw new Error('Input must be array')
  return arr.map((v) => Number(v))
}

function generateSteps(temps) {
  const steps = []
  const res = Array(temps.length).fill(0)
  const stack = []
  steps.push({ phase: 'init', activeLine: 4, i: -1, temps, res: [...res], stack: [...stack], message: 'Initialize result and monotonic stack.' })
  for (let i = 0; i < temps.length; i++) {
    const t = temps[i]
    steps.push({ phase: 'iterate', activeLine: 5, i, t, temps, res: [...res], stack: [...stack], message: `Day ${i}, temp=${t}.` })
    while (stack.length && temps[stack[stack.length - 1]] < t) {
      const j = stack.pop()
      res[j] = i - j
      steps.push({
        phase: 'resolve',
        activeLine: 8,
        i, j, t,
        temps,
        res: [...res],
        stack: [...stack],
        message: `Temp ${t} is warmer than day ${j}. res[${j}] = ${res[j]}.`,
      })
    }
    stack.push(i)
    steps.push({ phase: 'push', activeLine: 9, i, t, temps, res: [...res], stack: [...stack], message: `Push day ${i} onto stack.` })
  }
  steps.push({ phase: 'done', activeLine: 10, i: temps.length - 1, temps, res: [...res], stack: [...stack], message: `Return [${res.join(', ')}].` })
  return steps
}

const EXAMPLES = [
  { label: 'Classic', temps: [73, 74, 75, 71, 69, 72, 76, 73] },
  { label: 'Increasing', temps: [30, 40, 50, 60] },
  { label: 'Decreasing', temps: [90, 80, 70, 60] },
]

export default function DailyTemperaturesVisualizer() {
  const [input, setInput] = useState('[73,74,75,71,69,72,76,73]')
  const { temps, inputError } = useMemo(() => {
    try {
      return { temps: parseTemps(input), inputError: '' }
    } catch (e) {
      return { temps: [73, 74, 75, 71, 69, 72, 76, 73], inputError: e.message || 'Invalid input' }
    }
  }, [input])
  const steps = useMemo(() => generateSteps(temps), [temps])
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
  const step = stepIndex >= 0 ? steps[stepIndex] : null
  const applyExample = useCallback((ex) => { setInput(JSON.stringify(ex.temps)); handleReset() }, [handleReset])

  return (
    <div className="dt-shell">
      <div className="dt-top">
        <section className="dt-panel">
          <header className="dt-head"><span>Monotonic Stack Flow</span>{inputError && <span className="dt-error">{inputError}</span>}</header>
          <div className="dt-body">
            <div className="dt-examples">{EXAMPLES.map((ex) => <button key={ex.label} className="dt-chip" onClick={() => applyExample(ex)}>{ex.label}</button>)}</div>
            <input className="dt-input" value={input} onChange={(e) => { setInput(e.target.value); handleReset() }} />
            <div className="dt-row">
              {temps.map((t, i) => (
                <motion.div key={`${t}-${i}`} className={`dt-cell ${step?.i === i ? 'active' : ''} ${step?.j === i ? 'resolved' : ''}`} animate={step?.i === i ? { y: -5 } : { y: 0 }}>
                  <span>{t}</span><small>{i}</small>
                </motion.div>
              ))}
            </div>
            <div className="dt-row result">
              {(step?.res || Array(temps.length).fill(0)).map((v, i) => <div key={`r-${i}`} className="dt-result-cell">{v}</div>)}
            </div>
          </div>
        </section>
        <section className="dt-panel side">
          <header className="dt-head"><span>Stack State</span></header>
          <div className="dt-body">
            <div className="dt-stack">{(step?.stack || []).map((idx) => <span key={idx}>{idx}</span>)}</div>
            <div className="dt-status">{step?.message || 'Press Play.'}</div>
          </div>
        </section>
      </div>
      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
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
  )
}
