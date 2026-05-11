import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './TwoSumIIVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def twoSum(self, numbers: List[int], target: int) -> List[int]:' },
    { line: 3, text: '        lo, hi = 0, len(numbers) - 1' },
    { line: 4, text: '' },
    { line: 5, text: '        while lo < hi:' },
    { line: 6, text: '            s = numbers[lo] + numbers[hi]' },
    { line: 7, text: '' },
    { line: 8, text: '            if s == target:' },
    { line: 9, text: '                return [lo + 1, hi + 1]' },
    { line: 10, text: '            elif s < target:' },
    { line: 11, text: '                lo += 1' },
    { line: 12, text: '            else:' },
    { line: 13, text: '                hi -= 1' },
    { line: 14, text: '' },
    { line: 15, text: '        return []' },
]

function generateSteps(numbers, target) {
    const steps = []
    let lo = 0
    let hi = numbers.length - 1

    steps.push({
        phase: 'init', activeLine: 3,
        lo, hi, sum: null, result: null,
        message: `Initialize lo=0, hi=${hi}. Target=${target}. Array is sorted.`,
    })

    while (lo < hi) {
        steps.push({
            phase: 'loop', activeLine: 5,
            lo, hi, sum: null, result: null,
            message: `lo=${lo} < hi=${hi}. Continue.`,
        })

        const s = numbers[lo] + numbers[hi]

        steps.push({
            phase: 'calc', activeLine: 6,
            lo, hi, sum: s, result: null,
            message: `sum = numbers[${lo}](${numbers[lo]}) + numbers[${hi}](${numbers[hi]}) = ${s}. Target = ${target}.`,
        })

        if (s === target) {
            steps.push({
                phase: 'found', activeLine: 9,
                lo, hi, sum: s, result: [lo + 1, hi + 1],
                message: `sum(${s}) == target(${target})! Return [${lo + 1}, ${hi + 1}] (1-indexed).`,
            })
            return steps
        } else if (s < target) {
            steps.push({
                phase: 'move_lo', activeLine: 11,
                lo: lo + 1, hi, sum: s, result: null,
                message: `sum(${s}) < target(${target}). Need larger sum → lo++ (${lo} → ${lo + 1}).`,
            })
            lo++
        } else {
            steps.push({
                phase: 'move_hi', activeLine: 13,
                lo, hi: hi - 1, sum: s, result: null,
                message: `sum(${s}) > target(${target}). Need smaller sum → hi-- (${hi} → ${hi - 1}).`,
            })
            hi--
        }
    }

    steps.push({
        phase: 'done', activeLine: 15,
        lo, hi, sum: null, result: [],
        message: 'lo >= hi. No pair found.',
    })
    return steps
}

const EXAMPLES = [
    { label: 'Basic', numbers: [2, 7, 11, 15], target: 9 },
    { label: 'Middle', numbers: [2, 3, 4], target: 6 },
    { label: 'Large', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9], target: 11 },
    { label: 'Negatives', numbers: [-3, -1, 0, 2, 4, 6], target: 1 },
]

export default function TwoSumIIVisualizer() {
    const [numsInput, setNumsInput] = useState('[2,7,11,15]')
    const [targetInput, setTargetInput] = useState('9')

    const { numbers, target, inputError } = useMemo(() => {
        try {
            const n = JSON.parse(numsInput)
            const t = parseInt(targetInput, 10)
            if (!Array.isArray(n) || n.length < 2) throw new Error('Need at least 2 elements')
            if (n.length > 14) throw new Error('Max 14 elements for clarity')
            if (isNaN(t)) throw new Error('Target must be a number')
            return { numbers: n, target: t, inputError: '' }
        } catch (e) {
            return { numbers: [2, 7, 11, 15], target: 9, inputError: e.message }
        }
    }, [numsInput, targetInput])

    const steps = useMemo(() => generateSteps(numbers, target), [numbers, target])
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)

    const step = stepIndex >= 0 ? steps[stepIndex] : null
    const applyExample = useCallback((ex) => {
        setNumsInput(JSON.stringify(ex.numbers))
        setTargetInput(String(ex.target))
        handleReset()
    }, [handleReset])

    const lo = step?.lo ?? 0
    const hi = step?.hi ?? numbers.length - 1
    const sum = step?.sum ?? null
    const result = step?.result

    return (
        <div className="ts2-shell">
            <section className="ts2-panel">
                <header className="ts2-head">
                    <span>Two Sum II · Two Pointers</span>
                    {inputError && <span className="ts2-error">{inputError}</span>}
                </header>
                <div className="ts2-body">
                    <div className="ts2-top-row">
                        <div className="ts2-examples">
                            {EXAMPLES.map(ex => (
                                <button key={ex.label} className="ts2-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <div className="ts2-inputs">
                            <div className="ts2-input-group">
                                <label className="ts2-label">numbers (sorted)</label>
                                <input className="ts2-input" value={numsInput}
                                    onChange={e => { setNumsInput(e.target.value); handleReset() }} />
                            </div>
                            <div className="ts2-input-group">
                                <label className="ts2-label">target</label>
                                <input className="ts2-input narrow" type="number" value={targetInput}
                                    onChange={e => { setTargetInput(e.target.value); handleReset() }} />
                            </div>
                        </div>
                    </div>

                    {/* Array */}
                    <div className="ts2-array">
                        {numbers.map((val, idx) => {
                            const isLo = idx === lo
                            const isHi = idx === hi
                            const isBoth = isLo && isHi
                            const isFound = Array.isArray(result) && result.length === 2 && (idx === result[0] - 1 || idx === result[1] - 1)
                            const isElim = !isLo && !isHi && !isFound
                            return (
                                <div key={idx} className="ts2-col">
                                    <motion.div
                                        className={['ts2-cell',
                                            isFound ? 'found' : '',
                                            isLo && !isBoth && !isFound ? 'lo' : '',
                                            isHi && !isBoth && !isFound ? 'hi' : '',
                                            isBoth && !isFound ? 'both' : '',
                                            isElim && result !== null ? 'dim' : '',
                                        ].filter(Boolean).join(' ')}
                                        animate={{ y: isLo || isHi || isFound ? -8 : 0, scale: isFound ? 1.15 : (isLo || isHi ? 1.08 : 1) }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                                    >
                                        {val}
                                    </motion.div>
                                    <span className="ts2-idx">{idx + 1}</span>
                                    <div className="ts2-ptrs">
                                        {isLo && <span className="ts2-ptr lo-ptr">lo</span>}
                                        {isHi && !isLo && <span className="ts2-ptr hi-ptr">hi</span>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Sum verdict */}
                    {sum !== null && (
                        <motion.div
                            className={['ts2-verdict',
                                sum === target ? 'match' : sum < target ? 'low' : 'high'
                            ].join(' ')}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {numbers[lo] !== undefined && numbers[hi] !== undefined
                                ? `${numbers[step?.phase === 'move_lo' ? lo - 1 : lo]} + ${numbers[step?.phase === 'move_hi' ? hi + 1 : hi]} = ${sum} `
                                : `sum = ${sum} `}
                            {sum === target ? '= target ✓' : sum < target ? `< ${target} → move lo right` : `> ${target} → move hi left`}
                        </motion.div>
                    )}

                    <AnimatePresence>
                        {Array.isArray(result) && result.length === 2 && (
                            <motion.div className="ts2-result"
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                Answer: [{result[0]}, {result[1]}] (1-indexed)
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />

            <div className={`ts2-status${Array.isArray(result) && result.length === 2 ? ' ok' : ''}`}>
                {step?.message ?? 'Press Play or Step to begin.'}
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
