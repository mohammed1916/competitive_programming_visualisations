import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import './AtoiVisualizer.css'

const INT_MIN = -(2 ** 31)
const INT_MAX = 2 ** 31 - 1

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution(object):' },
  { line: 2, text: '    def myAtoi(self, s):' },
  { line: 3, text: '        i = 0' },
  { line: 4, text: '        n = len(s)' },
  { line: 5, text: '        while i < n and s[i] == " ":' },
  { line: 6, text: '            i += 1' },
  { line: 7, text: '' },
  { line: 8, text: '        sign = 1' },
  { line: 9, text: '        if i < n and s[i] in "+-":' },
  { line: 10, text: '            sign = -1 if s[i] == "-" else 1' },
  { line: 11, text: '            i += 1' },
  { line: 12, text: '' },
  { line: 13, text: '        result = 0' },
  { line: 14, text: '        while i < n and s[i].isdigit():' },
  { line: 15, text: '            result = result * 10 + int(s[i])' },
  { line: 16, text: '            i += 1' },
  { line: 17, text: '' },
  { line: 18, text: '        result *= sign' },
  { line: 19, text: '        if result < -2**31:' },
  { line: 20, text: '            return -2**31' },
  { line: 21, text: '        if result > 2**31 - 1:' },
  { line: 22, text: '            return 2**31 - 1' },
  { line: 23, text: '        return result' },
]

const EXAMPLES = [
  { label: 'Simple', value: '42', note: 'No whitespace, no sign, just digits.' },
  { label: 'Leading space', value: '   -042', note: 'Skips spaces, reads sign, ignores leading zeros in the value.' },
  { label: 'Stops on letter', value: '1337c0d3', note: 'Parsing stops at the first non-digit.' },
  { label: 'Stops on symbol', value: '0-1', note: 'Reads 0, then stops at the dash.' },
  { label: 'Invalid start', value: 'words and 987', note: 'No digits can be read, so the result is 0.' },
  { label: 'Overflow', value: '91283472332', note: 'Shows positive clamping to INT_MAX.' },
  { label: 'Negative clamp', value: '   -91283472332', note: 'Shows negative clamping to INT_MIN.' },
]

const DEFAULT_INPUT = '   -042'

function isDigit(char) {
  return char >= '0' && char <= '9'
}

function clampResult(value) {
  if (value < INT_MIN) return INT_MIN
  if (value > INT_MAX) return INT_MAX
  return value
}

function getCodeHighlight(step) {
  if (!step) return { activeLine: 5, relatedLines: [3, 4, 5, 6] }

  if (step.phase === 'whitespace') return { activeLine: 6, relatedLines: [5, 6] }
  if (step.phase === 'sign') return { activeLine: 10, relatedLines: [8, 9, 10, 11] }
  if (step.phase === 'digit') return { activeLine: 15, relatedLines: [13, 14, 15, 16] }
  if (step.phase === 'stop') return { activeLine: 18, relatedLines: [18, 23] }
  if (step.phase === 'clamp-min') return { activeLine: 20, relatedLines: [18, 19, 20] }
  if (step.phase === 'clamp-max') return { activeLine: 22, relatedLines: [18, 21, 22] }

  return { activeLine: 23, relatedLines: [18, 23] }
}

function makeStep(base) {
  const code = getCodeHighlight(base)
  return { ...base, activeLine: code.activeLine, relatedLines: code.relatedLines }
}

function generateAtoiSteps(input) {
  const steps = []
  const n = input.length
  let index = 0
  let sign = 1
  let unsignedValue = 0
  let digits = ''

  while (index < n && input[index] === ' ') {
    steps.push(makeStep({
      phase: 'whitespace',
      index,
      currentChar: input[index],
      sign,
      unsignedValue,
      digits,
      result: 0,
      description: `Ignore whitespace at index ${index}.`,
      stopReason: null,
      clamped: null,
    }))
    index += 1
  }

  if (index < n && (input[index] === '+' || input[index] === '-')) {
    sign = input[index] === '-' ? -1 : 1
    steps.push(makeStep({
      phase: 'sign',
      index,
      currentChar: input[index],
      sign,
      unsignedValue,
      digits,
      result: 0,
      description: `Read '${input[index]}' and set sign to ${sign === -1 ? 'negative' : 'positive'}.`,
      stopReason: null,
      clamped: null,
    }))
    index += 1
  }

  while (index < n && isDigit(input[index])) {
    digits += input[index]
    unsignedValue = unsignedValue * 10 + Number(input[index])
    steps.push(makeStep({
      phase: 'digit',
      index,
      currentChar: input[index],
      sign,
      unsignedValue,
      digits,
      result: unsignedValue * sign,
      description: `Read digit '${input[index]}' and extend the number to ${unsignedValue}.`,
      stopReason: null,
      clamped: null,
    }))
    index += 1
  }

  let signedResult = digits ? unsignedValue * sign : 0
  let stopReason = null

  if (!digits) {
    stopReason = index < n ? `Parsing stops at '${input[index]}' because no digits were read.` : 'No digits were found, so the result stays 0.'
  } else if (index < n) {
    stopReason = `Parsing stops at '${input[index]}' because it is not a digit.`
  } else {
    stopReason = 'Reached the end of the string after reading digits.'
  }

  steps.push(makeStep({
    phase: 'stop',
    index: Math.min(index, Math.max(n - 1, 0)),
    currentChar: index < n ? input[index] : null,
    sign,
    unsignedValue,
    digits,
    result: signedResult,
    description: stopReason,
    stopReason,
    clamped: null,
  }))

  if (signedResult < INT_MIN) {
    steps.push(makeStep({
      phase: 'clamp-min',
      index: Math.min(index, Math.max(n - 1, 0)),
      currentChar: null,
      sign,
      unsignedValue,
      digits,
      result: INT_MIN,
      description: `Value is below ${INT_MIN}, so clamp to INT_MIN.`,
      stopReason,
      clamped: 'min',
    }))
  } else if (signedResult > INT_MAX) {
    steps.push(makeStep({
      phase: 'clamp-max',
      index: Math.min(index, Math.max(n - 1, 0)),
      currentChar: null,
      sign,
      unsignedValue,
      digits,
      result: INT_MAX,
      description: `Value is above ${INT_MAX}, so clamp to INT_MAX.`,
      stopReason,
      clamped: 'max',
    }))
  }

  const finalResult = clampResult(signedResult)
  steps.push(makeStep({
    phase: 'final',
    index: Math.min(index, Math.max(n - 1, 0)),
    currentChar: null,
    sign,
    unsignedValue,
    digits,
    result: finalResult,
    description: `Return ${finalResult}.`,
    stopReason,
    clamped: finalResult !== signedResult ? (finalResult === INT_MIN ? 'min' : 'max') : null,
  }))

  return steps
}

function Scanner({ input, step }) {
  return (
    <div className="atoi-scanner">
      {input.length === 0 ? (
        <div className="atoi-empty">Empty string</div>
      ) : (
        input.split('').map((char, index) => {
          const isActive = step && step.index === index && step.phase !== 'final'
          const isConsumed = step && index < step.index
          const isDigitRead = step?.digits && index >= step.index - step.digits.length && index < step.index && isDigit(input[index])

          return (
            <motion.div
              key={`${char}-${index}`}
              className={`atoi-char ${isActive ? 'active' : ''} ${isConsumed ? 'consumed' : ''} ${isDigitRead ? 'digit-read' : ''} ${char === ' ' ? 'space' : ''}`}
              animate={{ y: isActive ? -6 : 0, scale: isActive ? 1.08 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            >
              <span className="atoi-char-value mono">{char === ' ' ? '␠' : char}</span>
              <span className="atoi-char-index">{index}</span>
            </motion.div>
          )
        })
      )}
    </div>
  )
}

function CodePanel({ step }) {
  const codeRef = useRef(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!step?.activeLine || !codeRef.current) return
    const activeLine = codeRef.current.querySelector(`[data-line="${step.activeLine}"]`)
    activeLine?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [step])

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(SOLUTION_CODE.map(({ text }) => text).join('\n'))
    setCopied(true)
  }

  return (
    <motion.div className="atoi-code-panel" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22 }}>
      <div className="atoi-code-head">
        <div>
          <div className="atoi-section-label">Solution Code</div>
          <div className="atoi-code-subtitle">{step ? <>Line <span className="mono atoi-chip">{step.activeLine}</span> is active</> : 'Press Play to start'}</div>
        </div>
        <button type="button" className={`atoi-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copied ? 'Copied' : 'Copy code'}
        </button>
      </div>
      <div className="atoi-code-scroll" ref={codeRef}>
        {SOLUTION_CODE.map(({ line, text }) => {
          const isActive = step?.activeLine === line
          const isRelated = step?.relatedLines?.includes(line)
          return (
            <motion.div
              key={line}
              data-line={line}
              className={`atoi-code-row ${isActive ? 'active' : ''} ${isRelated ? 'related' : ''}`}
              animate={{ x: isActive ? 6 : 0, opacity: isRelated || isActive || !step ? 1 : 0.56 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            >
              <span className="atoi-code-no mono">{line}</span>
              <code className="atoi-code-text">{text || ' '}</code>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default function AtoiVisualizer() {
  const [inputValue, setInputValue] = useState(DEFAULT_INPUT)
  const [source, setSource] = useState(DEFAULT_INPUT)
  const [steps, setSteps] = useState(() => generateAtoiSteps(DEFAULT_INPUT))
  const [stepIndex, setStepIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(520)
  const [showCode, setShowCode] = useState(true)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const intervalRef = useRef(null)

  const sanitizedInput = inputValue.slice(0, 60)
  const hasInput = sanitizedInput.length > 0
  const inputError = attemptedSubmit && !hasInput ? 'Enter a string to visualize.' : null

  const currentStep = stepIndex >= 0 ? steps[stepIndex] : null
  const progress = steps.length > 0 ? ((stepIndex + 1) / steps.length) * 100 : 0
  const isDone = stepIndex === steps.length - 1

  const handleVisualize = useCallback(() => {
    setAttemptedSubmit(true)
    if (!hasInput) return

    setSource(sanitizedInput)
    setSteps(generateAtoiSteps(sanitizedInput))
    setStepIndex(-1)
    setIsPlaying(false)
  }, [hasInput, sanitizedInput])

  const applyExample = useCallback((example) => {
    setInputValue(example.value)
    setSource(example.value)
    setSteps(generateAtoiSteps(example.value))
    setStepIndex(-1)
    setIsPlaying(false)
    setAttemptedSubmit(false)
  }, [])

  const stepForward = useCallback(() => {
    setStepIndex((current) => {
      if (current >= steps.length - 1) {
        setIsPlaying(false)
        return current
      }
      return current + 1
    })
  }, [steps.length])

  const stepBack = () => setStepIndex((current) => Math.max(-1, current - 1))
  const handleReset = () => {
    setStepIndex(-1)
    setIsPlaying(false)
  }
  const togglePlay = () => {
    if (stepIndex >= steps.length - 1) setStepIndex(-1)
    setIsPlaying((current) => !current)
  }

  useEffect(() => {
    clearInterval(intervalRef.current)
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setStepIndex((current) => {
          if (current >= steps.length - 1) {
            setIsPlaying(false)
            return current
          }
          return current + 1
        })
      }, speed)
    }

    return () => clearInterval(intervalRef.current)
  }, [isPlaying, speed, steps.length])

  return (
    <div className="atoi">
      <div className="atoi-card atoi-input-card">
        <div className="atoi-input-row">
          <div className="atoi-field-group">
            <label className="atoi-input-label">Input string</label>
            <input
              className={`atoi-input mono ${inputError ? 'has-error' : ''}`}
              value={inputValue}
              onChange={(event) => {
                setInputValue(event.target.value)
                if (attemptedSubmit) setAttemptedSubmit(false)
              }}
              onKeyDown={(event) => event.key === 'Enter' && handleVisualize()}
              placeholder="   -042"
              maxLength={60}
            />
          </div>
          <button className="atoi-btn atoi-btn-primary" onClick={handleVisualize}>Visualize</button>
        </div>

        <div className="atoi-support-row">
          <p className={`atoi-hint ${inputError ? 'error' : ''}`}>{inputError || 'Use examples that show whitespace, signs, early stops, and 32-bit clamping.'}</p>
          <div className="atoi-meta-row">
            <span className="atoi-pill mono">len {sanitizedInput.length}</span>
            <span className="atoi-pill mono">range [{INT_MIN}, {INT_MAX}]</span>
          </div>
        </div>

        <div className="atoi-example-grid">
          {EXAMPLES.map((example) => (
            <button
              type="button"
              key={example.label}
              className={`atoi-example-card ${source === example.value ? 'active' : ''}`}
              onClick={() => applyExample(example)}
            >
              <span className="atoi-example-top">
                <span className="atoi-example-label">{example.label}</span>
                <span className="atoi-example-chip mono">{example.value || '""'}</span>
              </span>
              <span className="atoi-example-note">{example.note}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="atoi-progress-track">
        <motion.div className="atoi-progress-fill" animate={{ width: `${progress}%` }} transition={{ duration: 0.14 }} />
      </div>
      <div className="atoi-step-counter">
        {stepIndex < 0
          ? 'Not started — press Play or Next'
          : isDone
            ? `Done! Final result = ${currentStep?.result}`
            : `Step ${stepIndex + 1} / ${steps.length}`}
      </div>

      <div className="atoi-toolbar">
        <div className="atoi-toggle-group">
          <span className="atoi-toggle-label">View</span>
          <div className="atoi-toggle-pill">
            <button className={`atoi-toggle-btn ${!showCode ? 'active' : ''}`} onClick={() => setShowCode(false)}>Visual only</button>
            <button className={`atoi-toggle-btn ${showCode ? 'active' : ''}`} onClick={() => setShowCode(true)}>Visual + code</button>
          </div>
        </div>
      </div>

      <div className={`atoi-layout ${showCode ? 'with-code' : ''}`}>
        <div className="atoi-main-column">
          <div className="atoi-card">
            <div className="atoi-card-head">
              <div>
                <div className="atoi-section-label">Input Scanner</div>
                <div className="atoi-subtitle">The active reader position advances through whitespace, sign, digits, and stop characters.</div>
              </div>
              <div className="atoi-output-preview">
                <span className="atoi-output-label">Current result</span>
                <span className={`mono atoi-output-text ${currentStep?.clamped ? 'clamped' : ''}`}>{currentStep?.result ?? 0}</span>
              </div>
            </div>
            <Scanner input={source} step={currentStep} />
          </div>

          <div className="atoi-state-grid">
            <div className="atoi-card atoi-state-card">
              <div className="atoi-section-label">Parser State</div>
              <div className="atoi-kv-grid">
                <div className="atoi-kv"><span className="atoi-kv-key">Index</span><span className="mono atoi-kv-value">{currentStep?.index ?? 0}</span></div>
                <div className="atoi-kv"><span className="atoi-kv-key">Current char</span><span className="mono atoi-kv-value">{currentStep?.currentChar == null ? '—' : currentStep.currentChar === ' ' ? '␠' : currentStep.currentChar}</span></div>
                <div className="atoi-kv"><span className="atoi-kv-key">Sign</span><span className="mono atoi-kv-value">{currentStep?.sign ?? 1}</span></div>
                <div className="atoi-kv"><span className="atoi-kv-key">Digits read</span><span className="mono atoi-kv-value">{currentStep?.digits || '—'}</span></div>
                <div className="atoi-kv"><span className="atoi-kv-key">Unsigned value</span><span className="mono atoi-kv-value">{currentStep?.unsignedValue ?? 0}</span></div>
                <div className="atoi-kv"><span className="atoi-kv-key">Clamped</span><span className="mono atoi-kv-value">{currentStep?.clamped || 'no'}</span></div>
              </div>
            </div>

            <div className="atoi-card atoi-state-card">
              <div className="atoi-section-label">Explanation</div>
              <div className="atoi-explanation">{currentStep?.description || 'Start the walkthrough to see each parsing phase.'}</div>
              {currentStep?.stopReason && <div className="atoi-stop-note">{currentStep.stopReason}</div>}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showCode && <CodePanel step={currentStep} />}
        </AnimatePresence>
      </div>

      <div className="atoi-controls">
        <button className="atoi-btn atoi-btn-ghost" onClick={handleReset} disabled={stepIndex < 0}>Reset</button>
        <button className="atoi-btn atoi-btn-ghost" onClick={stepBack} disabled={stepIndex < 0}>Prev</button>
        <button className="atoi-btn atoi-btn-play" onClick={togglePlay}>{isPlaying ? 'Pause' : isDone ? 'Replay' : 'Play'}</button>
        <button className="atoi-btn atoi-btn-ghost" onClick={stepForward} disabled={isDone}>Next</button>
        <div className="atoi-speed-wrap">
          <span className="atoi-speed-label">Speed</span>
          <input type="range" min={80} max={1400} step={60} value={1480 - speed} onChange={(event) => setSpeed(1480 - Number(event.target.value))} />
        </div>
      </div>
    </div>
  )
}