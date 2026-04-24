import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './PalindromeVisualizer.css'

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
    })
  }

  /* ── Phase 2: Length 2 → n ───────────────────────────────── */
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i <= n - len; i++) {
      const j = i + len - 1
      const charsMatch = s[i] === s[j]
      const innerOk = len === 2 ? true : (dp[i + 1][j - 1] === true)
      const isPalin = charsMatch && innerOk

      dp[i][j] = isPalin

      if (isPalin && len > bestLen) {
        bestStart = i
        bestLen = len
      }

      steps.push({
        phase: 'check',
        i, j, len,
        isPalin, charsMatch, innerOk,
        outerLeft: i, outerRight: j,
        inner: len > 2 ? { l: i + 1, r: j - 1 } : null,
        description: buildDesc(s, i, j, charsMatch, innerOk, isPalin, len),
        dp: dp.map(r => [...r]),
        bestStart, bestLen,
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
function DpCell({ i, j, dp, step, n }) {
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
      {val === true  && !isActive && '✓'}
      {val === false && !isActive && '✗'}
      {isActive && '?'}
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
  const intervalRef = useRef(null)

  const n = str.length
  const currentStep = stepIdx >= 0 ? steps[stepIdx] : null
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
                <>
                  <div
                    key={`rh-${i}`}
                    className={`dp-header row-header ${currentStep && currentStep.i === i ? 'hdr-active' : ''}`}
                  >
                    <span>{i}</span>
                    <span className="mono" style={{ color: 'var(--text-muted)' }}>'{str[i]}'</span>
                  </div>
                  {Array.from({ length: n }, (_, j) => (
                    <DpCell key={`c-${i}-${j}`} i={i} j={j} dp={dpTable} step={currentStep} n={n} />
                  ))}
                </>
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
