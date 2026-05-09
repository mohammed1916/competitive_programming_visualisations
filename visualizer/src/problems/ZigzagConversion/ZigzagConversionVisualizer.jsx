import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './ZigzagConversionVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution:' },
  { line: 2, text: '    def convert(self, s: str, numRows: int) -> str:' },
  { line: 3, text: '        if numRows == 1 or numRows >= len(s):' },
  { line: 4, text: '            return s' },
  { line: 5, text: '            ' },
  { line: 6, text: '        rows = ["" for _ in range(numRows)]' },
  { line: 7, text: '        curRow = 0' },
  { line: 8, text: '        goingDown = False' },
  { line: 9, text: '        ' },
  { line: 10, text: '        for c in s:' },
  { line: 11, text: '            rows[curRow] += c' },
  { line: 12, text: '            if curRow == 0 or curRow == numRows - 1:' },
  { line: 13, text: '                goingDown = not goingDown' },
  { line: 14, text: '            curRow += 1 if goingDown else -1' },
  { line: 15, text: '            ' },
  { line: 16, text: '        return "".join(rows)' },
]

function generateSteps(s, numRows) {
  const steps = []

  if (!s || numRows === 1 || numRows >= s.length) {
    steps.push({
      phase: 'done', i: null, curRow: null, goingDown: null, rows: [], res: s,
      activeLine: 4, message: 'Base case met (numRows=1 or >= len(s)). Return s directly.'
    })
    return steps
  }

  const rows = Array.from({ length: numRows }, () => "")
  let curRow = 0
  let goingDown = false

  steps.push({
    phase: 'init', i: null, curRow, goingDown, rows: [...rows], res: null,
    activeLine: 6, message: `Initialize rows array with \${numRows} empty strings, curRow=0, goingDown=False.`
  })

  for (let i = 0; i < s.length; i++) {
    const c = s[i]

    steps.push({
      phase: 'loop', i, curRow, goingDown, rows: [...rows], res: null, c,
      activeLine: 10, message: `Read character c = '\${c}'.`
    })

    rows[curRow] += c
    steps.push({
      phase: 'append', i, curRow, goingDown, rows: [...rows], res: null, c,
      activeLine: 11, message: `Append '\${c}' to rows[\${curRow}].`
    })

    steps.push({
      phase: 'check_bounce', i, curRow, goingDown, rows: [...rows], res: null, c,
      activeLine: 12, message: `Check if curRow is at top (0) or bottom (\${numRows - 1}).`
    })

    if (curRow === 0 || curRow === numRows - 1) {
      goingDown = !goingDown
      steps.push({
        phase: 'bounce', i, curRow, goingDown, rows: [...rows], res: null, c,
        activeLine: 13, message: `Hit boundary! Flip goingDown to \${goingDown ? 'True' : 'False'}.`
      })
    }

    curRow += goingDown ? 1 : -1
    steps.push({
      phase: 'move', i, curRow, goingDown, rows: [...rows], res: null, c,
      activeLine: 14, message: `Move curRow to \${curRow} (going \${goingDown ? 'DOWN' : 'UP'}).`
    })
  }

  const res = rows.join("")
  steps.push({
    phase: 'done', i: null, curRow: null, goingDown: null, rows: [...rows], res,
    activeLine: 16, message: `Join all rows. Return "\${res}".`
  })

  return steps
}

const EXAMPLES = [
  { label: 'PAYPALISHIRING (3)', s: 'PAYPALISHIRING', numRows: 3 },
  { label: 'PAYPALISHIRING (4)', s: 'PAYPALISHIRING', numRows: 4 },
  { label: 'A (1)', s: 'A', numRows: 1 },
]

export default function ZigzagConversionVisualizer() {
  const [sInput, setSInput] = useState('PAYPALISHIRING')
  const [numRowsInput, setNumRowsInput] = useState('3')

  const { s, numRows, inputError } = useMemo(() => {
    try {
      const nr = parseInt(numRowsInput, 10)
      if (isNaN(nr) || nr < 1) throw new Error('numRows must be positive integer')
      return { s: sInput, numRows: nr, inputError: '' }
    } catch (e) {
      return { s: sInput, numRows: 3, inputError: e.message || 'Invalid input' }
    }
  }, [sInput, numRowsInput])

  const steps = useMemo(() => generateSteps(s, numRows), [s, numRows])

  const {
    stepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length)

  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setSInput(ex.s)
    setNumRowsInput(String(ex.numRows))
    handleReset()
  }, [handleReset])

  return (
    <div className="zigzag-shell">
      <div className="zigzag-top">
        <div className="zigzag-panel" style={{ flex: 1.5 }}>
          <div className="zigzag-panel-head">
            String Parsing & Row Traversal
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
          </div>
          <div className="zigzag-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => applyExample(ex)}
                  className="zigzag-example-btn"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: 13, fontFamily: 'monospace' }}>s=</span>
              <input
                value={sInput}
                onChange={(e) => { setSInput(e.target.value); handleReset() }}
                placeholder="PAYPALISHIRING"
                className="zigzag-input"
                style={{ flex: 1, margin: 0 }}
              />
              <span style={{ color: '#64748b', fontSize: 13, fontFamily: 'monospace' }}>numRows=</span>
              <input
                type="number"
                value={numRowsInput}
                onChange={(e) => { setNumRowsInput(e.target.value); handleReset() }}
                placeholder="3"
                className="zigzag-input"
                style={{ width: '60px', margin: 0, textAlign: 'center' }}
                min="1"
              />
            </div>

            <div className="zigzag-source-str">
              {s.split('').map((char, idx) => {
                const isActive = step?.i === idx
                const isProcessed = step?.i > idx || step?.phase === 'done'

                let cellClass = "zigzag-char "
                if (isActive) cellClass += "active "
                if (isProcessed && !isActive) cellClass += "processed "

                return (
                  <div key={idx} className={cellClass}>
                    {char}
                  </div>
                )
              })}
            </div>

            <div className="zigzag-rows-container">
              {Array.from({ length: numRows }).map((_, rIdx) => {
                const isCurrentRow = step?.curRow === rIdx && step?.phase !== 'done'
                const rowContent = step?.rows?.[rIdx] || ''

                let rowClass = "zigzag-row-block "
                if (isCurrentRow) rowClass += "active "

                return (
                  <div key={rIdx} className={rowClass}>
                    <div className="zigzag-row-label">
                      Row {rIdx}
                      {isCurrentRow && <div className="zigzag-row-indicator">◀</div>}
                    </div>
                    <div className="zigzag-row-chars">
                      {rowContent.split('').map((c, cIdx) => {
                        const isNewlyAdded = isCurrentRow && cIdx === rowContent.length - 1 && step?.phase === 'append'

                        return (
                          <motion.div
                            key={cIdx}
                            className="zigzag-row-char"
                            initial={isNewlyAdded ? { scale: 0, opacity: 0 } : false}
                            animate={{ scale: 1, opacity: 1 }}
                          >
                            {c}
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        </div>

        <div className="zigzag-panel" style={{ flex: 1 }}>
          <div className="zigzag-panel-head">State & Result</div>
          <div className="zigzag-panel-body" style={{ gap: 16 }}>

            <div className="zigzag-var-card">
              <span className="zigzag-var-title">goingDown</span>
              <div className={`zigzag-var-val \${step?.goingDown ? 'true' : 'false'}`}>
                {step?.goingDown === null ? 'null' : step?.goingDown ? 'True (↓)' : 'False (↑)'}
              </div>
            </div>

            <div className="zigzag-var-card">
              <span className="zigzag-var-title">curRow</span>
              <div className="zigzag-var-val">
                {step?.curRow ?? 'null'}
              </div>
            </div>

            <div className="zigzag-result-box" style={{ marginTop: 'auto' }}>
              <span className="zigzag-result-label">Result String</span>
              <div className="zigzag-result-val">
                {step?.res ? `"${step.res}"` : <span style={{ color: '#475569' }}>(Building rows...)</span>}
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="zigzag-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      </div>

      <div className={`zigzag-status \${step?.phase === 'done' ? 'success' : step?.phase === 'bounce' ? 'bounce' : ''}`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      <div className="zigzag-dock">
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
