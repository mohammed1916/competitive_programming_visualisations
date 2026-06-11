import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import DockableWorkspace from '../../components/shared/DockableWorkspace'
import FloatingPanel from '../../components/shared/FloatingPanel'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import { useAutoScroll } from '../../hooks/useAutoScroll'
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

function VisualizationPanel({ step, temps, inputError, applyExample }) {
  return (
    <div className="dt-panel-body">
      <div className="dt-section">
        <h3 className="dt-section-title">Temperature Sequence</h3>
        <div className="dt-examples">
          {EXAMPLES.map((ex) => (
            <button key={ex.label} className="dt-chip" onClick={() => applyExample(ex)}>
              {ex.label}
            </button>
          ))}
        </div>
        {inputError && <span className="dt-error">{inputError}</span>}
        <div className="dt-row">
          {temps.map((t, i) => (
            <motion.div
              key={`${t}-${i}`}
              className={`dt-cell ${step?.i === i ? 'active' : ''} ${step?.j === i ? 'resolved' : ''}`}
              animate={step?.i === i ? { y: -5 } : { y: 0 }}
            >
              <span>{t}</span>
              <small>{i}</small>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="dt-section">
        <h3 className="dt-section-title">Days Until Warmer</h3>
        <div className="dt-row result">
          {(step?.res || Array(temps.length).fill(0)).map((v, i) => (
            <div key={`r-${i}`} className="dt-result-cell">
              {v}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StackStatePanel({ step }) {
  return (
    <div className="dt-panel-body">
      <div className="dt-section">
        <h3 className="dt-section-title">Monotonic Stack</h3>
        <div className="dt-stack">{(step?.stack || []).map((idx) => <span key={idx}>{idx}</span>)}</div>
      </div>

      <div className="dt-section">
        <h3 className="dt-section-title">Current Step</h3>
        <div className="dt-status">{step?.message || 'Press Play to start.'}</div>
      </div>
    </div>
  )
}

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
  const [autoScrollCode, setAutoScrollCode] = useAutoScroll()
  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

  const dockPanels = [
    {
      id: 'input',
      title: 'Input & Visualization',
      subtitle: temps.length ? `${temps.length} temperatures` : 'Enter temperatures to begin',
      defaultZone: 'left',
      content: (
        <VisualizationPanel
          step={step}
          temps={temps}
          inputError={inputError}
          applyExample={applyExample}
        />
      ),
    },
    {
      id: 'stack',
      title: 'Stack State',
      subtitle: step ? `Step ${stepIndex + 1} of ${steps.length}` : 'Press play to start',
      defaultZone: 'left',
      content: <StackStatePanel step={step} />,
    },
    {
      id: 'code',
      title: 'Code Trace',
      subtitle: step ? `Active line ${step.activeLine}` : 'Line-by-line solution view',
      defaultZone: 'full',
      content: (
        <CodeTracePanel
          step={step}
          codeLines={SOLUTION_CODE}
          onActiveLineDomChange={setActiveLineDom}
          autoScroll={autoScrollCode}
        />
      ),
    },
  ]

  const summaryCards = [
    { label: 'Algorithm', value: 'Monotonic Stack' },
    { label: 'Time Complexity', value: 'O(n)' },
    { label: 'Space Complexity', value: 'O(n)' },
    { label: 'Temperatures', value: temps.length || '—' },
  ]

  return (
    <div className="dt-shell">
      <section className="dt-hero">
        <div className="dt-hero-copy">
          <span className="dt-kicker">Daily Temperatures • Monotonic Stack</span>
          <h2>Find Warmer Days Ahead</h2>
          <p>
            Trace through the monotonic stack algorithm to find how many days until a warmer temperature
            for each day in the input sequence. Visualize the stack operations and result computation step-by-step.
          </p>
        </div>

        <div className="dt-summary-grid">
          {summaryCards.map((card) => (
            <div key={card.label} className="dt-summary-card">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          ))}
        </div>

        <div className="dt-input-section">
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>Input Temperatures</span>
            <input
              className="dt-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                handleReset()
              }}
              placeholder="[73,74,75,71,69,72,76,73]"
            />
          </label>
        </div>
      </section>

      <DockableWorkspace
        title="Daily Temperatures Workspace"
        panels={dockPanels}
        initialLayout={{
          rows: [['input', 'stack'], ['code']],
          minimized: [],
        }}
      />

      <FloatingPanel title="Playback Controls">
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
          speedIndicator={`${speed}ms`}
          autoScroll={autoScrollCode}
          onAutoScrollChange={setAutoScrollCode}
          autoScrollLabel="Auto-scroll code"
          showAutoScroll
          showPatternOverlay={showPatternOverlay}
          onShowPatternOverlayChange={setShowPatternOverlay}
          patternOverlayLabel="Show pattern overlay"
          showPatternOverlayToggle
        />
      </FloatingPanel>

      {showPatternOverlay && step && (
        <PatternOverlay step={step} activeLineDom={activeLineDom} />
      )}
    </div>
  )
}
