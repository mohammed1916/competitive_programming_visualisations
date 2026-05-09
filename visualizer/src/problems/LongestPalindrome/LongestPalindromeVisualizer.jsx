import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './LongestPalindromeVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution:' },
  { line: 2, text: '    def longestPalindrome(self, s: str) -> str:' },
  { line: 3, text: '        res = ""' },
  { line: 4, text: '        resLen = 0' },
  { line: 5, text: '        ' },
  { line: 6, text: '        for i in range(len(s)):' },
  { line: 7, text: '            # odd length' },
  { line: 8, text: '            l, r = i, i' },
  { line: 9, text: '            while l >= 0 and r < len(s) and s[l] == s[r]:' },
  { line: 10, text: '                if (r - l + 1) > resLen:' },
  { line: 11, text: '                    res = s[l:r+1]' },
  { line: 12, text: '                    resLen = r - l + 1' },
  { line: 13, text: '                l -= 1' },
  { line: 14, text: '                r += 1' },
  { line: 15, text: '                ' },
  { line: 16, text: '            # even length' },
  { line: 17, text: '            l, r = i, i + 1' },
  { line: 18, text: '            while l >= 0 and r < len(s) and s[l] == s[r]:' },
  { line: 19, text: '                if (r - l + 1) > resLen:' },
  { line: 20, text: '                    res = s[l:r+1]' },
  { line: 21, text: '                    resLen = r - l + 1' },
  { line: 22, text: '                l -= 1' },
  { line: 23, text: '                r += 1' },
  { line: 24, text: '                ' },
  { line: 25, text: '        return res' },
]

function generateSteps(s) {
  const steps = []

  if (!s) {
    steps.push({
      phase: 'done', i: null, l: null, r: null, res: "", resLen: 0,
      activeLine: 25, message: 'Empty string. Return empty result.'
    })
    return steps
  }

  let res = ""
  let resLen = 0

  steps.push({
    phase: 'init', i: null, l: null, r: null, res, resLen, mode: null,
    activeLine: 4, message: 'Initialize res = "" and resLen = 0.'
  })

  for (let i = 0; i < s.length; i++) {
    steps.push({
      phase: 'loop', i, l: null, r: null, res, resLen, mode: null,
      activeLine: 6, message: `Check center at index i = \${i} ('\${s[i]}').`
    })

    // Odd length
    let l = i
    let r = i
    steps.push({
      phase: 'odd_init', i, l, r, res, resLen, mode: 'odd',
      activeLine: 8, message: `[Odd Length] Initialize pointers l = \${l}, r = \${r}.`
    })

    while (true) {
      steps.push({
        phase: 'odd_check', i, l, r, res, resLen, mode: 'odd',
        activeLine: 9, message: `Check bounds and if s[l] == s[r] ('\${s[l]}' == '\${s[r]}').`
      })

      if (l >= 0 && r < s.length && s[l] === s[r]) {
        steps.push({
          phase: 'odd_match', i, l, r, res, resLen, mode: 'odd',
          activeLine: 10, message: `Match found! Is current length (\${r - l + 1}) > resLen (\${resLen})?`
        })

        if ((r - l + 1) > resLen) {
          res = s.substring(l, r + 1)
          resLen = r - l + 1
          steps.push({
            phase: 'odd_update', i, l, r, res, resLen, mode: 'odd',
            activeLine: 12, message: `Yes! Update res = "\${res}", resLen = \${resLen}.`
          })
        }

        l -= 1
        r += 1
        steps.push({
          phase: 'odd_expand', i, l, r, res, resLen, mode: 'odd',
          activeLine: 14, message: `Expand pointers outward: l = \${l}, r = \${r}.`
        })
      } else {
        steps.push({
          phase: 'odd_break', i, l, r, res, resLen, mode: 'odd',
          activeLine: 9, message: l < 0 || r >= s.length ? `Out of bounds. Stop expanding.` : `Mismatch ('\${s[l]}' != '\${s[r]}'). Stop expanding.`
        })
        break
      }
    }

    // Even length
    l = i
    r = i + 1
    steps.push({
      phase: 'even_init', i, l, r, res, resLen, mode: 'even',
      activeLine: 17, message: `[Even Length] Initialize pointers l = \${l}, r = \${r}.`
    })

    while (true) {
      steps.push({
        phase: 'even_check', i, l, r, res, resLen, mode: 'even',
        activeLine: 18, message: `Check bounds and if s[l] == s[r] (\${l>=0&&r<s.length ? "'" + s[l] + "' == '" + s[r] + "'" : 'out of bounds'}).`
      })

      if (l >= 0 && r < s.length && s[l] === s[r]) {
        steps.push({
          phase: 'even_match', i, l, r, res, resLen, mode: 'even',
          activeLine: 19, message: `Match found! Is current length (\${r - l + 1}) > resLen (\${resLen})?`
        })

        if ((r - l + 1) > resLen) {
          res = s.substring(l, r + 1)
          resLen = r - l + 1
          steps.push({
            phase: 'even_update', i, l, r, res, resLen, mode: 'even',
            activeLine: 21, message: `Yes! Update res = "\${res}", resLen = \${resLen}.`
          })
        }

        l -= 1
        r += 1
        steps.push({
          phase: 'even_expand', i, l, r, res, resLen, mode: 'even',
          activeLine: 23, message: `Expand pointers outward: l = \${l}, r = \${r}.`
        })
      } else {
        steps.push({
          phase: 'even_break', i, l, r, res, resLen, mode: 'even',
          activeLine: 18, message: l < 0 || r >= s.length ? `Out of bounds. Stop expanding.` : `Mismatch ('\${s[l]}' != '\${s[r]}'). Stop expanding.`
        })
        break
      }
    }
  }

  steps.push({
    phase: 'done', i: null, l: null, r: null, res, resLen, mode: null,
    activeLine: 25, message: `Loop finished. Return res = "\${res}".`
  })

  return steps
}

const EXAMPLES = [
  { label: 'Example 1', s: 'babad' },
  { label: 'Example 2', s: 'cbbd' },
  { label: 'All Same', s: 'aaaa' },
  { label: 'Single', s: 'a' },
]

export default function LongestPalindromeVisualizer() {
  const [sInput, setSInput] = useState('babad')

  const { s, inputError } = useMemo(() => {
    return { s: sInput, inputError: '' }
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

  return (
    <div className="lpal-shell">
      <div className="lpal-top">
        <div className="lpal-panel" style={{ flex: 1.5 }}>
          <div className="lpal-panel-head">
            String Expansion
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
          </div>
          <div className="lpal-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => applyExample(ex)}
                  className="lpal-example-btn"
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
                placeholder="babad"
                className="lpal-input"
                style={{ flex: 1, margin: 0 }}
              />
            </div>

            <div className="lpal-mode-indicator">
              {step?.mode === 'odd' && <span className="lpal-badge odd">ODD LENGTH CENTER</span>}
              {step?.mode === 'even' && <span className="lpal-badge even">EVEN LENGTH CENTER</span>}
            </div>

            <div className="lpal-string-container">
              {s.split('').map((char, idx) => {
                const isI = step?.i === idx
                const isL = step?.l === idx
                const isR = step?.r === idx
                const inRange = step?.l !== null && step?.r !== null && idx >= step.l && idx <= step.r && step.phase !== 'even_check' && step.phase !== 'odd_check'

                let cellClass = "lpal-cell "
                if (isI && !inRange) cellClass += "center-i "
                if (inRange) cellClass += "in-range "
                if ((isL || isR) && (step.phase === 'odd_check' || step.phase === 'even_check')) cellClass += "checking "
                if ((isL || isR) && (step.phase === 'odd_match' || step.phase === 'even_match')) cellClass += "match "

                return (
                  <div key={idx} className="lpal-cell-wrapper">
                    <span className="lpal-index">{idx}</span>
                    <div className={cellClass}>
                      {char}
                    </div>
                    <div className="lpal-ptr-container">
                      {isL && isR && <div className="lpal-ptr both">L,R</div>}
                      {isL && !isR && <div className="lpal-ptr l">L</div>}
                      {isR && !isL && <div className="lpal-ptr r">R</div>}
                      {isI && !isL && !isR && <div className="lpal-ptr i">i</div>}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="lpal-pointers-legend">
              <div className="lpal-legend-item"><div className="lpal-ptr i">i</div> Center</div>
              <div className="lpal-legend-item"><div className="lpal-ptr l">L</div> Left</div>
              <div className="lpal-legend-item"><div className="lpal-ptr r">R</div> Right</div>
            </div>

          </div>
        </div>

        <div className="lpal-panel" style={{ flex: 1 }}>
          <div className="lpal-panel-head">Best Result Found</div>
          <div className="lpal-panel-body" style={{ gap: 16 }}>

            <div className="lpal-result-box">
              <span className="lpal-result-label">Max Palindrome String (res)</span>
              <div className={`lpal-result-val \${step?.phase === 'odd_update' || step?.phase === 'even_update' ? 'highlight' : ''}`}>
                "{step?.res || ''}"
              </div>
              {step?.res === "" && <span style={{ color: '#475569', fontSize: 13, fontStyle: 'italic', marginTop: 8 }}>Empty</span>}
            </div>

            <div className="lpal-result-box len">
              <span className="lpal-result-label">Max Length (resLen)</span>
              <div className={`lpal-result-val num \${step?.phase === 'odd_update' || step?.phase === 'even_update' ? 'highlight' : ''}`}>
                {step?.resLen ?? 0}
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="lpal-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      </div>

      <div className={`lpal-status \${step?.phase === 'done' ? 'success' : step?.phase === 'odd_update' || step?.phase === 'even_update' ? 'update' : ''}`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      <div className="lpal-dock">
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
