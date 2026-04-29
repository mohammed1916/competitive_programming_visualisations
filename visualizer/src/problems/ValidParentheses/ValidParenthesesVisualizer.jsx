import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './ValidParenthesesVisualizer.css'

// ─── Solution code ────────────────────────────────────────────────────────────
const SOLUTION_CODE = [
  { line: 1, text: 'class Solution(object):' },
  { line: 2, text: '    def isValid(self, s):' },
  { line: 3, text: '        stack = []' },
  { line: 4, text: '        mapping = {")": "(", "}": "{", "]": "["}' },
  { line: 5, text: '        for char in s:' },
  { line: 6, text: '            if char in mapping:' },
  { line: 7, text: '                top = stack.pop() if stack else "#"' },
  { line: 8, text: '                if mapping[char] != top:' },
  { line: 9, text: '                    return False' },
  { line: 10, text: '            else:' },
  { line: 11, text: '                stack.append(char)' },
  { line: 12, text: '        return len(stack) == 0' },
]

const CLOSE_TO_OPEN = { ')': '(', '}': '{', ']': '[' }
const OPEN_SET = new Set(['(', '{', '['])

// ─── Step generator ───────────────────────────────────────────────────────────
function generateSteps(s) {
  const steps = []
  const stack = []

  steps.push({
    phase: 'init',
    i: null,
    char: null,
    stack: [],
    valid: null,
    activeLine: 3,
    message: 'Initialise empty stack.',
  })

  for (let i = 0; i < s.length; i++) {
    const char = s[i]
    const isClose = char in CLOSE_TO_OPEN

    if (isClose) {
      const top = stack.length > 0 ? stack[stack.length - 1] : '#'
      const expected = CLOSE_TO_OPEN[char]
      const match = top === expected

      steps.push({
        phase: 'check-close',
        i,
        char,
        stack: [...stack],
        top,
        expected,
        match,
        valid: null,
        activeLine: 7,
        message: `Close '${char}': pop top='${top}', expected '${expected}' → ${match ? '✓ match' : '✗ mismatch'}`,
      })

      if (!match) {
        steps.push({
          phase: 'invalid',
          i,
          char,
          stack: [...stack],
          valid: false,
          activeLine: 9,
          message: `Mismatch! '${top}' ≠ '${expected}' → return False`,
        })
        return steps
      }

      stack.pop()
    } else {
      steps.push({
        phase: 'push',
        i,
        char,
        stack: [...stack],
        valid: null,
        activeLine: 11,
        message: `Open '${char}': push onto stack.`,
      })
      stack.push(char)
    }
  }

  const isValid = stack.length === 0
  steps.push({
    phase: isValid ? 'valid' : 'invalid',
    i: null,
    char: null,
    stack: [...stack],
    valid: isValid,
    activeLine: 12,
    message: isValid
      ? 'Stack is empty → return True ✓'
      : `Stack not empty (${stack.join('')} remains) → return False ✗`,
  })
  return steps
}

// ─── Default examples ─────────────────────────────────────────────────────────
const EXAMPLES = [
  { label: '()[]{}',  s: '()[]{}' },
  { label: '()',      s: '()' },
  { label: '{[]}',    s: '{[]}' },
  { label: '(]',      s: '(]' },
  { label: '([)]',    s: '([)]' },
  { label: '(((',     s: '(((' },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function ValidParenthesesVisualizer() {
  const [sInput, setSInput] = useState('()[]{}')

  const { s, inputError } = useMemo(() => {
    const cleaned = sInput.trim()
    const valid = /^[()[\]{} ]*$/.test(cleaned)
    if (!valid) return { s: '()[]{}', inputError: 'Only bracket characters allowed' }
    return { s: cleaned.replace(/\s/g, ''), inputError: '' }
  }, [sInput])

  const steps = useMemo(() => generateSteps(s), [s])

  const {
    stepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length)

  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setSInput(ex.s)
    handleReset()
  }, [handleReset])

  // ── cell state ──────────────────────────────────────────────────────────────
  function charState(idx) {
    if (!step) return 'idle'
    if (step.phase === 'invalid' && step.i === idx) return 'done-err'
    if (step.phase === 'valid') return 'done-ok'
    if (step.i === idx) return 'active'
    if (step.i !== null && idx < step.i) return 'past'
    return 'idle'
  }

  // ── code highlight ──────────────────────────────────────────────────────────
  const activeLine = step?.activeLine ?? null

  // ── outcome classes ─────────────────────────────────────────────────────────
  const statusClass =
    step?.valid === true ? 'valid' : step?.valid === false ? 'invalid' : ''

  return (
    <div className="vp-shell">
      {/* ── top row ── */}
      <div className="vp-top">
        {/* String strip */}
        <div className="vp-panel">
          <div className="vp-panel-head">
            Input String
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
            <span className="vp-badge" style={{ background: '#1e293b', color: '#93c5fd' }}>String</span>
          </div>
          <div className="vp-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => applyExample(ex)}
                  style={{
                    padding: '3px 10px', borderRadius: 99, fontSize: 11, cursor: 'pointer',
                    background: '#1e293b', border: '1px solid #334155', color: '#94a3b8',
                    fontFamily: 'monospace',
                  }}
                >
                  {ex.label}
                </button>
              ))}
            </div>
            <input
              value={sInput}
              onChange={(e) => { setSInput(e.target.value); handleReset() }}
              placeholder="()[]{}..."
              style={{
                width: '100%', padding: '5px 10px', borderRadius: 7, border: '1px solid #334155',
                background: '#0f172a', color: '#f8fafc', fontFamily: 'monospace', fontSize: 14,
                marginBottom: 14, boxSizing: 'border-box',
              }}
            />
            <div className="vp-str-row">
              {s.split('').map((ch, idx) => (
                <motion.div key={idx} className="vp-char-cell">
                  <motion.div
                    className={`vp-char-box ${charState(idx)}`}
                    animate={{ scale: charState(idx) === 'active' ? 1.15 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  >
                    {ch}
                  </motion.div>
                  <div className="vp-char-idx">{idx}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Stack panel */}
        <div className="vp-panel">
          <div className="vp-panel-head">
            Stack (open brackets)
            <span className="vp-badge" style={{ background: '#1e293b', color: '#fb923c' }}>Stack</span>
          </div>
          <div className="vp-panel-body">
            <div style={{ fontSize: 11, color: '#475569', marginBottom: 10 }}>
              ↑ top of stack
            </div>
            <div className="vp-stack-wrap">
              <AnimatePresence>
                {(step?.stack ?? []).length === 0 ? (
                  <span className="vp-stack-empty">Stack is empty</span>
                ) : (
                  (step?.stack ?? []).map((ch, depth) => {
                    const isTop = depth === (step?.stack ?? []).length - 1
                    return (
                      <motion.div
                        key={`${depth}-${ch}`}
                        className="vp-stack-item"
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className={`vp-stack-box${isTop ? ' top-item' : ''}`}>{ch}</div>
                        <span className="vp-stack-depth">{depth}</span>
                        {isTop && <span style={{ fontSize: 10, color: '#f97316' }}>← top</span>}
                      </motion.div>
                    )
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── middle row ── */}
      <div className="vp-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />

        <div className="vp-panel">
          <div className="vp-panel-head">Variables</div>
          <div className="vp-panel-body">
            <div className="vp-vars">
              <div className="vp-var-row">
                <span className="vp-var-name">char</span>
                <span className="vp-var-val">{step?.char ?? '–'}</span>
              </div>
              <div className="vp-var-row">
                <span className="vp-var-name">stack size</span>
                <span className="vp-var-val">{step ? (step.stack?.length ?? 0) : '–'}</span>
              </div>
              {step?.top !== undefined && (
                <div className="vp-var-row">
                  <span className="vp-var-name">top</span>
                  <span className="vp-var-val">{step.top}</span>
                </div>
              )}
              {step?.expected !== undefined && (
                <div className="vp-var-row">
                  <span className="vp-var-name">expected</span>
                  <span className="vp-var-val">{step.expected}</span>
                </div>
              )}
              {step?.valid !== null && step?.valid !== undefined && (
                <div className="vp-var-row">
                  <span className="vp-var-name">result</span>
                  <span className={`vp-var-val ${step.valid ? 'ok' : 'err'}`}>
                    {step.valid ? 'True' : 'False'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── status ── */}
      <div className={`vp-status ${statusClass}`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      {/* ── dock ── */}
      <div className="vp-dock">
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
