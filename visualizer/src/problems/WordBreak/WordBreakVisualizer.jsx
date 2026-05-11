import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './WordBreakVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def wordBreak(self, s: str, wordDict: List[str]) -> bool:' },
    { line: 3, text: '        word_set = set(wordDict)' },
    { line: 4, text: '        dp = [False] * (len(s) + 1)' },
    { line: 5, text: '        dp[0] = True  # empty prefix' },
    { line: 6, text: '' },
    { line: 7, text: '        for i in range(1, len(s) + 1):' },
    { line: 8, text: '            for j in range(i):' },
    { line: 9, text: '                if dp[j] and s[j:i] in word_set:' },
    { line: 10, text: '                    dp[i] = True' },
    { line: 11, text: '                    break' },
    { line: 12, text: '' },
    { line: 13, text: '        return dp[len(s)]' },
]

function generateSteps(s, wordDict) {
    const steps = []
    const wordSet = new Set(wordDict)
    const n = s.length
    const dp = Array(n + 1).fill(false)
    dp[0] = true

    steps.push({
        phase: 'init', activeLine: 5,
        s, dp: [...dp], i: -1, j: -1, slice: null, result: null,
        message: `dp[0] = True. Empty prefix can always be segmented.`,
    })

    for (let i = 1; i <= n; i++) {
        steps.push({
            phase: 'outer', activeLine: 7,
            s, dp: [...dp], i, j: -1, slice: null, result: null,
            message: `i=${i}: try to form s[0..${i - 1}]="${s.slice(0, i)}".`,
        })

        let found = false
        for (let j = 0; j < i; j++) {
            const slice = s.slice(j, i)
            const dpJ = dp[j]
            const inDict = wordSet.has(slice)

            steps.push({
                phase: dpJ && inDict ? 'match' : 'check', activeLine: 9,
                s, dp: [...dp], i, j, slice, result: null,
                message: dpJ && inDict
                    ? `dp[${j}]=True and "${slice}" ∈ wordDict → dp[${i}] = True!`
                    : `dp[${j}]=${dpJ}, "${slice}" ${inDict ? '∈' : '∉'} wordDict. ${!dpJ ? 'Prefix not reachable.' : 'Word not in dict.'}`,
            })

            if (dpJ && inDict) {
                dp[i] = true
                found = true
                steps.push({
                    phase: 'set_true', activeLine: 10,
                    s, dp: [...dp], i, j, slice, result: null,
                    message: `Set dp[${i}] = True. Break inner loop.`,
                })
                break
            }
        }

        if (!found) {
            steps.push({
                phase: 'false', activeLine: 7,
                s, dp: [...dp], i, j: -1, slice: null, result: null,
                message: `No valid split found for s[0..${i - 1}]. dp[${i}] = False.`,
            })
        }
    }

    steps.push({
        phase: 'done', activeLine: 13,
        s, dp: [...dp], i: n, j: -1, slice: null, result: dp[n],
        message: `dp[${n}] = ${dp[n]}. "${s}" ${dp[n] ? 'CAN' : 'CANNOT'} be segmented using the word dictionary.`,
    })

    return steps
}

const EXAMPLES = [
    { label: 'Classic', s: 'leetcode', dict: ['leet', 'code'] },
    { label: 'Applepenapple', s: 'applepenapple', dict: ['apple', 'pen'] },
    { label: 'Cannot', s: 'catsandog', dict: ['cats', 'dog', 'sand', 'and', 'cat'] },
    { label: 'Short', s: 'cars', dict: ['car', 'ca', 'rs'] },
]

export default function WordBreakVisualizer() {
    const [sInput, setSInput] = useState('leetcode')
    const [dictInput, setDictInput] = useState('leet,code')

    const { s, wordDict, inputError } = useMemo(() => {
        const sv = sInput.trim()
        const dict = dictInput.split(',').map(w => w.trim()).filter(Boolean)
        if (!sv) return { s: 'leetcode', wordDict: ['leet', 'code'], inputError: 'String required' }
        if (sv.length > 16) return { s: sv.slice(0, 16), wordDict: dict, inputError: 'Max 16 chars for clarity' }
        return { s: sv, wordDict: dict, inputError: '' }
    }, [sInput, dictInput])

    const steps = useMemo(() => generateSteps(s, wordDict), [s, wordDict])

    const {
        stepIndex, stepForward, stepBack, togglePlay,
        handleReset, isPlaying, speed, setSpeed, isDone,
    } = usePlaybackState(steps.length)

    const step = stepIndex >= 0 ? steps[stepIndex] : null
    const applyExample = useCallback((ex) => {
        setSInput(ex.s); setDictInput(ex.dict.join(',')); handleReset()
    }, [handleReset])

    const dp = step?.dp ?? Array(s.length + 1).fill(false)
    const currI = step?.i ?? -1
    const currJ = step?.j ?? -1
    const slice = step?.slice ?? null

    return (
        <div className="wb-shell">
            <div className="wb-top">
                <section className="wb-panel main">
                    <header className="wb-head"><span>Word Break · DP</span>{inputError && <span className="wb-error">{inputError}</span>}</header>
                    <div className="wb-body">
                        <div className="wb-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="wb-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>

                        <div className="wb-inputs">
                            <div className="wb-input-group">
                                <label className="wb-label">s</label>
                                <input className="wb-input" value={sInput}
                                    onChange={(e) => { setSInput(e.target.value); handleReset() }} placeholder="leetcode" />
                            </div>
                            <div className="wb-input-group">
                                <label className="wb-label">wordDict (comma-separated)</label>
                                <input className="wb-input wide" value={dictInput}
                                    onChange={(e) => { setDictInput(e.target.value); handleReset() }} placeholder="leet,code" />
                            </div>
                        </div>

                        {/* String with highlighted slice */}
                        <div className="wb-str-row">
                            {s.split('').map((ch, idx) => {
                                const inSlice = slice && idx >= currJ && idx < currI
                                const isMatch = inSlice && step?.phase === 'match'
                                const isSet = inSlice && step?.phase === 'set_true'
                                return (
                                    <div
                                        key={idx}
                                        className={`wb-char${inSlice ? ' in-slice' : ''}${isMatch || isSet ? ' match' : ''}${dp[idx + 1] === true && step?.phase !== 'init' ? ' reachable' : ''}`}
                                    >
                                        {ch}
                                        <span className="wb-char-idx">{idx}</span>
                                    </div>
                                )
                            })}
                        </div>

                        {/* DP array */}
                        <div className="wb-dp-row">
                            {dp.map((val, idx) => {
                                const isCurrI = idx === currI
                                const isCurrJ = idx === currJ
                                const isDone = step?.phase === 'done'
                                const isResult = isDone && idx === s.length
                                return (
                                    <div key={idx} className="wb-dp-col">
                                        <motion.div
                                            className={`wb-dp-cell${isCurrI ? ' curr-i' : ''}${isCurrJ ? ' curr-j' : ''}${val ? ' true' : ' false'}${isResult ? ' result' : ''}`}
                                            animate={{ y: isCurrI ? -6 : 0, scale: isCurrI || isResult ? 1.1 : 1 }}
                                            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                                        >
                                            {val ? 'T' : 'F'}
                                        </motion.div>
                                        <span className="wb-dp-idx">[{idx}]</span>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Slice check */}
                        {slice && (
                            <div className={`wb-slice-box${step?.phase === 'match' || step?.phase === 'set_true' ? ' match' : ''}`}>
                                s[{currJ}:{currI}] = <strong>"{slice}"</strong>
                                {step?.phase === 'match' || step?.phase === 'set_true'
                                    ? <span className="wb-in"> ∈ wordDict ✓</span>
                                    : <span className="wb-out"> ∉ wordDict</span>}
                            </div>
                        )}

                        <AnimatePresence>
                            {step?.phase === 'done' && (
                                <motion.div
                                    className={`wb-result${step.result ? ' ok' : ' fail'}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    {step.result ? `"${s}" can be segmented ✓` : `"${s}" cannot be segmented ✗`}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                {/* Word dict panel */}
                <section className="wb-panel dict">
                    <header className="wb-head"><span>wordDict</span></header>
                    <div className="wb-body">
                        {wordDict.map((w) => (
                            <div
                                key={w}
                                className={`wb-word${slice === w ? ' active' : ''}`}
                            >
                                "{w}"
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />

            <div className={`wb-status${step?.result === true ? ' ok' : step?.result === false ? ' fail' : ''}`}>
                {step?.message ?? 'Press Play or Step to begin.'}
            </div>

            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward}
                onReset={handleReset} prevDisabled={stepIndex < 0}
                nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
            />
        </div>
    )
}
