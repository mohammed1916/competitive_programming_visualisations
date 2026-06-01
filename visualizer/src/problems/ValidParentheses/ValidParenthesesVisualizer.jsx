import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { useCodeVisualConnectivity } from '../../hooks/useCodeVisualConnectivity'
import './ValidParenthesesVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution:' },
  { line: 2, text: '    def isValid(self, s: str) -> bool:' },
  { line: 3, text: '        stack = []' },
  { line: 4, text: '        closeToOpen = {")": "(", "]": "[", "}": "{"}' },
  { line: 5, text: '        ' },
  { line: 6, text: '        for c in s:' },
  { line: 7, text: '            if c in closeToOpen:' },
  { line: 8, text: '                if stack and stack[-1] == closeToOpen[c]:' },
  { line: 9, text: '                    stack.pop()' },
  { line: 10, text: '                else:' },
  { line: 11, text: '                    return False' },
  { line: 12, text: '            else:' },
  { line: 13, text: '                stack.append(c)' },
  { line: 14, text: '                ' },
  { line: 15, text: '        return True if not stack else False' },
]

function generateSteps(s) {
  const steps = []

  if (typeof s !== 'string') {
    steps.push({
      phase: 'done', i: null, stack: [], c: null, success: false,
      activeLine: 15, message: 'Invalid input. Return False.'
    })
    return steps
  }

  const stack = []
  const closeToOpen = { ")": "(", "]": "[", "}": "{" }

  steps.push({
    phase: 'init', i: null, stack: [...stack], c: null,
    activeLine: 4, message: 'Initialize empty stack and closeToOpen mapping.'
  })

  for (let i = 0; i < s.length; i++) {
    const c = s[i]

    steps.push({
      phase: 'loop', i, stack: [...stack], c,
      activeLine: 6, message: `Read character c = '\${c}' at index \${i}.`
    })

    steps.push({
      phase: 'check_close', i, stack: [...stack], c,
      activeLine: 7, message: `Is '\${c}' a closing bracket? (in closeToOpen?)`
    })

    if (c in closeToOpen) {
      const match = closeToOpen[c]

      steps.push({
        phase: 'check_stack', i, stack: [...stack], c,
        activeLine: 8, message: `Yes. Check if stack is non-empty and top of stack == '\${match}'.`
      })

      if (stack.length > 0 && stack[stack.length - 1] === match) {
        const popped = stack.pop()
        steps.push({
          phase: 'pop', i, stack: [...stack], c, popped,
          activeLine: 9, message: `Match found! Pop '\${popped}' from stack.`
        })
      } else {
        steps.push({
          phase: 'fail_mismatch', i, stack: [...stack], c,
          activeLine: 11, message: `Mismatch or empty stack. Expected '\${match}' but got \${stack.length ? "'" + stack[stack.length - 1] + "'" : 'empty stack'}. Return False.`
        })
        return steps
      }
    } else {
      stack.push(c)
      steps.push({
        phase: 'push', i, stack: [...stack], c,
        activeLine: 13, message: `No, '\${c}' is an opening bracket. Push it onto the stack.`
      })
    }
  }

  const success = stack.length === 0
  steps.push({
    phase: 'done', i: null, stack: [...stack], c: null, success,
    activeLine: 15, message: success
      ? 'Loop finished and stack is empty. Return True!'
      : 'Loop finished but stack is NOT empty (unmatched open brackets). Return False.'
  })

  return steps
}

const EXAMPLES = [
  { label: 'Valid', s: '()[]{}' },
  { label: 'Nested', s: '({[]})' },
  { label: 'Mismatch', s: '(]' },
  { label: 'Unmatched Open', s: '((()' },
  { label: 'Unmatched Close', s: '())' },
]

export default function ValidParenthesesVisualizer() {
  const [sInput, setSInput] = useState('({[]})')

  const { s, inputError } = useMemo(() => {
    return { s: sInput, inputError: '' } // any string is valid input for this problem
  }, [sInput])

  const steps = useMemo(
    () => generateSteps(s).map((current) => ({
      ...current,
      relatedLines: current.relatedLines ?? (current.activeLine != null ? [current.activeLine] : []),
    })),
    [s],
  )

  const {
    stepIndex, setStepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length)

  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setSInput(ex.s)
    handleReset()
  }, [handleReset])

  const connectivity = useCodeVisualConnectivity({
    steps,
    stepIndex,
    onStepJump: setStepIndex,
  })

  return (
    <div className="vp-shell">
      <div className="vp-top">
        <div className="vp-panel" style={{ flex: 1.5 }}>
          <div className="vp-panel-head">
            String Parsing
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
          </div>
          <div className="vp-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => applyExample(ex)}
                  className="vp-example-btn"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: 13, fontFamily: 'monospace' }}>s =</span>
              <input
                value={sInput}
                onChange={(e) => { setSInput(e.target.value); handleReset() }}
                placeholder="()[]{}"
                className="vp-input"
                style={{ flex: 1, margin: 0 }}
              />
            </div>

            <div className="vp-string-container">
              {s.split('').map((char, idx) => {
                const isActive = step?.i === idx
                const isProcessed = step?.i > idx || step?.phase === 'done' || step?.phase === 'fail_mismatch'

                let cellClass = "vp-char-cell "
                if (isActive) cellClass += "active "
                if (isProcessed && !isActive) cellClass += "processed "

                if (isActive && step?.phase === 'fail_mismatch') cellClass += "fail "
                if (isActive && step?.phase === 'pop') cellClass += "match "

                return (
                  <div key={idx} className="vp-char-wrapper">
                    <div className="vp-char-index">{idx}</div>
                    <motion.div
                      className={cellClass}
                      animate={isActive ? { y: -5, scale: 1.1 } : { y: 0, scale: 1 }}
                    >
                      {char}
                    </motion.div>
                    <div className="vp-ptr-container">
                      {isActive && <div className="vp-ptr">▲</div>}
                    </div>
                  </div>
                )
              })}
              {s.length === 0 && (
                <div style={{ color: '#64748b', fontStyle: 'italic' }}>Empty string</div>
              )}
            </div>

            <div className="vp-map-legend">
              <span className="vp-legend-title">Mapping (closeToOpen)</span>
              <div className="vp-map-pairs">
                <span className="vp-map-pair">) → (</span>
                <span className="vp-map-pair">] → [</span>
                <span className="vp-map-pair">{"} → {"}</span>
              </div>
            </div>

          </div>
        </div>

        <div className="vp-panel" style={{ flex: 1 }}>
          <div className="vp-panel-head">Stack</div>
          <div className="vp-panel-body" style={{ justifyContent: 'flex-end' }}>
            <div className="vp-stack-container">
              <AnimatePresence mode="popLayout">
                {step?.stack?.map((char, idx) => {
                  const isTop = idx === step.stack.length - 1
                  const isMatching = isTop && step.phase === 'check_stack' && char === { ")": "(", "]": "[", "}": "{" }[step.c]
                  const isFailing = isTop && step.phase === 'fail_mismatch'

                  let itemClass = "vp-stack-item "
                  if (isTop) itemClass += "top "
                  if (isMatching) itemClass += "matching "
                  if (isFailing) itemClass += "failing "

                  return (
                    <motion.div
                      key={`\${idx}-\${char}`}
                      layout
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 20 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className={itemClass}
                    >
                      {char}
                      {isTop && <span className="vp-stack-top-label">TOP</span>}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              {(!step?.stack || step.stack.length === 0) && (
                <div className="vp-empty-stack">Stack is empty</div>
              )}
              <div className="vp-stack-base" />
            </div>
          </div>
        </div>
      </div>

      <div className="vp-middle">
        <CodeTracePanel
          step={step}
          codeLines={SOLUTION_CODE}
          highlightedLines={connectivity.highlightedLines}
          onLineSelect={connectivity.handleLineSelect}
        />
      </div>

      <div className={`vp-status \${step?.phase === 'done' ? (step.success ? 'success' : 'fail') : step?.phase === 'fail_mismatch' ? 'fail' : ''}`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

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
