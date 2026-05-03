import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './LongestSubstringWithoutRepeatingVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution:' },
  { line: 2, text: '    def lengthOfLongestSubstring(self, s: str) -> int:' },
  { line: 3, text: '        char_map = {}' },
  { line: 4, text: '        left = 0' },
  { line: 5, text: '        max_len = 0' },
  { line: 6, text: '        for right in range(len(s)):' },
  { line: 7, text: '            if s[right] in char_map and char_map[s[right]] >= left:' },
  { line: 8, text: '                left = char_map[s[right]] + 1' },
  { line: 9, text: '            char_map[s[right]] = right' },
  { line: 10, text: '            max_len = max(max_len, right - left + 1)' },
  { line: 11, text: '        return max_len' },
]

function generateSteps(s) {
  const steps = []

  if (!s || s.length === 0) {
    steps.push({
      phase: 'done', left: 0, right: null, maxLen: 0, charMap: {},
      activeLine: 11, message: 'Empty string. Return 0.'
    })
    return steps
  }

  let left = 0
  let maxLen = 0
  const charMap = {}

  steps.push({
    phase: 'init', left, right: null, maxLen, charMap: { ...charMap },
    activeLine: 5, message: 'Initialize char_map, left pointer, and max_len.'
  })

  for (let right = 0; right < s.length; right++) {
    const char = s[right]

    steps.push({
      phase: 'check_right', left, right, maxLen, charMap: { ...charMap }, currChar: char,
      activeLine: 6, message: `right=${right}, character is '${char}'.`
    })

    const hasCollision = (char in charMap) && (charMap[char] >= left)

    steps.push({
      phase: 'check_collision', left, right, maxLen, charMap: { ...charMap }, currChar: char, collision: hasCollision,
      activeLine: 7, message: hasCollision
        ? `Collision! '${char}' was last seen at index ${charMap[char]}, which is >= left (${left}).`
        : `No collision for '${char}' within the current window (left=${left}).`
    })

    if (hasCollision) {
      left = charMap[char] + 1
      steps.push({
        phase: 'move_left', left, right, maxLen, charMap: { ...charMap }, currChar: char,
        activeLine: 8, message: `Move left pointer to index ${left} to exclude the previous '${char}'.`
      })
    }

    charMap[char] = right
    steps.push({
      phase: 'update_map', left, right, maxLen, charMap: { ...charMap }, currChar: char,
      activeLine: 9, message: `Update char_map['${char}'] = ${right}.`
    })

    const currentWindowLen = right - left + 1
    if (currentWindowLen > maxLen) {
      maxLen = currentWindowLen
      steps.push({
        phase: 'update_max', left, right, maxLen, charMap: { ...charMap }, currChar: char, currentWindowLen,
        activeLine: 10, message: `New max_len found! ${right} - ${left} + 1 = ${currentWindowLen}.`
      })
    } else {
      steps.push({
        phase: 'skip_max', left, right, maxLen, charMap: { ...charMap }, currChar: char, currentWindowLen,
        activeLine: 10, message: `Current window length ${currentWindowLen} <= max_len (${maxLen}).`
      })
    }
  }

  steps.push({
    phase: 'done', left, right: null, maxLen, charMap: { ...charMap },
    activeLine: 11, message: `End of string reached. Longest substring length is ${maxLen}.`
  })

  return steps
}

const EXAMPLES = [
  { label: 'Classic', s: 'abcabcbb' },
  { label: 'All Same', s: 'bbbbb' },
  { label: 'Pwwkew', s: 'pwwkew' },
  { label: 'No Repeats', s: 'abcdef' },
  { label: 'Empty', s: '' },
]

export default function LongestSubstringWithoutRepeatingVisualizer() {
  const [strInput, setStrInput] = useState('abcabcbb')

  const { s, inputError } = useMemo(() => {
    return { s: strInput, inputError: '' } // Any string is valid
  }, [strInput])

  const steps = useMemo(() => generateSteps(s), [s])

  const {
    stepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length)

  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => {
    setStrInput(ex.s)
    handleReset()
  }, [handleReset])

  return (
    <div className="lswrc-shell">
      <div className="lswrc-top">
        <div className="lswrc-panel" style={{ flex: 2 }}>
          <div className="lswrc-panel-head">
            String View
            {inputError && <span style={{ color: '#f87171', marginLeft: 8 }}>{inputError}</span>}
          </div>
          <div className="lswrc-panel-body">
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => applyExample(ex)}
                  className="lswrc-example-btn"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <input
              value={strInput}
              onChange={(e) => { setStrInput(e.target.value); handleReset() }}
              placeholder="abcabcbb"
              className="lswrc-input"
              maxLength={24}
            />

            <div className="lswrc-string-container">
              {s.split('').map((char, i) => {
                const isLeft = step?.left === i
                const isRight = step?.right === i
                const isInWindow = step?.left !== null && step?.right !== null && i >= step.left && i <= step.right
                const isCollision = isRight && step?.collision && step?.phase === 'check_collision'

                return (
                  <div key={i} className="lswrc-char-wrapper">
                    <div className="lswrc-index-label">{i}</div>
                    <motion.div
                      className={`lswrc-char-box ${isInWindow ? 'in-window' : ''} ${isCollision ? 'collision' : ''} ${isLeft ? 'is-left' : ''} ${isRight ? 'is-right' : ''}`}
                      layout
                    >
                      {char}
                    </motion.div>
                    <div className="lswrc-pointers">
                      {isLeft && <div className="lswrc-pointer left-pointer">L</div>}
                      {isRight && <div className="lswrc-pointer right-pointer">R</div>}
                    </div>
                  </div>
                )
              })}
              {s.length === 0 && <div style={{ color: '#64748b', fontStyle: 'italic' }}>Empty String</div>}
            </div>

            <div className="lswrc-window-indicator">
              {step && step.left !== null && step.right !== null && step.left <= step.right && step.phase !== 'done' && (
                <div className="lswrc-window-highlight">
                  Current Window Length: <span className="highlight-text">{step.right - step.left + 1}</span>
                  <span className="window-str">("{s.substring(step.left, step.right + 1)}")</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lswrc-panel" style={{ flex: 1 }}>
          <div className="lswrc-panel-head">
            Hash Map <code>char_map = {'{}'}</code>
          </div>
          <div className="lswrc-panel-body">
            <AnimatePresence mode="sync">
              {(!step || Object.keys(step.charMap ?? {}).length === 0) ? (
                <p style={{ color: '#475569', fontSize: 12, fontStyle: 'italic' }}>
                  Map is empty.
                </p>
              ) : (
                <table className="lswrc-map-table">
                  <thead>
                    <tr>
                      <th>Character</th>
                      <th>Index</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(step.charMap).map(([char, idx]) => {
                      const isHighlighted = step?.currChar === char && (step?.phase === 'check_collision' || step?.phase === 'update_map' || step?.phase === 'move_left')
                      return (
                        <motion.tr
                          key={char}
                          className={`lswrc-map-row ${isHighlighted ? 'highlight' : ''}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <td>'{char}'</td>
                          <td>{idx}</td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="lswrc-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />

        <div className="lswrc-panel">
          <div className="lswrc-panel-head">Variables</div>
          <div className="lswrc-panel-body">
            <div className="lswrc-vars">
              <div className="lswrc-var-row">
                <span className="lswrc-var-name">left</span>
                <span className="lswrc-var-val">{step?.left ?? '–'}</span>
              </div>
              <div className="lswrc-var-row">
                <span className="lswrc-var-name">right</span>
                <span className="lswrc-var-val">{step?.right ?? '–'}</span>
              </div>
              <div className="lswrc-var-row">
                <span className="lswrc-var-name">s[right]</span>
                <span className="lswrc-var-val">{step?.currChar ? `'${step.currChar}'` : '–'}</span>
              </div>
              <div className="lswrc-var-row" style={{ borderColor: '#8b5cf6' }}>
                <span className="lswrc-var-name">max_len</span>
                <span className="lswrc-var-val highlight" style={{ color: '#a78bfa' }}>{step?.maxLen ?? '–'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`lswrc-status ${step?.phase === 'update_max' ? 'found' : step?.phase === 'check_collision' && step?.collision ? 'collision' : ''}`}>
        {step?.message ?? 'Press Play or Step to begin.'}
      </div>

      <div className="lswrc-dock">
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
