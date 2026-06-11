import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './DecodeWaysVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def numDecodings(self, s: str) -> int:' },
    { line: 3, text: '        if not s or s[0] == "0":' },
    { line: 4, text: '            return 0' },
    { line: 5, text: '        n = len(s)' },
    { line: 6, text: '        dp = [0] * (n + 1)' },
    { line: 7, text: '        dp[0] = 1  # empty prefix' },
    { line: 8, text: '        dp[1] = 1  # first char (non-zero)' },
    { line: 9, text: '' },
    { line: 10, text: '        for i in range(2, n + 1):' },
    { line: 11, text: '            one = int(s[i-1])' },
    { line: 12, text: '            two = int(s[i-2:i])' },
    { line: 13, text: '' },
    { line: 14, text: '            if one != 0:' },
    { line: 15, text: '                dp[i] += dp[i-1]' },
    { line: 16, text: '            if 10 <= two <= 26:' },
    { line: 17, text: '                dp[i] += dp[i-2]' },
    { line: 18, text: '' },
    { line: 19, text: '        return dp[n]' },
]

function generateSteps(s) {
    const steps = []

    steps.push({
        phase: 'check', activeLine: 3,
        s, dp: [], i: -1, one: null, two: null, result: null,
        message: `Check: s="${s}", s[0]="${s[0]}". ${!s || s[0] === '0' ? 'Starts with 0 → return 0.' : 'Valid start.'}`,
    })

    if (!s || s[0] === '0') {
        steps.push({ phase: 'done', activeLine: 4, s, dp: [], i: -1, one: null, two: null, result: 0, message: 'Return 0.' })
        return steps
    }

    const n = s.length
    const dp = Array(n + 1).fill(0)
    dp[0] = 1
    dp[1] = 1

    steps.push({
        phase: 'init', activeLine: 7,
        s, dp: [...dp], i: -1, one: null, two: null, result: null,
        message: `dp[0]=1 (empty prefix has 1 way). dp[1]=1 (first char '${s[0]}' ≠ 0).`,
    })

    for (let i = 2; i <= n; i++) {
        const one = parseInt(s[i - 1], 10)
        const two = parseInt(s.slice(i - 2, i), 10)

        steps.push({
            phase: 'read', activeLine: 11,
            s, dp: [...dp], i, one, two, result: null,
            message: `i=${i}: one-digit="${s[i - 1]}"=${one}, two-digit="${s.slice(i - 2, i)}"=${two}.`,
        })

        if (one !== 0) {
            dp[i] += dp[i - 1]
            steps.push({
                phase: 'add_one', activeLine: 15,
                s, dp: [...dp], i, one, two, result: null,
                message: `one=${one} ≠ 0 → dp[${i}] += dp[${i - 1}] (${dp[i - 1]}). dp[${i}] = ${dp[i]}.`,
            })
        }

        if (two >= 10 && two <= 26) {
            dp[i] += dp[i - 2]
            steps.push({
                phase: 'add_two', activeLine: 17,
                s, dp: [...dp], i, one, two, result: null,
                message: `two=${two} in [10,26] → dp[${i}] += dp[${i - 2}] (${dp[i - 2]}). dp[${i}] = ${dp[i]}.`,
            })
        }

        if (one === 0 && !(two >= 10 && two <= 26)) {
            steps.push({
                phase: 'zero', activeLine: 14,
                s, dp: [...dp], i, one, two, result: null,
                message: `one=0 and two=${two} not in [10,26]. dp[${i}] = 0. Invalid encoding.`,
            })
        }
    }

    steps.push({
        phase: 'done', activeLine: 19,
        s, dp: [...dp], i: n, one: null, two: null, result: dp[n],
        message: `dp[${n}] = ${dp[n]}. Total ways to decode "${s}" = ${dp[n]}.`,
    })

    return steps
}

const EXAMPLES = [
    { label: '"12"', s: '12' },
    { label: '"226"', s: '226' },
    { label: '"06"', s: '06' },
    { label: '"11106"', s: '11106' },
    { label: '"1234"', s: '1234' },
]

export default function DecodeWaysVisualizer() {
    const [sInput, setSInput] = useState('226')

    const { s, inputError } = useMemo(() => {
        const v = sInput.trim()
        if (!v) return { s: '226', inputError: 'Input required' }
        if (!/^\d+$/.test(v)) return { s: '226', inputError: 'Digits only' }
        if (v.length > 12) return { s: v.slice(0, 12), inputError: 'Max 12 chars for clarity' }
        return { s: v, inputError: '' }
    }, [sInput])

    const steps = useMemo(() => generateSteps(s), [s])

    const {
        stepIndex, stepForward, stepBack, togglePlay,
        handleReset, isPlaying, speed, setSpeed, isDone,
    } = usePlaybackState(steps.length)

    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const step = stepIndex >= 0 ? steps[stepIndex] : null
    const applyExample = useCallback((ex) => {
        setSInput(ex.s)
        handleReset()
    }, [handleReset])

    const dp = step?.dp ?? []
    const currI = step?.i ?? -1
    const maxDp = dp.length ? Math.max(...dp, 1) : 1

    return (
        <div className="dw-shell">
            <section className="dw-panel">
                <header className="dw-head"><span>Decode Ways · 1D DP</span></header>
                <div className="dw-body">
                    <div className="dw-top-row">
                        <div className="dw-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="dw-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <div className="dw-input-group">
                            {inputError && <span className="dw-error">{inputError}</span>}
                            <input
                                className="dw-input"
                                value={sInput}
                                onChange={(e) => { setSInput(e.target.value); handleReset() }}
                                placeholder="226"
                            />
                        </div>
                    </div>

                    {/* String display */}
                    <div className="dw-str-section">
                        <div className="dw-row-label">s</div>
                        <div className="dw-str-row">
                            {s.split('').map((ch, idx) => {
                                const charIdx = currI - 1  // s[i-1] for current i
                                const twoStart = currI - 2 // s[i-2] for two-digit
                                const isOne = idx === charIdx
                                const isTwo = idx === twoStart || idx === charIdx
                                const isActive = isOne || (step?.phase === 'add_two' && isTwo)
                                return (
                                    <div key={idx} className={`dw-char${isOne && step?.phase !== 'zero' ? ' one' : ''}${step?.phase === 'add_two' && isTwo ? ' two' : ''}${step?.phase === 'zero' && (idx === charIdx || idx === twoStart) ? ' zero-char' : ''}`}>
                                        {ch}
                                        <span className="dw-char-idx">{idx}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* DP table */}
                    <div className="dw-dp-section">
                        <div className="dw-row-label">dp</div>
                        <div className="dw-dp-row">
                            {dp.map((val, idx) => {
                                const isCurr = idx === currI
                                const isDone = step?.phase === 'done'
                                const isResult = isDone && idx === s.length
                                const isSrc = isCurr ? false : (idx === currI - 1 && step?.phase === 'add_one') || (idx === currI - 2 && step?.phase === 'add_two')
                                return (
                                    <div key={idx} className="dw-dp-col">
                                        <motion.div
                                            className={`dw-dp-cell${isCurr ? ' curr' : ''}${isResult ? ' result' : ''}${isSrc ? ' src' : ''}`}
                                            animate={{ y: isCurr ? -8 : 0, scale: isCurr || isResult ? 1.1 : 1 }}
                                            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                                        >
                                            {val}
                                        </motion.div>
                                        <span className="dw-dp-idx">[{idx}]</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Decode info box */}
                    {currI >= 2 && step?.one !== null && (
                        <div className="dw-info-box">
                            <span className="dw-info-item">
                                one-digit: <strong>"{s[currI - 1]}"</strong> = {step.one}
                                {step.one !== 0 ? <span className="ok-badge"> ✓ adds dp[{currI - 1}]</span> : <span className="fail-badge"> ✗ invalid alone</span>}
                            </span>
                            <span className="dw-info-item">
                                two-digit: <strong>"{s.slice(currI - 2, currI)}"</strong> = {step.two}
                                {step.two >= 10 && step.two <= 26 ? <span className="ok-badge"> ✓ adds dp[{currI - 2}]</span> : <span className="fail-badge"> ✗ out of range</span>}
                            </span>
                        </div>
                    )}

                    <AnimatePresence>
                        {step?.phase === 'done' && (
                            <motion.div
                                className="dw-result"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                {step.result} way{step.result !== 1 ? 's' : ''} to decode "{s}"
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />

            <div className={`dw-status${step?.phase === 'done' ? ' done' : ''}`}>
                {step?.message ?? 'Press Play or Step to begin.'}
            </div>

            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward}
                onReset={handleReset} prevDisabled={stepIndex < 0}
                nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
                showPatternOverlay={showPatternOverlay}
                onShowPatternOverlayChange={setShowPatternOverlay}
                patternOverlayLabel="Show pattern overlay"
                showPatternOverlayToggle
            />

            {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
        </div>
    )
}
