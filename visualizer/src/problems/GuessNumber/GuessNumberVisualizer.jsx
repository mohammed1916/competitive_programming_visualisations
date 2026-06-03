import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './GuessNumberVisualizer.css'

const SOLUTION_CODE = [
    { line: 1,  text: 'class Solution:' },
    { line: 2,  text: '    def guessNumber(self, n: int) -> int:' },
    { line: 3,  text: '        lo, hi = 1, n' },
    { line: 4,  text: '        while lo <= hi:' },
    { line: 5,  text: '            mid = (lo + hi) // 2' },
    { line: 6,  text: '            result = guess(mid)' },
    { line: 7,  text: '            if result == 0:' },
    { line: 8,  text: '                return mid' },
    { line: 9,  text: '            elif result == -1:' },
    { line: 10, text: '                hi = mid - 1' },
    { line: 11, text: '            else:' },
    { line: 12, text: '                lo = mid + 1' },
]

const EXAMPLES = [
    { label: 'n=10, pick=6',  n: 10,  pick: 6  },
    { label: 'n=16, pick=1',  n: 16,  pick: 1  },
    { label: 'n=20, pick=20', n: 20,  pick: 20 },
    { label: 'n=100, pick=73', n: 100, pick: 73 },
]

function guessResult(mid, pick) {
    if (mid === pick) return 0
    if (mid > pick) return -1   // my guess is too high → go lower
    return 1                     // my guess is too low  → go higher
}

function generateSteps(n, pick) {
    const steps = []
    let lo = 1
    let hi = n

    steps.push({
        phase: 'init', activeLine: 3,
        lo, hi, mid: null, result: null, found: false,
        message: `Initialize lo=1, hi=${n}. We need to find the secret number (1..${n}).`,
    })

    let iteration = 0
    while (lo <= hi) {
        iteration++
        steps.push({
            phase: 'loop_check', activeLine: 4,
            lo, hi, mid: null, result: null, found: false,
            message: `Iteration ${iteration}: lo=${lo} <= hi=${hi}. Enter loop.`,
        })

        const mid = Math.floor((lo + hi) / 2)

        steps.push({
            phase: 'calc_mid', activeLine: 5,
            lo, hi, mid, result: null, found: false,
            message: `mid = (${lo} + ${hi}) // 2 = ${mid}. Guess ${mid}.`,
        })

        const res = guessResult(mid, pick)

        steps.push({
            phase: 'guess_call', activeLine: 6,
            lo, hi, mid, result: res, found: false,
            message: `guess(${mid}) returns ${res}. ${
                res === 0 ? 'Correct!' :
                res === -1 ? `${mid} is too HIGH. Secret < ${mid}.` :
                             `${mid} is too LOW. Secret > ${mid}.`
            }`,
        })

        if (res === 0) {
            steps.push({
                phase: 'found', activeLine: 8,
                lo, hi, mid, result: 0, found: true,
                message: `result==0: Found it! Return mid=${mid}. Secret was ${pick}.`,
            })
            return steps
        } else if (res === -1) {
            steps.push({
                phase: 'shrink_hi', activeLine: 10,
                lo, hi: mid - 1, mid, result: -1, found: false,
                message: `result==-1: Guess too high. hi = mid-1 = ${mid - 1}. Search left half [${lo}..${mid - 1}].`,
            })
            hi = mid - 1
        } else {
            steps.push({
                phase: 'shrink_lo', activeLine: 12,
                lo: mid + 1, hi, mid, result: 1, found: false,
                message: `result==1: Guess too low. lo = mid+1 = ${mid + 1}. Search right half [${mid + 1}..${hi}].`,
            })
            lo = mid + 1
        }
    }

    // Should never reach here for valid input but just in case
    steps.push({
        phase: 'done', activeLine: 3,
        lo, hi, mid: null, result: null, found: false,
        message: 'Search complete. No number found (invalid input).',
    })
    return steps
}

export default function GuessNumberVisualizer() {
    const [nInput, setNInput]       = useState('10')
    const [pickInput, setPickInput] = useState('6')

    const { n, pick, inputError } = useMemo(() => {
        try {
            const nv   = parseInt(nInput, 10)
            const pv   = parseInt(pickInput, 10)
            if (isNaN(nv) || nv < 1)        throw new Error('n must be a positive integer')
            if (nv > 200)                    throw new Error('n max 200 for clarity')
            if (isNaN(pv) || pv < 1 || pv > nv) throw new Error(`pick must be between 1 and ${nv}`)
            return { n: nv, pick: pv, inputError: '' }
        } catch (e) {
            return { n: 10, pick: 6, inputError: e.message }
        }
    }, [nInput, pickInput])

    const steps = useMemo(() => generateSteps(n, pick), [n, pick])
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length)

    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useCallback((ex) => {
        setNInput(String(ex.n))
        setPickInput(String(ex.pick))
        handleReset()
    }, [handleReset])

    const lo   = step?.lo   ?? 1
    const hi   = step?.hi   ?? n
    const mid  = step?.mid  ?? null
    const res  = step?.result
    const found = step?.found ?? false

    // Build tick marks for the range bar (show up to ~20 labels)
    const tickStep = Math.max(1, Math.ceil(n / 20))
    const ticks = []
    for (let i = 1; i <= n; i += tickStep) ticks.push(i)
    if (ticks[ticks.length - 1] !== n) ticks.push(n)

    // Bar positions as percentages
    const pct = (v) => ((v - 1) / (n - 1 || 1)) * 100

    const guessLabel = res === 0 ? 'Correct!' : res === -1 ? 'Too High' : res === 1 ? 'Too Low' : null

    return (
        <div className="gn-shell">
            <section className="gn-panel">
                <header className="gn-head">
                    <span>Guess Number Higher or Lower · Binary Search</span>
                    {inputError && <span className="gn-error">{inputError}</span>}
                </header>
                <div className="gn-body">
                    {/* ── Controls ── */}
                    <div className="gn-top-row">
                        <div className="gn-examples">
                            {EXAMPLES.map(ex => (
                                <button key={ex.label} className="gn-chip" onClick={() => applyExample(ex)}>
                                    {ex.label}
                                </button>
                            ))}
                        </div>
                        <div className="gn-inputs">
                            <div className="gn-input-group">
                                <label className="gn-label">n (range 1..n)</label>
                                <input className="gn-input narrow" type="number" min="1" max="200"
                                    value={nInput}
                                    onChange={e => { setNInput(e.target.value); handleReset() }} />
                            </div>
                            <div className="gn-input-group">
                                <label className="gn-label">secret pick</label>
                                <input className="gn-input narrow" type="number" min="1"
                                    value={pickInput}
                                    onChange={e => { setPickInput(e.target.value); handleReset() }} />
                            </div>
                        </div>
                    </div>

                    {/* ── State Variables ── */}
                    <div className="gn-vars">
                        {[
                            { label: 'lo',  value: lo,  color: '#89b4fa' },
                            { label: 'hi',  value: hi,  color: '#cba6f7' },
                            { label: 'mid', value: mid !== null ? mid : '—', color: '#f9e2af' },
                            { label: 'guess(mid)',
                              value: res !== null ? (res === 0 ? '0 ✓' : res === -1 ? '-1 (↓)' : '+1 (↑)') : '—',
                              color: res === 0 ? '#a6e3a1' : res === -1 ? '#f38ba8' : res === 1 ? '#fab387' : '#6c7086' },
                        ].map(v => (
                            <motion.div
                                key={v.label}
                                className="gn-var"
                                animate={{ borderColor: v.color }}
                                transition={{ duration: 0.3 }}
                                style={{ borderColor: v.color }}
                            >
                                <span className="gn-var-label">{v.label}</span>
                                <motion.span
                                    key={String(v.value)}
                                    className="gn-var-value"
                                    style={{ color: v.color }}
                                    initial={{ scale: 1.3, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                                >
                                    {String(v.value)}
                                </motion.span>
                            </motion.div>
                        ))}
                    </div>

                    {/* ── Range Bar ── */}
                    <div className="gn-bar-section">
                        <div className="gn-bar-label">Search Range  1 .. {n}</div>
                        <div className="gn-bar-wrap">
                            {/* Full track */}
                            <div className="gn-track" />

                            {/* Eliminated (left) */}
                            {step && (
                                <motion.div
                                    className="gn-elim-left"
                                    animate={{ width: `${pct(lo)}%` }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                                />
                            )}

                            {/* Eliminated (right) */}
                            {step && (
                                <motion.div
                                    className="gn-elim-right"
                                    animate={{ width: `${100 - pct(hi)}%` }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                                />
                            )}

                            {/* Active range highlight */}
                            {step && (
                                <motion.div
                                    className="gn-active-range"
                                    animate={{
                                        left:  `${pct(lo)}%`,
                                        width: `${pct(hi) - pct(lo)}%`,
                                    }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                                />
                            )}

                            {/* lo marker */}
                            <motion.div
                                className="gn-marker lo-marker"
                                animate={{ left: `${pct(lo)}%` }}
                                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                            >
                                <div className="gn-marker-pin lo-pin" />
                                <div className="gn-marker-label lo-lbl">lo={lo}</div>
                            </motion.div>

                            {/* hi marker */}
                            <motion.div
                                className="gn-marker hi-marker"
                                animate={{ left: `${pct(hi)}%` }}
                                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                            >
                                <div className="gn-marker-pin hi-pin" />
                                <div className="gn-marker-label hi-lbl">hi={hi}</div>
                            </motion.div>

                            {/* mid marker */}
                            <AnimatePresence>
                                {mid !== null && (
                                    <motion.div
                                        className="gn-marker mid-marker"
                                        initial={{ opacity: 0, scale: 0.6 }}
                                        animate={{ opacity: 1, scale: 1, left: `${pct(mid)}%` }}
                                        exit={{ opacity: 0, scale: 0.6 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                    >
                                        <div className={`gn-marker-pin mid-pin${found ? ' mid-found' : res === -1 ? ' mid-high' : res === 1 ? ' mid-low' : ''}`} />
                                        <div className="gn-marker-label mid-lbl">mid={mid}</div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Tick marks */}
                            <div className="gn-ticks">
                                {ticks.map(t => (
                                    <div key={t} className="gn-tick" style={{ left: `${pct(t)}%` }}>
                                        <div className="gn-tick-line" />
                                        <span className="gn-tick-label">{t}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Guess Result Badge ── */}
                    <AnimatePresence mode="wait">
                        {guessLabel && (
                            <motion.div
                                key={guessLabel + String(mid)}
                                className={`gn-guess-badge ${
                                    res === 0 ? 'correct' : res === -1 ? 'too-high' : 'too-low'
                                }`}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.25 }}
                            >
                                {res === 0 && `Correct! Found ${mid} in ${steps.filter(s => s.phase === 'found' || s.phase === 'guess_call').length - 1} guess(es).`}
                                {res === -1 && `guess(${mid}) = -1 → ${mid} is too high, secret is lower. New hi = ${hi}.`}
                                {res === 1  && `guess(${mid}) = +1 → ${mid} is too low, secret is higher. New lo = ${lo}.`}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Found banner ── */}
                    <AnimatePresence>
                        {found && (
                            <motion.div
                                className="gn-found-banner"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                Found! Secret number = {mid}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />

            <div className={`gn-status${found ? ' ok' : ''}`}>
                {step?.message ?? 'Press Play or Step to begin the binary search.'}
            </div>

            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward}
                onReset={handleReset} prevDisabled={stepIndex < 0}
                nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={e => setSpeed(Number(e.target.value))}
            />
        </div>
    )
}
