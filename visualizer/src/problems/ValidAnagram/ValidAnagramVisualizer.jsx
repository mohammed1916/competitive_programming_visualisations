import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './ValidAnagramVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def isAnagram(self, s: str, t: str) -> bool:' },
    { line: 3, text: '        if len(s) != len(t):' },
    { line: 4, text: '            return False' },
    { line: 5, text: '        count = {}' },
    { line: 6, text: '        for c in s:' },
    { line: 7, text: '            count[c] = count.get(c, 0) + 1' },
    { line: 8, text: '        for c in t:' },
    { line: 9, text: '            count[c] = count.get(c, 0) - 1' },
    { line: 10, text: '            if count[c] < 0:' },
    { line: 11, text: '                return False' },
    { line: 12, text: '        return True' },
]

function generateSteps(s, t) {
    const steps = []

    steps.push({
        phase: 'check_len', activeLine: 3,
        s, t, count: {}, idx: -1, activeChar: null, activeStr: null,
        result: null,
        message: `len(s)=${s.length}, len(t)=${t.length}. ${s.length !== t.length ? 'Different lengths → return False.' : 'Same length, continue.'}`,
    })

    if (s.length !== t.length) {
        steps.push({
            phase: 'done', activeLine: 4,
            s, t, count: {}, idx: -1, activeChar: null, activeStr: null,
            result: false,
            message: 'Lengths differ. Not an anagram. Return False.',
        })
        return steps
    }

    const count = {}

    steps.push({
        phase: 'init', activeLine: 5,
        s, t, count: { ...count }, idx: -1, activeChar: null, activeStr: null,
        result: null,
        message: 'Initialize empty frequency map.',
    })

    // Pass 1: increment for s
    for (let i = 0; i < s.length; i++) {
        const c = s[i]
        count[c] = (count[c] ?? 0) + 1
        steps.push({
            phase: 'incr', activeLine: 7,
            s, t, count: { ...count }, idx: i, activeChar: c, activeStr: 's',
            result: null,
            message: `s[${i}]='${c}': count['${c}'] → ${count[c]}.`,
        })
    }

    // Pass 2: decrement for t
    for (let i = 0; i < t.length; i++) {
        const c = t[i]
        count[c] = (count[c] ?? 0) - 1

        steps.push({
            phase: count[c] < 0 ? 'mismatch' : 'decr', activeLine: count[c] < 0 ? 11 : 9,
            s, t, count: { ...count }, idx: i, activeChar: c, activeStr: 't',
            result: count[c] < 0 ? false : null,
            message: count[c] < 0
                ? `t[${i}]='${c}': count['${c}'] → ${count[c]} < 0. '${c}' appears more in t than s. Return False.`
                : `t[${i}]='${c}': count['${c}'] → ${count[c]}.`,
        })

        if (count[c] < 0) return steps
    }

    steps.push({
        phase: 'done', activeLine: 12,
        s, t, count: { ...count }, idx: -1, activeChar: null, activeStr: null,
        result: true,
        message: 'All counts are 0 or balanced. s and t are anagrams. Return True.',
    })

    return steps
}

const EXAMPLES = [
    { label: 'Anagram', s: 'anagram', t: 'nagaram' },
    { label: 'Not anagram', s: 'rat', t: 'car' },
    { label: 'Same', s: 'listen', t: 'silent' },
    { label: 'Diff length', s: 'hello', t: 'world!' },
]

export default function ValidAnagramVisualizer() {
    const [sInput, setSInput] = useState('anagram')
    const [tInput, setTInput] = useState('nagaram')

    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const { s, t, inputError } = useMemo(() => {
        const sv = sInput.trim()
        const tv = tInput.trim()
        if (!sv || !tv) return { s: 'anagram', t: 'nagaram', inputError: 'Both strings required' }
        if (sv.length > 16 || tv.length > 16) return { s: sv.slice(0, 16), t: tv.slice(0, 16), inputError: 'Max 16 chars for clarity' }
        return { s: sv, t: tv, inputError: '' }
    }, [sInput, tInput])

    const steps = useMemo(() => generateSteps(s, t), [s, t])

    const {
        stepIndex, stepForward, stepBack, togglePlay,
        handleReset, isPlaying, speed, setSpeed, isDone,
    } = usePlaybackState(steps.length)

    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useCallback((ex) => {
        setSInput(ex.s)
        setTInput(ex.t)
        handleReset()
    }, [handleReset])

    const count = step?.count ?? {}
    const allKeys = Array.from(new Set([...Object.keys(count), ...s.split(''), ...t.split('')])).sort()

    return (
        <div className="va-shell">
            <div className="va-top">
                {/* ── Main panel ── */}
                <section className="va-panel main">
                    <header className="va-head">
                        <span>Valid Anagram · Frequency Map</span>
                        {inputError && <span className="va-error">{inputError}</span>}
                    </header>
                    <div className="va-body">
                        <div className="va-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="va-chip" onClick={() => applyExample(ex)}>
                                    {ex.label}
                                </button>
                            ))}
                        </div>

                        <div className="va-inputs">
                            <div className="va-input-group">
                                <label className="va-label">s</label>
                                <input
                                    className="va-input"
                                    value={sInput}
                                    onChange={(e) => { setSInput(e.target.value); handleReset() }}
                                    placeholder="anagram"
                                />
                            </div>
                            <div className="va-input-group">
                                <label className="va-label">t</label>
                                <input
                                    className="va-input"
                                    value={tInput}
                                    onChange={(e) => { setTInput(e.target.value); handleReset() }}
                                    placeholder="nagaram"
                                />
                            </div>
                        </div>

                        {/* String display rows */}
                        {['s', 't'].map((str) => {
                            const chars = (str === 's' ? s : t).split('')
                            return (
                                <div key={str} className="va-str-row">
                                    <span className="va-str-name">{str}</span>
                                    <div className="va-chars">
                                        {chars.map((ch, idx) => {
                                            const isActive = step?.activeStr === str && step?.idx === idx
                                            const isDone = step?.result === true
                                            const isMismatch = step?.result === false && step?.activeStr === str && step?.idx === idx
                                            return (
                                                <motion.div
                                                    key={idx}
                                                    className={`va-char${isActive ? ' active' : ''}${isDone ? ' done' : ''}${isMismatch ? ' mismatch' : ''}`}
                                                    animate={{ scale: isActive ? 1.2 : 1, y: isActive ? -6 : 0 }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                                                >
                                                    {ch}
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* ── Frequency map panel ── */}
                <section className="va-panel freq">
                    <header className="va-head"><span>count[ ]</span></header>
                    <div className="va-body">
                        <AnimatePresence>
                            {allKeys.filter(k => count[k] !== undefined).map((key) => {
                                const val = count[key] ?? 0
                                const isActive = step?.activeChar === key
                                const isNeg = val < 0
                                const isZero = val === 0
                                return (
                                    <motion.div
                                        key={key}
                                        className={`va-freq-row${isActive ? ' active' : ''}${isNeg ? ' neg' : ''}${isZero ? ' zero' : ''}`}
                                        layout
                                        initial={{ opacity: 0, x: 12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <span className="va-freq-key mono">'{key}'</span>
                                        <div className={`va-freq-bar-wrap${val >= 0 ? '' : ' neg-wrap'}`}>
                                            <motion.div
                                                className={`va-freq-bar${isNeg ? ' neg' : ''}`}
                                                animate={{ width: `${Math.abs(val) * 28}px` }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                            />
                                        </div>
                                        <span className={`va-freq-val mono${isNeg ? ' neg' : ''}${isZero ? ' zero' : ''}`}>{val}</span>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                        {Object.keys(count).length === 0 && (
                            <div className="va-empty">Map is empty</div>
                        )}
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />

            <div className={`va-status${step?.result === true ? ' ok' : step?.result === false ? ' fail' : ''}`}>
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
