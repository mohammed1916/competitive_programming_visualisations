import { useCallback, useMemo, useState } from 'react'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './MatrixIterationBasicsVisualizer.css'

const MODE_META = {
  full: {
    label: 'Full Matrix',
    short: 'full',
    badge: 'All cells',
    conditionText: 'if true:',
    match: () => true,
  },
  upper: {
    label: 'Upper Triangular',
    short: 'upper',
    badge: 'j >= i',
    conditionText: 'if j >= i:',
    match: (i, j) => j >= i,
  },
  lower: {
    label: 'Lower Triangular',
    short: 'lower',
    badge: 'i >= j',
    conditionText: 'if i >= j:',
    match: (i, j) => i >= j,
  },
  diag: {
    label: 'Main Diagonal',
    short: 'diag',
    badge: 'i == j',
    conditionText: 'if i == j:',
    match: (i, j) => i === j,
  },
  anti: {
    label: 'Anti Diagonal',
    short: 'anti',
    badge: 'i + j == n - 1',
    conditionText: 'if i + j == n - 1:',
    match: (i, j, n) => i + j === n - 1,
  },
}

const EXAMPLES = [3, 4, 5, 6]

function makeCodeLines(mode) {
  return [
    { line: 1, text: 'for i in range(n):' },
    { line: 2, text: '    for j in range(n):' },
    { line: 3, text: `        ${MODE_META[mode].conditionText}` },
    { line: 4, text: '            visit(i, j)' },
    { line: 5, text: '            process(matrix[i][j])' },
  ]
}

function toKey(i, j) {
  return `${i},${j}`
}

function makeMatrix(n) {
  let value = 1
  return Array.from({ length: n }, () => Array.from({ length: n }, () => value++))
}

function buildSteps(n, mode) {
  const steps = []
  const { match } = MODE_META[mode]
  const visited = new Set()
  const scanned = new Set()

  steps.push({
    activeLine: 1,
    i: null,
    j: null,
    visited: new Set(visited),
    scanned: new Set(scanned),
    message: `Starting ${MODE_META[mode].label.toLowerCase()} traversal for ${n}x${n} matrix.`,
  })

  for (let i = 0; i < n; i++) {
    steps.push({
      activeLine: 1,
      i,
      j: null,
      visited: new Set(visited),
      scanned: new Set(scanned),
      message: `Row i = ${i}: iterate j from 0 to ${n - 1}.`,
    })

    for (let j = 0; j < n; j++) {
      const key = toKey(i, j)
      const shouldVisit = match(i, j, n)
      scanned.add(key)

      steps.push({
        activeLine: 3,
        i,
        j,
        visited: new Set(visited),
        scanned: new Set(scanned),
        shouldVisit,
        message: shouldVisit
          ? `Condition satisfied at (${i}, ${j}).`
          : `Skip (${i}, ${j}) because condition is false.`,
      })

      if (shouldVisit) {
        visited.add(key)
        steps.push({
          activeLine: 5,
          i,
          j,
          visited: new Set(visited),
          scanned: new Set(scanned),
          shouldVisit,
          message: `Visit (${i}, ${j}) and process matrix[${i}][${j}].`,
        })
      }
    }
  }

  steps.push({
    activeLine: 5,
    i: null,
    j: null,
    visited: new Set(visited),
    scanned: new Set(scanned),
    message: `Traversal complete. Visited ${visited.size} cells.`,
  })

  return steps
}

export default function MatrixIterationBasicsVisualizer({ problem }) {
  const initialMode = problem?.mode && MODE_META[problem.mode] ? problem.mode : 'upper'
  const [mode, setMode] = useState(initialMode)
  const [sizeInput, setSizeInput] = useState('5')

  const { size, error } = useMemo(() => {
    const parsed = parseInt(sizeInput, 10)
    if (Number.isNaN(parsed) || parsed < 2 || parsed > 8) {
      return { size: 5, error: 'Matrix size must be 2 to 8.' }
    }
    return { size: parsed, error: '' }
  }, [sizeInput])

  const matrix = useMemo(() => makeMatrix(size), [size])
  const codeLines = useMemo(() => makeCodeLines(mode), [mode])
  const steps = useMemo(() => buildSteps(size, mode), [size, mode])

  const {
    stepIndex,
    stepForward,
    stepBack,
    togglePlay,
    handleReset,
    isPlaying,
    speed,
    setSpeed,
    isDone,
  } = usePlaybackState(steps.length)

  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applySize = useCallback((nextSize) => {
    setSizeInput(String(nextSize))
    handleReset()
  }, [handleReset])

  const applyMode = useCallback((nextMode) => {
    setMode(nextMode)
    handleReset()
  }, [handleReset])

  const status = step?.message || 'Press Play or Next to start stepping through loops.'
  const visitedCount = step?.visited?.size ?? 0
  const scannedCount = step?.scanned?.size ?? 0

  const getCellClassName = (i, j) => {
    if (!step) return 'mib-cell'
    if (step.i === i && step.j === j) return `mib-cell ${step.shouldVisit ? 'current-hit' : 'current-miss'}`

    const key = toKey(i, j)
    if (step.visited.has(key)) return 'mib-cell visited'
    if (step.scanned.has(key)) return 'mib-cell scanned'
    return 'mib-cell'
  }

  return (
    <div className="mib-shell">
      <div className="mib-grid">
        <section className="mib-panel">
          <header className="mib-panel-head">
            <span>Pattern Controls</span>
            <span className="mib-chip">{MODE_META[mode].badge}</span>
          </header>
          <div className="mib-panel-body">
            <div className="mib-mode-row">
              {Object.entries(MODE_META).map(([key, meta]) => (
                <button
                  key={key}
                  className={`mib-mode-btn ${mode === key ? 'active' : ''}`}
                  onClick={() => applyMode(key)}
                >
                  {meta.label}
                </button>
              ))}
            </div>

            <div className="mib-size-row">
              <span>n =</span>
              <input
                value={sizeInput}
                onChange={(event) => {
                  setSizeInput(event.target.value)
                  handleReset()
                }}
                className="mib-size-input"
              />
              {EXAMPLES.map((n) => (
                <button key={n} className="mib-size-preset" onClick={() => applySize(n)}>
                  {n}x{n}
                </button>
              ))}
            </div>

            {error && <p className="mib-error">{error}</p>}

            <div className="mib-stats-row">
              <div><span>Scanned</span><strong>{scannedCount}</strong></div>
              <div><span>Visited</span><strong>{visitedCount}</strong></div>
              <div><span>Current</span><strong>{step?.i !== null && step?.j !== null ? `(${step.i}, ${step.j})` : 'None'}</strong></div>
            </div>
          </div>
        </section>

        <section className="mib-panel">
          <header className="mib-panel-head">
            <span>Matrix View</span>
            <span className="mib-chip">{size} x {size}</span>
          </header>
          <div className="mib-panel-body">
            <div className="mib-matrix" style={{ gridTemplateColumns: `repeat(${size}, minmax(48px, 1fr))` }}>
              {matrix.map((row, i) => row.map((value, j) => (
                <div className={getCellClassName(i, j)} key={`${i}-${j}`}>
                  <span className="mib-idx">{i},{j}</span>
                  <span className="mib-val">{value}</span>
                </div>
              )))}
            </div>
          </div>
        </section>
      </div>

      <div className="mib-trace-grid">
        <CodeTracePanel
          step={step}
          codeLines={codeLines}
          title="Loop Pattern"
          idleLabel="Pick a pattern, then Play or Next."
          activeLabelPrefix="Executing"
          activeLabelSuffix=""
        />

        <section className="mib-panel">
          <header className="mib-panel-head">
            <span>Legend</span>
          </header>
          <div className="mib-panel-body mib-legend">
            <p><span className="dot current-hit" /> Current + visited</p>
            <p><span className="dot current-miss" /> Current + skipped</p>
            <p><span className="dot visited" /> Visited cell</p>
            <p><span className="dot scanned" /> Scanned but skipped</p>
            <p><span className="dot idle" /> Not touched yet</p>
          </div>
        </section>
      </div>

      <div className={`mib-status ${isDone ? 'done' : ''}`}>{status}</div>

      <div className="mib-dock">
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
          onSpeedChange={(event) => setSpeed(Number(event.target.value))}
        />
      </div>
    </div>
  )
}
