import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './PalindromicSubstringsVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'def countSubstrings(s):' },
    { line: 2, text: '    count = 0' },
    { line: 3, text: '    for center in range(len(s)):' },
    { line: 4, text: '        # odd length' },
    { line: 5, text: '        l, r = center, center' },
    { line: 6, text: '        while l >= 0 and r < len(s) and s[l] == s[r]:' },
    { line: 7, text: '            count += 1; l -= 1; r += 1' },
    { line: 8, text: '        # even length' },
    { line: 9, text: '        l, r = center, center + 1' },
    { line: 10, text: '        while l >= 0 and r < len(s) and s[l] == s[r]:' },
    { line: 11, text: '            count += 1; l -= 1; r += 1' },
    { line: 12, text: '    return count' },
]

function generateSteps(s) {
    const n = s.length
    const steps = []
    let count = 0
    const found = [] // list of [l,r] palindrome ranges found so far

    steps.push({
        phase: 'init', activeLine: 2, center: -1, l: -1, r: -1,
        count, found: [], activeL: -1, activeR: -1, isEven: false,
        message: 'Start expand-around-center',
    })

    for (let center = 0; center < n; center++) {
        // Odd
        let l = center, r = center
        steps.push({
            phase: 'center-odd', activeLine: 5, center, l, r,
            count, found: [...found], activeL: l, activeR: r, isEven: false,
            message: `Center ${center} ('${s[center]}'): odd expansion`,
        })

        while (l >= 0 && r < n && s[l] === s[r]) {
            count++
            found.push([l, r])
            steps.push({
                phase: 'expand-odd', activeLine: 7, center, l, r,
                count, found: [...found], activeL: l, activeR: r, isEven: false,
                message: `Odd palindrome "${s.slice(l, r + 1)}" (${l},${r}) → count=${count}`,
            })
            l--
            r++
        }

        // Even
        l = center
        r = center + 1
        steps.push({
            phase: 'center-even', activeLine: 9, center, l, r,
            count, found: [...found], activeL: l, activeR: r, isEven: true,
            message: `Center ${center}/${center + 1}: even expansion`,
        })

        while (l >= 0 && r < n && s[l] === s[r]) {
            count++
            found.push([l, r])
            steps.push({
                phase: 'expand-even', activeLine: 11, center, l, r,
                count, found: [...found], activeL: l, activeR: r, isEven: true,
                message: `Even palindrome "${s.slice(l, r + 1)}" (${l},${r}) → count=${count}`,
            })
            l--
            r++
        }
    }

    steps.push({
        phase: 'done', activeLine: 12, center: -1, l: -1, r: -1,
        count, found: [...found], activeL: -1, activeR: -1, isEven: false,
        message: `Total palindromic substrings = ${count}`,
    })

    return steps
}

const EXAMPLES = [
    { label: 'LeetCode', s: 'abc' },
    { label: 'aaa', s: 'aaa' },
    { label: 'abcba', s: 'abcba' },
    { label: 'racecar', s: 'racecar' },
]

export default function PalindromicSubstringsVisualizer() {
    const [sInput, setSInput] = useState('abc')

    const s = sInput.slice(0, 12)

    const steps = useMemo(() => generateSteps(s), [s])
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useCallback((ex) => {
        setSInput(ex.s)
        handleReset()
    }, [handleReset])

    const CELL = 48

    // Color each character based on role
    const getCharClass = (i) => {
        if (!step) return ''
        const { activeL, activeR, center } = step
        if (activeL !== -1 && i >= activeL && i <= activeR) return 'active-range'
        if (i === center) return 'center'
        return ''
    }

    // All found palindrome ranges for overlay
    const found = step?.found ?? []

    return (
        <div className="ps-shell">
            <div className="ps-top">
                <section className="ps-panel main">
                    <header className="ps-head"><span>Expand around center</span></header>
                    <div className="ps-body">
                        <div className="ps-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="ps-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <input className="ps-input" value={sInput} maxLength={12} onChange={(e) => { setSInput(e.target.value); handleReset() }} placeholder="Enter string (max 12)" />

                        {/* Character cells */}
                        <div className="ps-chars">
                            {s.split('').map((c, i) => (
                                <motion.div
                                    key={i}
                                    className={`ps-char ${getCharClass(i)}`}
                                    animate={step?.activeL <= i && i <= step?.activeR && step?.activeL !== -1 ? { scale: 1.1 } : { scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                                >
                                    <span className="ps-char-val">{c}</span>
                                    <span className="ps-char-idx">{i}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* L / R pointer row */}
                        <div className="ps-pointers" style={{ width: s.length * (CELL + 6) }}>
                            {s.split('').map((_, i) => {
                                const isL = step?.activeL === i
                                const isR = step?.activeR === i
                                const isCenter = step?.center === i
                                return (
                                    <div key={i} className="ps-ptr-slot">
                                        {isL && <span className="ps-ptr l-ptr">L</span>}
                                        {isR && <span className="ps-ptr r-ptr">R</span>}
                                        {isCenter && !isL && !isR && <span className="ps-ptr c-ptr">C</span>}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Recent palindromes */}
                        <div className="ps-sub-head">Found palindromes ({found.length})</div>
                        <div className="ps-found-list">
                            {found.slice(-8).map(([l, r], i) => (
                                <span key={`${l}-${r}-${i}`} className="ps-found-chip">
                                    {s.slice(l, r + 1)}
                                </span>
                            ))}
                            {found.length > 8 && <span className="ps-found-chip more">+{found.length - 8}</span>}
                        </div>
                    </div>
                </section>

                <section className="ps-panel side">
                    <header className="ps-head"><span>State</span></header>
                    <div className="ps-body">
                        <div className="ps-metric"><span className="ps-label">center</span><strong className="ps-val">{step?.center >= 0 ? `${step.center}${step.isEven ? '/' + (step.center + 1) : ''}` : '—'}</strong></div>
                        <div className="ps-metric"><span className="ps-label">L</span><strong className="ps-val l-color">{step?.activeL >= 0 ? step.activeL : '—'}</strong></div>
                        <div className="ps-metric"><span className="ps-label">R</span><strong className="ps-val r-color">{step?.activeR >= 0 ? step.activeR : '—'}</strong></div>
                        <div className="ps-metric"><span className="ps-label">count</span><strong className="ps-val accent">{step?.count ?? 0}</strong></div>
                        <div className={`ps-result ${step?.phase === 'done' ? 'done' : ''}`}>
                            {step?.phase === 'done' ? `Count = ${step.count}` : 'Expanding…'}
                        </div>
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="ps-status">{step?.message || 'Press Play to begin.'}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
            />
        </div>
    )
}
