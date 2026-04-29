import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './ZigzagVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution(object):' },
  { line: 2, text: '    def convert(self, s, numRows):' },
  { line: 3, text: '        if numRows == 1 or numRows >= len(s):' },
  { line: 4, text: '            return s' },
  { line: 5, text: '' },
  { line: 6, text: '        rows = [""] * numRows' },
  { line: 7, text: '        current_row = 0' },
  { line: 8, text: '        step = 1' },
  { line: 9, text: '' },
  { line: 10, text: '        for char in s:' },
  { line: 11, text: '            rows[current_row] += char' },
  { line: 12, text: '' },
  { line: 13, text: '            if current_row == 0:' },
  { line: 14, text: '                step = 1' },
  { line: 15, text: '            elif current_row == numRows - 1:' },
  { line: 16, text: '                step = -1' },
  { line: 17, text: '' },
  { line: 18, text: '            current_row += step' },
  { line: 19, text: '' },
  { line: 20, text: '        return "".join(rows)' },
]

const DEFAULT_INPUT = 'PAYPALISHIRING'
const DEFAULT_ROWS = 4

const EXAMPLES = [
  { label: 'Classic 3 rows', value: 'PAYPALISHIRING', rows: 3, note: 'Matches the first LeetCode example.' },
  { label: 'Classic 4 rows', value: 'PAYPALISHIRING', rows: 4, note: 'Shows the diagonal bounce more clearly.' },
  { label: 'Short bounce', value: 'ZIGZAG', rows: 3, note: 'Compact input for quick stepping.' },
  { label: 'Edge case', value: 'A', rows: 1, note: 'Early return when numRows is 1.' },
  { label: 'Tall rows', value: 'HELLO', rows: 8, note: 'Early return when rows exceed string length.' },
]

function getCodeHighlight(step) {
  if (!step) return { activeLine: 3, relatedLines: [3, 4] }
  if (step.phase === 'early-return') return { activeLine: 4, relatedLines: [3, 4] }

  const relatedLines = [10, 11]
  let activeLine = 11

  if (step.hitTop) {
    relatedLines.push(13, 14)
    activeLine = 14
  } else if (step.hitBottom) {
    relatedLines.push(15, 16)
    activeLine = 16
  }

  relatedLines.push(18)
  if (!step.hitTop && !step.hitBottom) activeLine = 18

  if (step.isFinal) {
    relatedLines.push(20)
  }

  return { activeLine, relatedLines }
}

function generateZigzagSteps(input, numRows) {
  if (!input) return []

  if (numRows === 1 || numRows >= input.length) {
    const code = getCodeHighlight({ phase: 'early-return' })
    return [{
      phase: 'early-return',
      char: null,
      charIndex: null,
      row: null,
      nextRow: null,
      direction: 0,
      rowStrings: [input],
      placements: input.split('').map((char, index) => ({ char, row: 0, col: index })),
      output: input,
      description: numRows === 1
        ? 'numRows is 1, so the zigzag collapses to the original string.'
        : 'numRows is greater than or equal to the string length, so every character stays in order.',
      activeLine: code.activeLine,
      relatedLines: code.relatedLines,
      hitTop: false,
      hitBottom: false,
      isFinal: true,
    }]
  }

  const rowStrings = Array.from({ length: numRows }, () => '')
  const placements = []
  const steps = []
  let currentRow = 0
  let direction = 1

  for (let index = 0; index < input.length; index++) {
    const char = input[index]
    rowStrings[currentRow] += char
    placements.push({ char, row: currentRow, col: index })

    const hitTop = currentRow === 0
    const hitBottom = currentRow === numRows - 1
    let nextDirection = direction
    if (hitTop) nextDirection = 1
    else if (hitBottom) nextDirection = -1

    const nextRow = index === input.length - 1 ? currentRow : currentRow + nextDirection
    const snapshot = {
      phase: 'walk',
      char,
      charIndex: index,
      row: currentRow,
      nextRow,
      direction: nextDirection,
      rowStrings: [...rowStrings],
      placements: placements.map((item) => ({ ...item })),
      output: rowStrings.join(''),
      hitTop,
      hitBottom,
      isFinal: index === input.length - 1,
    }
    const code = getCodeHighlight(snapshot)
    steps.push({
      ...snapshot,
      description: buildStepDescription(char, currentRow, hitTop, hitBottom, nextRow),
      activeLine: code.activeLine,
      relatedLines: code.relatedLines,
    })

    currentRow += nextDirection
    direction = nextDirection
  }

  return steps
}

function buildStepDescription(char, row, hitTop, hitBottom, nextRow) {
  if (hitTop) {
    return `Place '${char}' in row ${row}. At the top row, the cursor starts moving downward to row ${nextRow}.`
  }

  if (hitBottom) {
    return `Place '${char}' in row ${row}. At the bottom row, the cursor reverses upward to row ${nextRow}.`
  }

  return `Place '${char}' in row ${row}, then continue the zigzag to row ${nextRow}.`
}

function getRowSummary(rowStrings, previousStep, step, numRows) {
  const previousRows = previousStep?.rowStrings ?? Array.from({ length: numRows }, () => '')

  return rowStrings.map((value, rowIndex) => ({
    rowIndex,
    value,
    changed: value !== previousRows[rowIndex],
    active: step?.row === rowIndex,
  }))
}

function ZigzagGrid({ numRows, input, step }) {
  if (!input) return null

  const placements = step?.placements ?? []
  const placementMap = new Map(placements.map((item) => [`${item.row}-${item.col}`, item]))

  return (
    <div className="zv-grid-shell">
      <div className="zv-grid" style={{ '--rows': numRows, '--cols': input.length }}>
        {Array.from({ length: numRows }, (_, row) =>
          Array.from({ length: input.length }, (_, col) => {
            const cell = placementMap.get(`${row}-${col}`)
            const isActive = cell && step?.charIndex === col && step?.row === row
            return (
              <motion.div
                key={`${row}-${col}`}
                className={`zv-cell ${cell ? 'filled' : ''} ${isActive ? 'active' : ''}`}
                animate={{ scale: isActive ? 1.08 : 1, opacity: cell ? 1 : 0.3 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              >
                {cell ? cell.char : '·'}
              </motion.div>
            )
          }),
        )}
      </div>
    </div>
  )
}

export default function ZigzagVisualizer() {
  const [inputValue, setInputValue] = useState(DEFAULT_INPUT)
  const [rowCountInput, setRowCountInput] = useState(String(DEFAULT_ROWS))
  const [source, setSource] = useState(DEFAULT_INPUT)
  const [numRows, setNumRows] = useState(DEFAULT_ROWS)
  const [steps, setSteps] = useState(() => generateZigzagSteps(DEFAULT_INPUT, DEFAULT_ROWS))
  const [showCode, setShowCode] = useState(true)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)

  // Playback state hook
  const {
    stepIndex,
    setStepIndex,
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
    stepForward,
    stepBack,
    togglePlay,
    handleReset,
    isDone,
  } = usePlaybackState(steps.length, 520)

  const sanitizedInput = inputValue.slice(0, 28)
  const parsedRows = Number(rowCountInput)
  const rowsAreValid = Number.isInteger(parsedRows) && parsedRows >= 1 && parsedRows <= 1000
  const hasInput = sanitizedInput.trim().length > 0
  const inputError = attemptedSubmit && !hasInput ? 'Enter a string to visualize.' : null
  const rowError = attemptedSubmit && !rowsAreValid ? 'Rows must be an integer between 1 and 1000.' : null

  const currentStep = stepIndex >= 0 ? steps[stepIndex] : null
  const previousStep = stepIndex > 0 ? steps[stepIndex - 1] : null
  const rowSummary = getRowSummary(currentStep?.rowStrings ?? Array.from({ length: numRows }, () => ''), previousStep, currentStep, numRows)
  const progress = steps.length > 0 ? ((stepIndex + 1) / steps.length) * 100 : 0

  const handleVisualize = useCallback(() => {
    setAttemptedSubmit(true)
    if (!hasInput || !rowsAreValid) return

    const nextSource = sanitizedInput.trim()
    setSource(nextSource)
    setNumRows(parsedRows)
    setSteps(generateZigzagSteps(nextSource, parsedRows))
    setStepIndex(-1)
    setIsPlaying(false)
  }, [hasInput, parsedRows, rowsAreValid, sanitizedInput])

  const applyExample = useCallback((example) => {
    setInputValue(example.value)
    setRowCountInput(String(example.rows))
    setAttemptedSubmit(false)
    setSource(example.value)
    setNumRows(example.rows)
    setSteps(generateZigzagSteps(example.value, example.rows))
    setStepIndex(-1)
    setIsPlaying(false)
  }, [])

  return (
    <div className="zv">
      <div className="zv-card zv-input-card">
        <div className="zv-input-row">
          <div className="zv-field-group zv-field-string">
            <label className="zv-input-label">String</label>
            <input
              className={`zv-input mono ${inputError ? 'has-error' : ''}`}
              value={inputValue}
              onChange={(event) => {
                setInputValue(event.target.value)
                if (attemptedSubmit) setAttemptedSubmit(false)
              }}
              onKeyDown={(event) => event.key === 'Enter' && handleVisualize()}
              placeholder="PAYPALISHIRING"
              maxLength={28}
            />
          </div>

          <div className="zv-field-group zv-field-rows">
            <label className="zv-input-label">Rows</label>
            <input
              className={`zv-input ${rowError ? 'has-error' : ''}`}
              value={rowCountInput}
              onChange={(event) => {
                setRowCountInput(event.target.value.replace(/[^0-9]/g, ''))
                if (attemptedSubmit) setAttemptedSubmit(false)
              }}
              onKeyDown={(event) => event.key === 'Enter' && handleVisualize()}
              inputMode="numeric"
            />
          </div>

          <button className="zv-btn zv-btn-primary" onClick={handleVisualize}>Visualize</button>
        </div>

        <div className="zv-support-row">
          <p className={`zv-hint ${inputError || rowError ? 'error' : ''}`}>
            {inputError || rowError || 'Try the canonical PAYPALISHIRING example or a short string to inspect each bounce.'}
          </p>
          <div className="zv-meta-row">
            <span className="zv-pill mono">len {sanitizedInput.length}</span>
            <span className="zv-pill mono">rows {rowCountInput || 0}</span>
          </div>
        </div>

        <div className="zv-example-grid">
          {EXAMPLES.map((example) => (
            <button
              type="button"
              key={`${example.label}-${example.rows}`}
              className={`zv-example-card ${source === example.value && numRows === example.rows ? 'active' : ''}`}
              onClick={() => applyExample(example)}
            >
              <span className="zv-example-top">
                <span className="zv-example-label">{example.label}</span>
                <span className="zv-example-chip mono">{example.value} · {example.rows}r</span>
              </span>
              <span className="zv-example-note">{example.note}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="zv-progress-track">
        <motion.div className="zv-progress-fill" animate={{ width: `${progress}%` }} transition={{ duration: 0.14 }} />
      </div>
      <div className="zv-step-counter">
        {stepIndex < 0
          ? 'Not started — press Play or Next'
          : isDone
            ? `Done! Built output "${currentStep?.output}"`
            : `Step ${stepIndex + 1} / ${steps.length}`}
      </div>

      <div className="zv-toolbar">
        <div className="zv-toggle-group">
          <span className="zv-toggle-label">View</span>
          <div className="zv-toggle-pill">
            <button className={`zv-toggle-btn ${!showCode ? 'active' : ''}`} onClick={() => setShowCode(false)}>Visual only</button>
            <button className={`zv-toggle-btn ${showCode ? 'active' : ''}`} onClick={() => setShowCode(true)}>Visual + code</button>
          </div>
        </div>
      </div>

      <div className={`zv-layout ${showCode ? 'with-code' : ''}`}>
        <div className="zv-main-column">
          <div className="zv-card">
            <div className="zv-card-head">
              <div>
                <div className="zv-section-label">Zigzag Grid</div>
                <div className="zv-subtitle">Characters move down, then diagonally up, then repeat.</div>
              </div>
              <div className="zv-output-preview">
                <span className="zv-output-label">Output</span>
                <span className="mono zv-output-text">{currentStep?.output ?? ''}</span>
              </div>
            </div>

            <ZigzagGrid numRows={numRows} input={source} step={currentStep} />
          </div>

          <div className="zv-row-grid">
            {rowSummary.map((row) => (
              <motion.div
                key={row.rowIndex}
                className={`zv-card zv-row-card ${row.active ? 'active' : ''} ${row.changed ? 'changed' : ''}`}
                animate={{ y: row.active ? -2 : 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              >
                <div className="zv-row-label">Row {row.rowIndex}</div>
                <div className="zv-row-value mono">{row.value || '—'}</div>
              </motion.div>
            ))}
          </div>

          <div className="zv-card zv-state-card">
            <div className="zv-section-label">Step Detail</div>
            <div className="zv-state-grid">
              <div className="zv-state-item">
                <span className="zv-state-key">Current char</span>
                <span className="zv-state-value mono">{currentStep?.char ?? '—'}</span>
              </div>
              <div className="zv-state-item">
                <span className="zv-state-key">Index</span>
                <span className="zv-state-value mono">{currentStep?.charIndex ?? '—'}</span>
              </div>
              <div className="zv-state-item">
                <span className="zv-state-key">Current row</span>
                <span className="zv-state-value mono">{currentStep?.row ?? '—'}</span>
              </div>
              <div className="zv-state-item">
                <span className="zv-state-key">Next row</span>
                <span className="zv-state-value mono">{currentStep?.nextRow ?? '—'}</span>
              </div>
              <div className="zv-state-item">
                <span className="zv-state-key">Direction</span>
                <span className="zv-state-value mono">{currentStep ? (currentStep.direction === 1 ? 'down' : currentStep.direction === -1 ? 'up' : 'flat') : '—'}</span>
              </div>
              <div className="zv-state-item wide">
                <span className="zv-state-key">Explanation</span>
                <span className="zv-state-value">{currentStep?.description ?? 'Start the walkthrough to see each character placement.'}</span>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showCode && <CodeTracePanel step={currentStep} codeLines={SOLUTION_CODE} />}
        </AnimatePresence>
      </div>

      <PlaybackControls
        className="zv-controls"
        buttonClassName="zv-btn"
        ghostButtonClassName="zv-btn-ghost"
        playButtonClassName="zv-btn-play"
        onReset={handleReset}
        onPrev={stepBack}
        onPlayToggle={togglePlay}
        onNext={stepForward}
        resetDisabled={stepIndex < 0}
        prevDisabled={stepIndex < 0}
        nextDisabled={isDone}
        isPlaying={isPlaying}
        isDone={isDone}
        speedWrapClassName="zv-speed-wrap"
        speedLabelClassName="zv-speed-label"
        speed={speed}
        speedRangeValue={1480 - speed}
        onSpeedChange={(event) => setSpeed(1480 - Number(event.target.value))}
      />
    </div>
  )
}