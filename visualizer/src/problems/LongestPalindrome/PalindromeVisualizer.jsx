import { Fragment, useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './PalindromeVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution(object):' },
  { line: 2, text: '    def longestPalindrome(self, s):' },
  { line: 3, text: '        """' },
  { line: 4, text: '        :type s: str' },
  { line: 5, text: '        :rtype: str' },
  { line: 6, text: '        """' },
  { line: 7, text: '        n = len(s)' },
  { line: 8, text: '        if n == 0:' },
  { line: 9, text: '            return ""' },
  { line: 10, text: '' },
  { line: 11, text: '        start = 0' },
  { line: 12, text: '        max_length = 1' },
  { line: 13, text: '' },
  { line: 14, text: '        dp = [[False] * n for _ in range(n)]' },
  { line: 15, text: '' },
  { line: 16, text: '        for i in range(n):' },
  { line: 17, text: '            dp[i][i] = True  # Single characters are palindromes' },
  { line: 18, text: '' },
  { line: 19, text: '        for length in range(2, n + 1):' },
  { line: 20, text: '            for i in range(n - length + 1):' },
  { line: 21, text: '                j = i + length - 1' },
  { line: 22, text: '' },
  { line: 23, text: '                if s[i] == s[j]:' },
  { line: 24, text: '                    if length == 2:' },
  { line: 25, text: '                        dp[i][j] = True' },
  { line: 26, text: '                    else:' },
  { line: 27, text: '                        dp[i][j] = dp[i + 1][j - 1]' },
  { line: 28, text: '' },
  { line: 29, text: '                    if dp[i][j] and length > max_length:' },
  { line: 30, text: '                        start = i' },
  { line: 31, text: '                        max_length = length' },
  { line: 32, text: '' },
  { line: 33, text: '        return s[start:start + max_length]' },
]

function getCodeHighlight(stepMeta) {
  if (stepMeta.phase === 'init') {
    return {
      activeLine: 17,
      relatedLines: [16, 17],
    }
  }

  const relatedLines = [19, 20, 21, 23]
  let activeLine = 23

  if (stepMeta.charsMatch) {
    if (stepMeta.len === 2) {
      relatedLines.push(24, 25)
      activeLine = 25
    } else {
      relatedLines.push(26, 27)
      activeLine = 27
    }

    if (stepMeta.updatesBest) {
      relatedLines.push(29, 30, 31)
      activeLine = 31
    }
  }

  return { activeLine, relatedLines }
}

/* ═══════════════════════════════════════════════════════════════
   STEP GENERATOR
   Pre-computes every state the DP table will pass through.
   ═══════════════════════════════════════════════════════════════ */
function generateSteps(s) {
  const n = s.length
  if (n === 0) return []

  // dp[i][j] starts null (unvisited), becomes true/false
  const dp = Array.from({ length: n }, () => Array(n).fill(null))
  const steps = []
  let bestStart = 0
  let bestLen = 1

  /* ── Phase 1: Diagonal – single characters ───────────────── */
  for (let i = 0; i < n; i++) {
    dp[i][i] = true
    const code = getCodeHighlight({ phase: 'init' })
    steps.push({
      phase: 'init',
      i, j: i,
      isPalin: true,
      charsMatch: true,
      innerOk: null,
      outerLeft: i, outerRight: i,
      inner: null,
      description: `'${s[i]}' at index ${i} — single character, always a palindrome`,
      dp: dp.map(r => [...r]),
      bestStart, bestLen,
      activeLine: code.activeLine,
      relatedLines: code.relatedLines,
    })
  }

  /* ── Phase 2: Length 2 → n ───────────────────────────────── */
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i <= n - len; i++) {
      const j = i + len - 1
      const charsMatch = s[i] === s[j]
      const innerOk = len === 2 ? true : (dp[i + 1][j - 1] === true)
      const isPalin = charsMatch && innerOk
      const updatesBest = isPalin && len > bestLen

      dp[i][j] = isPalin

      if (updatesBest) {
        bestStart = i
        bestLen = len
      }

      const code = getCodeHighlight({ phase: 'check', charsMatch, len, updatesBest })

      steps.push({
        phase: 'check',
        i, j, len,
        isPalin, charsMatch, innerOk,
        outerLeft: i, outerRight: j,
        inner: len > 2 ? { l: i + 1, r: j - 1 } : null,
        description: buildDesc(s, i, j, charsMatch, innerOk, isPalin, len),
        dp: dp.map(r => [...r]),
        bestStart, bestLen,
        updatesBest,
        activeLine: code.activeLine,
        relatedLines: code.relatedLines,
      })
    }
  }

  return steps
}

function buildDesc(s, i, j, charsMatch, innerOk, isPalin, len) {
  const sub = `"${s.slice(i, j + 1)}"`
  if (len === 2) {
    return charsMatch
      ? `s[${i}]='${s[i]}' = s[${j}]='${s[j]}' → ${sub} is a palindrome ✓`
      : `s[${i}]='${s[i]}' ≠ s[${j}]='${s[j]}' → ${sub} is NOT a palindrome ✗`
  }
  if (!charsMatch)
    return `s[${i}]='${s[i]}' ≠ s[${j}]='${s[j]}' → ${sub} is NOT a palindrome ✗`
  if (!innerOk)
    return `s[${i}]='${s[i]}' = s[${j}]='${s[j]}' but inner "${s.slice(i+1,j)}" is not a palindrome → NOT a palindrome ✗`
  return `s[${i}]='${s[i]}' = s[${j}]='${s[j]}' and inner "${s.slice(i+1,j)}" is a palindrome → ${sub} is a palindrome ✓`
}

function getVariableSections(step, previousStep, str) {
  const fallback = {
    n: str.length,
    i: null,
    j: null,
    length: null,
    start: 0,
    maxLength: str.length > 0 ? 1 : 0,
    charsMatch: null,
    innerOk: null,
    dpValue: null,
    window: null,
    innerWindow: null,
  }

  const current = step
    ? {
        n: str.length,
        i: step.i,
        j: step.j,
        length: step.phase === 'init' ? 1 : step.len,
        start: step.bestStart,
        maxLength: step.bestLen,
        charsMatch: step.phase === 'init' ? true : step.charsMatch,
        innerOk: step.innerOk,
        dpValue: step.isPalin,
        window: step.outerLeft != null ? str.slice(step.outerLeft, step.outerRight + 1) : null,
        innerWindow: step.inner ? str.slice(step.inner.l, step.inner.r + 1) : null,
      }
    : fallback

  const previous = previousStep
    ? {
        i: previousStep.i,
        j: previousStep.j,
        length: previousStep.phase === 'init' ? 1 : previousStep.len,
        start: previousStep.bestStart,
        maxLength: previousStep.bestLen,
        charsMatch: previousStep.phase === 'init' ? true : previousStep.charsMatch,
        innerOk: previousStep.innerOk,
        dpValue: previousStep.isPalin,
        window: previousStep.outerLeft != null ? str.slice(previousStep.outerLeft, previousStep.outerRight + 1) : null,
        innerWindow: previousStep.inner ? str.slice(previousStep.inner.l, previousStep.inner.r + 1) : null,
      }
    : null

  const change = (key) => previous ? previous[key] !== current[key] : false

  const makeItem = (config) => ({ ...config, id: config.label })

  return [
    {
      title: 'Loop Variables',
      items: [
        makeItem({ label: 'n', value: current.n, changed: false, explanation: `Total input length. Here n = ${current.n}.` }),
        makeItem({ label: 'length', value: current.length, changed: change('length'), explanation: current.length == null ? 'Current substring length is not set yet.' : `Current outer loop length. The algorithm is checking substrings of length ${current.length}.` }),
        makeItem({ label: 'i', value: current.i, changed: change('i'), explanation: current.i == null ? 'Left pointer is not set yet.' : `Left index of the current substring window. i = ${current.i}.` }),
        makeItem({ label: 'j', value: current.j, changed: change('j'), explanation: current.j == null ? 'Right pointer is not set yet.' : `Right index of the current substring window. j = ${current.j}.` }),
      ],
    },
    {
      title: 'State Variables',
      items: [
        makeItem({ label: 'start', value: current.start, changed: change('start'), explanation: `Start index of the best palindrome found so far. Current start = ${current.start}.` }),
        makeItem({ label: 'max_length', value: current.maxLength, changed: change('maxLength'), wide: true, explanation: `Length of the best palindrome found so far. Current max_length = ${current.maxLength}.` }),
        makeItem({ label: 'current window', value: current.window ? `"${current.window}"` : null, changed: change('window'), wide: true, explanation: current.window ? `This is the substring currently being tested: "${current.window}".` : 'No active substring window yet.' }),
        makeItem({ label: 'inner substring', value: current.innerWindow ? `"${current.innerWindow}"` : null, changed: change('innerWindow'), wide: true, explanation: current.innerWindow ? `Inner substring used for the DP transition: "${current.innerWindow}".` : 'There is no inner substring for this step.' }),
      ],
    },
    {
      title: 'Condition Checks',
      items: [
        makeItem({ label: 'end chars match', value: current.charsMatch, changed: change('charsMatch'), tone: current.charsMatch === true ? 'success' : current.charsMatch === false ? 'error' : 'neutral', explanation: current.charsMatch == null ? 'Character comparison has not started yet.' : current.charsMatch ? 'The left and right end characters are equal.' : 'The left and right end characters are different.' }),
        makeItem({ label: 'inner is palindrome', value: current.innerOk, changed: change('innerOk'), wide: true, tone: current.innerOk === true ? 'success' : current.innerOk === false ? 'error' : 'neutral', explanation: current.innerOk == null ? 'No inner DP check is needed for this step.' : current.innerOk ? 'The inner substring already has dp = true, so it is a palindrome.' : 'The inner substring has dp = false, so it breaks the palindrome.' }),
        makeItem({ label: 'dp[i][j]', value: current.dpValue, changed: change('dpValue'), tone: current.dpValue === true ? 'success' : current.dpValue === false ? 'error' : 'neutral', explanation: current.dpValue == null ? 'This DP cell is not evaluated yet.' : current.dpValue ? 'The current substring is a palindrome, so dp[i][j] becomes true.' : 'The current substring is not a palindrome, so dp[i][j] becomes false.' }),
        makeItem({ label: 'best updated', value: step?.updatesBest ?? false, changed: Boolean(step?.updatesBest), tone: step?.updatesBest ? 'warning' : 'neutral', explanation: step?.updatesBest ? 'This step found a longer palindrome, so start and max_length were updated.' : 'This step did not improve the best palindrome so far.' }),
      ],
    },
  ]
}

function formatVariableValue(value) {
  if (value === null || value === undefined) return '—'
  if (value === true) return 'true'
  if (value === false) return 'false'
  return String(value)
}

function VariablePanel({ step, previousStep, str }) {
  const [explainer, setExplainer] = useState(null)
  const sections = getVariableSections(step, previousStep, str)

  useEffect(() => {
    if (!explainer) return
    const timer = setTimeout(() => setExplainer(null), 2200)
    return () => clearTimeout(timer)
  }, [explainer])

  return (
    <div className="variable-panel-wrap">
      <AnimatePresence>
        {explainer && (
          <motion.div
            key={explainer.id}
            className="variable-explainer"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="variable-explainer-title mono">{explainer.label}</div>
            <div className="variable-explainer-text">{explainer.explanation}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="variable-panel-grid">
        {sections.map((section) => (
          <motion.div
            key={section.title}
            className="variable-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="section-label">{section.title}</div>
            <div className="variable-list">
              {section.items.map((item) => (
                <motion.button
                  type="button"
                  key={item.label}
                  className={`variable-item ${item.wide ? 'wide' : ''} ${item.changed ? 'changed' : ''} ${explainer?.id === item.id ? 'active-explainer' : ''}`}
                  onClick={() => setExplainer(item)}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="variable-key mono">{item.label}</span>
                  <span className={`variable-value mono tone-${item.tone || 'neutral'}`}>
                    {formatVariableValue(item.value)}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CHAR BOX
   ═══════════════════════════════════════════════════════════════ */
function CharBox({ char, idx, step }) {
  const isInBest   = step && idx >= step.bestStart && idx < step.bestStart + step.bestLen
  const isOuter    = step && (idx === step.outerLeft || idx === step.outerRight)
  const isInWin    = step && idx > step.outerLeft && idx < step.outerRight
  const outerClass = isOuter
    ? (step.charsMatch ? 'outer-match' : 'outer-mismatch')
    : ''

  const lifted  = step && (isOuter || isInWin)
  const scaleUp = step && isOuter

  return (
    <motion.div
      className={`char-box ${isInBest ? 'in-best' : ''} ${outerClass} ${isInWin ? 'in-window' : ''}`}
      animate={{
        y: lifted ? (scaleUp ? -12 : -5) : 0,
        scale: scaleUp ? 1.18 : 1,
      }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
    >
      <span className="ch mono">{char}</span>
      <span className="ch-idx">{idx}</span>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   DP CELL
   ═══════════════════════════════════════════════════════════════ */
function DpCell({ i, j, dp, step }) {
  if (i > j) {
    return <div className="dp-cell lower">—</div>
  }

  const val = dp ? dp[i]?.[j] : null
  const isActive = step && step.i === i && step.j === j

  let state = 'unvisited'
  if (isActive)        state = 'active'
  else if (val === true)  state = 'palindrome'
  else if (val === false) state = 'not-palindrome'

  return (
    <motion.div
      className={`dp-cell ${state}`}
      animate={{
        scale: isActive ? 1.18 : 1,
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
    >
        {val === true && '✓'}
        {val === false && '✗'}
        {val === null && isActive && '?'}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STEP DETAIL PANEL
   ═══════════════════════════════════════════════════════════════ */
function StepDetail({ step, str }) {
  if (!step) return null
  const { i, j, isPalin, charsMatch, innerOk, inner, phase } = step
  const borderClass = phase === 'init' ? 'init' : isPalin ? 'palindrome' : 'error'

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${i}-${j}`}
        className={`step-card border-${borderClass}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
      >
        {phase === 'init' ? (
          <p>
            <span className="label">Init</span>
            <span className="mono" style={{ color: 'var(--primary-l)' }}>dp[{i}][{j}]</span>
            {' '}= <span style={{ color: 'var(--success)' }}>true</span>
            {' '}— single char <span className="mono" style={{ color: 'var(--warning)' }}>'{str[i]}'</span>
          </p>
        ) : (
          <div className="step-rows">
            <div className="step-row">
              <span className="label">Comparing</span>
              <span>
                <span className="mono hi-char">s[{i}]='{str[i]}'</span>
                {' vs '}
                <span className="mono hi-char">s[{j}]='{str[j]}'</span>
                {' '}
                {charsMatch
                  ? <span className="match">match ✓</span>
                  : <span className="no-match">mismatch ✗</span>}
              </span>
            </div>
            {inner && (
              <div className="step-row">
                <span className="label">Inner</span>
                <span>
                  <span className="mono" style={{ color: 'var(--info)' }}>dp[{i+1}][{j-1}]</span>
                  {' = '}
                  {innerOk
                    ? <span style={{ color: 'var(--success)' }}>true ✓</span>
                    : <span style={{ color: 'var(--error)' }}>false ✗</span>}
                  {' '}
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                    ("{str.slice(i+1, j)}")
                  </span>
                </span>
              </div>
            )}
            <div className="step-row verdict-row">
              <span className="label">Verdict</span>
              {isPalin
                ? <span className="verdict palindrome-verdict">"{str.slice(i, j+1)}" is a palindrome ✓</span>
                : <span className="verdict error-verdict">"{str.slice(i, j+1)}" is NOT a palindrome ✗</span>}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

function CodePanel({ step }) {
  const codeRef = useRef(null)

  useEffect(() => {
    if (!step?.activeLine || !codeRef.current) return

    const activeLine = codeRef.current.querySelector(`[data-line="${step.activeLine}"]`)
    activeLine?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [step])

  return (
    <motion.div
      className="code-panel"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22 }}
    >
      <div className="code-panel-head">
        <div>
          <div className="section-label">Solution Code</div>
          <div className="code-panel-subtitle">
            {step
              ? <>Currently executing line <span className="mono code-line-chip">{step.activeLine}</span></>
              : 'Press Play to start code tracking'}
          </div>
        </div>
      </div>

      <div className="code-scroll" ref={codeRef}>
        {SOLUTION_CODE.map(({ line, text }) => {
          const isActive = step?.activeLine === line
          const isRelated = step?.relatedLines?.includes(line)

          return (
            <motion.div
              key={line}
              data-line={line}
              className={`code-row ${isActive ? 'active' : ''} ${isRelated ? 'related' : ''}`}
              animate={{
                x: isActive ? 6 : 0,
                opacity: isRelated || isActive || !step ? 1 : 0.58,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <span className="code-line-no mono">{line}</span>
              <code className="code-line-text">{text || ' '}</code>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN VISUALIZER
   ═══════════════════════════════════════════════════════════════ */
const DEFAULT = 'racecar'

export default function PalindromeVisualizer() {
  const [inputStr, setInputStr]  = useState(DEFAULT)
  const [str, setStr]            = useState(DEFAULT)
  const [steps, setSteps]        = useState(() => generateSteps(DEFAULT))
  const [stepIdx, setStepIdx]    = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed]        = useState(500) // ms per step
  const [showCode, setShowCode]  = useState(true)
  const [codeWidth, setCodeWidth] = useState('normal')
  const intervalRef = useRef(null)

  const n = str.length
  const currentStep = stepIdx >= 0 ? steps[stepIdx] : null
  const previousStep = stepIdx > 0 ? steps[stepIdx - 1] : null
  const dpTable = currentStep?.dp ?? null
  const bestStart = currentStep?.bestStart ?? 0
  const bestLen   = currentStep?.bestLen   ?? (n > 0 ? 1 : 0)

  /* ── Handlers ─────────────────────────────────────────────── */
  const handleVisualize = () => {
    const s = inputStr.trim().slice(0, 14) // cap at 14 for readable grid
    if (!s) return
    setStr(s)
    setSteps(generateSteps(s))
    setStepIdx(-1)
    setIsPlaying(false)
  }

  const stepForward = useCallback(() => {
    setStepIdx(prev => {
      if (prev >= steps.length - 1) { setIsPlaying(false); return prev }
      return prev + 1
    })
  }, [steps.length])

  const stepBack = () => setStepIdx(prev => Math.max(-1, prev - 1))

  const handleReset = () => { setStepIdx(-1); setIsPlaying(false) }

  const togglePlay = () => {
    if (stepIdx >= steps.length - 1) setStepIdx(-1)
    setIsPlaying(p => !p)
  }

  /* ── Playback loop ────────────────────────────────────────── */
  useEffect(() => {
    clearInterval(intervalRef.current)
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setStepIdx(prev => {
          if (prev >= steps.length - 1) { setIsPlaying(false); return prev }
          return prev + 1
        })
      }, speed)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, speed, steps.length])

  /* ── Render ──────────────────────────────────────────────── */
  const progress = steps.length > 0 ? ((stepIdx + 1) / steps.length) * 100 : 0
  const isDone   = stepIdx === steps.length - 1

  return (
    <div className="pv">

      {/* ── INPUT ─────────────────────────────────────────── */}
      <div className="pv-card input-card">
        <div className="input-row">
          <label className="input-label">String</label>
          <input
            className="str-input mono"
            value={inputStr}
            onChange={e => setInputStr(e.target.value.replace(/\s/g, ''))}
            onKeyDown={e => e.key === 'Enter' && handleVisualize()}
            placeholder="e.g. racecar"
            maxLength={14}
          />
          <button className="btn btn-primary" onClick={handleVisualize}>
            Visualize
          </button>
        </div>
        <p className="input-hint">Max 14 characters for clear grid visibility. Press Enter or click Visualize.</p>
      </div>

      {/* ── PROGRESS BAR ──────────────────────────────────── */}
      <div className="progress-track">
        <motion.div
          className="progress-fill"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.12 }}
        />
      </div>
      <div className="step-counter">
        {stepIdx < 0
          ? 'Not started — press Play or Step →'
          : isDone
            ? `Done! All ${steps.length} steps complete`
            : `Step ${stepIdx + 1} / ${steps.length}`}
      </div>

      <div className="view-toggle-wrap">
        <div className="view-toggle-group">
          <span className="view-toggle-label">View</span>
          <div className="view-toggle-pill">
            <button
              className={`view-toggle-btn ${!showCode ? 'active' : ''}`}
              onClick={() => setShowCode(false)}
            >
              Visual only
            </button>
            <button
              className={`view-toggle-btn ${showCode ? 'active' : ''}`}
              onClick={() => setShowCode(true)}
            >
              Visual + code
            </button>
          </div>
        </div>

        {showCode && (
          <div className="view-toggle-group">
            <span className="view-toggle-label">Code width</span>
            <div className="view-toggle-pill">
              <button
                className={`view-toggle-btn ${codeWidth === 'normal' ? 'active' : ''}`}
                onClick={() => setCodeWidth('normal')}
              >
                Normal
              </button>
              <button
                className={`view-toggle-btn ${codeWidth === 'wide' ? 'active' : ''}`}
                onClick={() => setCodeWidth('wide')}
              >
                Wide
              </button>
              <button
                className={`view-toggle-btn ${codeWidth === 'full' ? 'active' : ''}`}
                onClick={() => setCodeWidth('full')}
              >
                Full
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={`content-shell ${showCode ? 'split' : 'single'} code-width-${codeWidth} ${n > 0 ? 'has-variables' : ''}`}>

      {n > 0 && (
        <div className="variable-column">
          <div className="pv-card variable-shell">
            <div className="section-label">Variable Tracker</div>
            <VariablePanel step={currentStep} previousStep={previousStep} str={str} />
          </div>
        </div>
      )}

        <div className="visual-column">

      {/* ── STRING DISPLAY ────────────────────────────────── */}
      {n > 0 && (
        <div className="pv-card">
          <div className="section-label">Input String</div>
          <div className="chars-row">
            {str.split('').map((ch, idx) => (
              <CharBox key={idx} char={ch} idx={idx} step={currentStep} />
            ))}
          </div>
          {currentStep && (
            <motion.p
              className="window-hint"
              key={`hint-${currentStep.i}-${currentStep.j}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {currentStep.phase === 'init'
                ? <>Initialising <span className="mono hi">s[{currentStep.i}]</span></>
                : <>
                    Checking window{' '}
                    <span className="mono hi">[{currentStep.outerLeft}, {currentStep.outerRight}]</span>
                    {' = '}
                    <span className="mono hi">"{str.slice(currentStep.outerLeft, currentStep.outerRight + 1)}"</span>
                  </>
              }
            </motion.p>
          )}
        </div>
      )}

      {/* ── DP TABLE ──────────────────────────────────────── */}
      {n > 0 && (
        <div className="pv-card">
          <div className="section-label">
            DP Table — <span className="mono" style={{ color: 'var(--primary-l)' }}>dp[i][j]</span>
            {' '}= is <span className="mono" style={{ color: 'var(--info)' }}>s[i..j]</span> a palindrome?
          </div>

          <div className="dp-scroll">
            <div className="dp-grid" style={{ '--cols': n + 1 }}>

              {/* Corner + column headers */}
              <div className="dp-corner" />
              {Array.from({ length: n }, (_, j) => (
                <div
                  key={j}
                  className={`dp-header ${currentStep && currentStep.j === j ? 'hdr-active' : ''}`}
                >
                  <span>{j}</span>
                  <span className="mono" style={{ color: 'var(--text-muted)' }}>'{str[j]}'</span>
                </div>
              ))}

              {/* Rows */}
              {Array.from({ length: n }, (_, i) => (
                <Fragment key={`row-${i}`}>
                  <div
                    key={`rh-${i}`}
                    className={`dp-header row-header ${currentStep && currentStep.i === i ? 'hdr-active' : ''}`}
                  >
                    <span>{i}</span>
                    <span className="mono" style={{ color: 'var(--text-muted)' }}>'{str[i]}'</span>
                  </div>
                  {Array.from({ length: n }, (_, j) => (
                    <DpCell key={`c-${i}-${j}`} i={i} j={j} dp={dpTable} step={currentStep} />
                  ))}
                </Fragment>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="legend">
            <div className="legend-item"><div className="lbox active" />Active</div>
            <div className="legend-item"><div className="lbox palindrome" />Palindrome</div>
            <div className="legend-item"><div className="lbox not-palindrome" />Not palindrome</div>
            <div className="legend-item"><div className="lbox unvisited" />Unvisited</div>
          </div>
        </div>
      )}

      {/* ── BEST PALINDROME ───────────────────────────────── */}
      {currentStep && (
        <motion.div
          className="best-card"
          layout
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        >
          <span className="best-label">Best so far</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={`${bestStart}-${bestLen}`}
              className="best-text mono"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ duration: 0.2 }}
            >
              "{str.slice(bestStart, bestStart + bestLen)}"
            </motion.span>
          </AnimatePresence>
          <span className="best-len">length {bestLen}</span>
        </motion.div>
      )}

      {/* ── STEP DETAIL ───────────────────────────────────── */}
      <StepDetail step={currentStep} str={str} />

        </div>

        <AnimatePresence>
          {showCode && <CodePanel step={currentStep} />}
        </AnimatePresence>
      </div>

      {/* ── CONTROLS ──────────────────────────────────────── */}
      {n > 0 && (
        <div className="controls">
          <button className="btn btn-ghost" onClick={handleReset} disabled={stepIdx < 0}>
            ↺ Reset
          </button>
          <button className="btn btn-ghost" onClick={stepBack} disabled={stepIdx < 0}>
            ‹ Prev
          </button>
          <button className="btn btn-play" onClick={togglePlay}>
            {isPlaying ? '⏸ Pause' : isDone ? '↺ Replay' : '▶ Play'}
          </button>
          <button className="btn btn-ghost" onClick={stepForward} disabled={isDone}>
            Next ›
          </button>

          <div className="speed-wrap">
            <span className="speed-label">Speed</span>
            <input
              type="range" min={80} max={1400} step={60}
              value={1480 - speed}
              onChange={e => setSpeed(1480 - Number(e.target.value))}
            />
            <span className="speed-val">
              {speed < 300 ? '🚀 Fast' : speed < 700 ? '⚡ Med' : '🐢 Slow'}
            </span>
          </div>
        </div>
      )}

      {/* ── FINAL RESULT ──────────────────────────────────── */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            className="result-card"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          >
            <div className="result-title">🎉 Longest Palindromic Substring</div>
            <div className="result-value mono">
              "{str.slice(bestStart, bestStart + bestLen)}"
            </div>
            <div className="result-meta">
              Indices [{bestStart}, {bestStart + bestLen - 1}] · Length {bestLen}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
