import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './MinimumWindowSubstringVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution:' },
  { line: 2, text: '    def minWindow(self, s: str, t: str) -> str:' },
  { line: 3, text: '        if not t or not s: return ""' },
  { line: 4, text: '        need = Counter(t)' },
  { line: 5, text: '        have = defaultdict(int)' },
  { line: 6, text: '        required = len(need)' },
  { line: 7, text: '        formed = 0' },
  { line: 8, text: '        left = 0' },
  { line: 9, text: '        best = (inf, 0, 0)' },
  { line: 10, text: '        for right, ch in enumerate(s):' },
  { line: 11, text: '            have[ch] += 1' },
  { line: 12, text: '            if ch in need and have[ch] == need[ch]:' },
  { line: 13, text: '                formed += 1' },
  { line: 14, text: '            while left <= right and formed == required:' },
  { line: 15, text: '                if right-left+1 < best[0]: best = (...)' },
  { line: 16, text: '                drop = s[left]' },
  { line: 17, text: '                have[drop] -= 1' },
  { line: 18, text: '                if drop in need and have[drop] < need[drop]: formed -= 1' },
  { line: 19, text: '                left += 1' },
  { line: 20, text: '        return s[l:r+1] if best found else ""' },
]

function buildNeed(t) {
  const out = {}
  for (const ch of t) out[ch] = (out[ch] || 0) + 1
  return out
}

function generateSteps(s, t) {
  const steps = []
  if (!s || !t) {
    return [{ phase: 'done', activeLine: 3, s, t, left: 0, right: -1, need: buildNeed(t), have: {}, formed: 0, required: Object.keys(buildNeed(t)).length, best: null, message: 'Empty input. Return "".' }]
  }

  const need = buildNeed(t)
  const have = {}
  const required = Object.keys(need).length
  let formed = 0
  let left = 0
  let best = null
  steps.push({ phase: 'init', activeLine: 7, s, t, left, right: -1, need: { ...need }, have: { ...have }, formed, required, best, message: `Need ${required} unique chars from t.` })

  for (let right = 0; right < s.length; right++) {
    const ch = s[right]
    have[ch] = (have[ch] || 0) + 1
    if (need[ch] && have[ch] === need[ch]) formed++
    steps.push({ phase: 'expand', activeLine: 13, s, t, left, right, need: { ...need }, have: { ...have }, formed, required, best, message: `Expand right to ${right} ('${ch}'). formed=${formed}/${required}.` })

    while (left <= right && formed === required) {
      const len = right - left + 1
      if (!best || len < best.len) {
        best = { len, l: left, r: right, value: s.slice(left, right + 1) }
        steps.push({ phase: 'best', activeLine: 15, s, t, left, right, need: { ...need }, have: { ...have }, formed, required, best: { ...best }, message: `New best window "${best.value}" [${best.l}, ${best.r}].` })
      }
      const drop = s[left]
      have[drop] -= 1
      if (need[drop] && have[drop] < need[drop]) formed--
      left++
      steps.push({ phase: 'shrink', activeLine: 19, s, t, left, right, need: { ...need }, have: { ...have }, formed, required, best: best ? { ...best } : null, message: `Shrink left, removed '${drop}', formed=${formed}/${required}.` })
    }
  }

  steps.push({ phase: 'done', activeLine: 20, s, t, left, right: s.length - 1, need: { ...need }, have: { ...have }, formed, required, best, message: best ? `Return "${best.value}".` : 'No valid window found. Return "".' })
  return steps
}

const EXAMPLES = [
  { label: 'Classic', s: 'ADOBECODEBANC', t: 'ABC' },
  { label: 'Tiny', s: 'a', t: 'a' },
  { label: 'No Answer', s: 'a', t: 'aa' },
  { label: 'Repeats', s: 'AAABBC', t: 'ABC' },
]

export default function MinimumWindowSubstringVisualizer() {
  const [sInput, setSInput] = useState('ADOBECODEBANC')
  const [tInput, setTInput] = useState('ABC')
  const s = sInput ?? ''
  const t = tInput ?? ''

  const steps = useMemo(() => generateSteps(s, t), [s, t])
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setSInput(ex.s)
    setTInput(ex.t)
    handleReset()
  }, [handleReset])

  return (
    <div className="mws-shell">
      <div className="mws-top">
        <section className="mws-panel">
          <header className="mws-head"><span>Sliding Window</span></header>
          <div className="mws-body">
            <div className="mws-examples">
              {EXAMPLES.map((ex) => <button key={ex.label} className="mws-chip" onClick={() => applyExample(ex)}>{ex.label}</button>)}
            </div>
            <div className="mws-inputs">
              <input className="mws-input" value={sInput} onChange={(e) => { setSInput(e.target.value); handleReset() }} placeholder="s" />
              <input className="mws-input small" value={tInput} onChange={(e) => { setTInput(e.target.value); handleReset() }} placeholder="t" />
            </div>
            <div className="mws-string">
              {s.split('').map((ch, i) => {
                const inWindow = i >= (step?.left ?? 0) && i <= (step?.right ?? -1)
                const left = i === step?.left
                const right = i === step?.right
                const inBest = step?.best && i >= step.best.l && i <= step.best.r
                return (
                  <motion.div key={`${ch}-${i}`} className={`mws-char ${inWindow ? 'window' : ''} ${left ? 'left' : ''} ${right ? 'right' : ''} ${inBest ? 'best' : ''}`}>
                    <span>{ch}</span>
                    <small>{i}</small>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mws-panel side">
          <header className="mws-head"><span>Frequency State</span></header>
          <div className="mws-body">
            <div className="mws-metrics">
              <div><span>formed</span><strong>{step?.formed ?? 0}</strong></div>
              <div><span>required</span><strong>{step?.required ?? 0}</strong></div>
              <div><span>best</span><strong>{step?.best?.value ?? '—'}</strong></div>
            </div>
            <div className="mws-freq-grid">
              {Object.entries(step?.need || {}).map(([ch, req]) => {
                const hv = step?.have?.[ch] || 0
                return (
                  <div key={ch} className={`mws-freq ${hv >= req ? 'ok' : ''}`}>
                    <span>{ch}</span>
                    <strong>{hv}/{req}</strong>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      <div className={`mws-status ${step?.phase === 'done' ? 'ok' : ''}`}>{step?.message || 'Press Play to begin.'}</div>
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
