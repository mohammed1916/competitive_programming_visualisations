import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './StringToIntegerAtoiVisualizer.css'

const SOLUTION_CODE = [
  { line: 1,  text: 'class Solution:' },
  { line: 2,  text: '    def myAtoi(self, s: str) -> int:' },
  { line: 3,  text: '        s = s.lstrip()' },
  { line: 4,  text: '        if not s: return 0' },
  { line: 5,  text: '        ' },
  { line: 6,  text: '        sign = 1' },
  { line: 7,  text: '        i = 0' },
  { line: 8,  text: '        if s[0] == "-":' },
  { line: 9,  text: '            sign = -1' },
  { line: 10, text: '            i += 1' },
  { line: 11, text: '        elif s[0] == "+":' },
  { line: 12, text: '            i += 1' },
  { line: 13, text: '            ' },
  { line: 14, text: '        res = 0' },
  { line: 15, text: '        while i < len(s) and s[i].isdigit():' },
  { line: 16, text: '            res = res * 10 + int(s[i])' },
  { line: 17, text: '            i += 1' },
  { line: 18, text: '            ' },
  { line: 19, text: '        res = res * sign' },
  { line: 20, text: '        MIN, MAX = -2**31, 2**31 - 1' },
  { line: 21, text: '        if res < MIN: return MIN' },
  { line: 22, text: '        if res > MAX: return MAX' },
  { line: 23, text: '        return res' },
]

function generateSteps(originalStr) {
  const steps = []

  let s = originalStr
  steps.push({
    phase: 'init', s: originalStr, origS: originalStr, i: null, sign: 1, res: 0,
    activeLine: 3, message: 'Start algorithm.'
  })

  s = s.trimStart() // lstrip in JS
  steps.push({
    phase: 'lstrip', s, origS: originalStr, i: null, sign: 1, res: 0,
    activeLine: 3, message: \`Strip leading whitespace. s becomes "\${s}".\`
  })

  steps.push({
    phase: 'check_empty', s, origS: originalStr, i: null, sign: 1, res: 0,
    activeLine: 4, message: \`Check if s is empty.\`
  })

  if (!s) {
    steps.push({
      phase: 'done', s, origS: originalStr, i: null, sign: 1, res: 0, clamped: false,
      activeLine: 4, message: \`s is empty. Return 0.\`
    })
    return steps
  }

  let sign = 1
  let i = 0

  steps.push({
    phase: 'init_vars', s, origS: originalStr, i, sign, res: 0,
    activeLine: 7, message: \`Initialize sign = 1, i = 0.\`
  })

  steps.push({
    phase: 'check_sign_neg', s, origS: originalStr, i, sign, res: 0,
    activeLine: 8, message: \`Check if s[0] ('\${s[0]}') == "-".\`
  })

  if (s[0] === '-') {
    sign = -1
    i += 1
    steps.push({
      phase: 'set_sign_neg', s, origS: originalStr, i, sign, res: 0,
      activeLine: 10, message: \`Yes. Set sign = -1, increment i to 1.\`
    })
  } else {
    steps.push({
      phase: 'check_sign_pos', s, origS: originalStr, i, sign, res: 0,
      activeLine: 11, message: \`No. Check if s[0] ('\${s[0]}') == "+".\`
    })

    if (s[0] === '+') {
      i += 1
      steps.push({
        phase: 'set_sign_pos', s, origS: originalStr, i, sign, res: 0,
        activeLine: 12, message: \`Yes. Increment i to 1.\`
      })
    }
  }

  let res = 0
  steps.push({
    phase: 'init_res', s, origS: originalStr, i, sign, res,
    activeLine: 14, message: \`Initialize res = 0.\`
  })

  while (i < s.length) {
    const char = s[i]
    const isDigit = char >= '0' && char <= '9'

    steps.push({
      phase: 'while_check', s, origS: originalStr, i, sign, res,
      activeLine: 15, message: \`Check if i < len(s) and s[i] ('\${char}') is a digit.\`
    })

    if (!isDigit) {
      steps.push({
        phase: 'while_break', s, origS: originalStr, i, sign, res,
        activeLine: 15, message: \`'\${char}' is not a digit. Break loop.\`
      })
      break
    }

    const digit = parseInt(char, 10)
    steps.push({
      phase: 'calc_res', s, origS: originalStr, i, sign, res, digit,
      activeLine: 16, message: \`res = res * 10 + \${digit}\`
    })

    res = res * 10 + digit
    
    steps.push({
      phase: 'update_res', s, origS: originalStr, i, sign, res, digit,
      activeLine: 16, message: \`res is now \${res}.\`
    })

    i += 1
    steps.push({
      phase: 'inc_i', s, origS: originalStr, i, sign, res,
      activeLine: 17, message: \`Increment i to \${i}.\`
    })
  }

  steps.push({
    phase: 'apply_sign', s, origS: originalStr, i, sign, res,
    activeLine: 19, message: \`Apply sign: res = \${res} * \${sign}.\`
  })

  res = res * sign

  steps.push({
    phase: 'check_bounds', s, origS: originalStr, i, sign, res,
    activeLine: 20, message: \`Check bounds: res (\${res}) vs MIN (-2^31) and MAX (2^31 - 1).\`
  })

  const MIN = -Math.pow(2, 31)
  const MAX = Math.pow(2, 31) - 1
  let clamped = false

  if (res < MIN) {
    res = MIN
    clamped = true
    steps.push({
      phase: 'clamp_min', s, origS: originalStr, i, sign, res, clamped,
      activeLine: 21, message: \`res < MIN. Clamp to \${MIN}.\`
    })
  } else if (res > MAX) {
    res = MAX
    clamped = true
    steps.push({
      phase: 'clamp_max', s, origS: originalStr, i, sign, res, clamped,
      activeLine: 22, message: \`res > MAX. Clamp to \${MAX}.\`
    })
  }

  steps.push({
    phase: 'done', s, origS: originalStr, i, sign, res, clamped,
    activeLine: 23, message: \`Return res = \${res}.\`
  })

  return steps
}

const EXAMPLES = [
  { label: 'Standard', s: '42' },
  { label: 'Spaces & Sign', s: '   -42' },
  { label: 'With Words', s: '4193 with words' },
  { label: 'Out of Bounds', s: '-91283472332' },
]

export default function StringToIntegerAtoiVisualizer() {
  const [sInput, setSInput] = useState('   -42')

  const { originalStr, inputError } = useMemo(() => {
    return { originalStr: sInput, inputError: '' }
  }, [sInput])

  const steps = useMemo(() => generateSteps(originalStr), [originalStr])

  const {
    stepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length)

  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setSInput(ex.s)
    handleReset()
  }, [handleReset])

  const displayStr = step?.s !== undefined ? step.s : originalStr

  return (
    <div className="atoi-shell">
      <div className="atoi-top">
        <div className="atoi-panel" style={{ flex: 1.5 }}>
          <div className="atoi-panel-head">
            String Parsing
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
          </div>
          <div className="atoi-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => applyExample(ex)}
                  className="atoi-example-btn"
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
                placeholder="   -42"
                className="atoi-input"
                style={{ flex: 1, margin: 0, fontFamily: 'monospace' }}
              />
            </div>

            {step?.phase === 'init' && (
                <div className="atoi-lstrip-alert">
                    "lstrip()" will remove leading spaces.
                </div>
            )}

            <div className="atoi-string-container">
                {displayStr.split('').map((char, idx) => {
                    const isI = step?.i === idx
                    const isProcessed = step?.i > idx
                    const isSpace = char === ' '
                    const isSign = char === '-' || char === '+'
                    const isDigit = char >= '0' && char <= '9'

                    let cellClass = "atoi-char "
                    if (isI) cellClass += "active "
                    if (isProcessed) cellClass += "processed "
                    if (isSpace) cellClass += "space "

                    return (
                        <div key={idx} className="atoi-char-wrapper">
                            <span className="atoi-index">{idx}</span>
                            <div className={cellClass}>
                                {char === ' ' ? '␣' : char}
                            </div>
                            <div className="atoi-ptr-container">
                                {isI && <div className="atoi-ptr">i</div>}
                            </div>
                            <div className="atoi-type-label">
                                {isSpace && <span style={{color: '#64748b'}}>space</span>}
                                {isSign && <span style={{color: '#a855f7'}}>sign</span>}
                                {isDigit && <span style={{color: '#22c55e'}}>digit</span>}
                                {!isSpace && !isSign && !isDigit && <span style={{color: '#ef4444'}}>other</span>}
                            </div>
                        </div>
                    )
                })}
                {displayStr === '' && <span style={{ color: '#64748b', fontStyle: 'italic' }}>Empty string</span>}
            </div>

            {step?.phase === 'calc_res' && (
                <div className="atoi-math-box">
                    <span style={{color: '#94a3b8', fontSize: 12, textTransform: 'uppercase'}}>Accumulate:</span>
                    <div className="atoi-math-formula">
                        <span className="var">res</span>
                        <span className="op">*</span>
                        <span className="val">10</span>
                        <span className="op">+</span>
                        <span className="var">digit</span>
                        <span className="op">=</span>
                        <span className="var">new res</span>
                    </div>
                    <div className="atoi-math-formula vals">
                        <span className="val">{step.res}</span>
                        <span className="op">*</span>
                        <span className="val">10</span>
                        <span className="op">+</span>
                        <span className="val highlight">{step.digit}</span>
                        <span className="op">=</span>
                        <span className="val new">{step.res * 10 + step.digit}</span>
                    </div>
                </div>
            )}

          </div>
        </div>

        <div className="atoi-panel" style={{ flex: 1 }}>
          <div className="atoi-panel-head">State & Result</div>
          <div className="atoi-panel-body" style={{ gap: 16 }}>
            
            <div className="atoi-var-row">
                <div className="atoi-var-card half">
                    <span className="atoi-var-title">sign</span>
                    <div className={\`atoi-var-val \${step?.sign === -1 ? 'neg' : 'pos'}\`}>
                        {step?.sign === -1 ? '-1' : '+1'}
                    </div>
                </div>

                <div className="atoi-var-card half">
                    <span className="atoi-var-title">i</span>
                    <div className="atoi-var-val">
                        {step?.i ?? 'null'}
                    </div>
                </div>
            </div>

            <div className="atoi-var-card res">
                <span className="atoi-var-title">res (Accumulator)</span>
                <div className="atoi-var-val large">
                    {step?.res ?? 0}
                </div>
            </div>

            <div className="atoi-bounds-box">
                <div className="atoi-bound">
                    <span className="label">MIN (-2³¹)</span>
                    <span className="val">-2147483648</span>
                </div>
                <div className="atoi-bound">
                    <span className="label">MAX (2³¹ - 1)</span>
                    <span className="val">2147483647</span>
                </div>
            </div>

            {(step?.phase === 'clamp_min' || step?.phase === 'clamp_max') && (
                <div className="atoi-clamp-alert">
                    ⚠️ Out of bounds! Clamping to {step.phase === 'clamp_min' ? 'MIN' : 'MAX'}
                </div>
            )}

            {step?.phase === 'done' && (
                <div className="atoi-final-result">
                    <span className="label">Final Returned Integer:</span>
                    <span className={\`val \${step.clamped ? 'clamped' : ''}\`}>{step.res}</span>
                </div>
            )}

          </div>
        </div>
      </div>

      <div className="atoi-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      </div>

      <div className={\`atoi-status \${step?.phase === 'done' ? 'success' : step?.clamped ? 'clamp' : ''}\`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      <div className="atoi-dock">
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
