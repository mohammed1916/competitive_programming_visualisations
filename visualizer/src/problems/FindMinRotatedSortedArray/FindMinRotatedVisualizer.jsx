import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './FindMinRotatedVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def findMin(self, nums: List[int]) -> int:' },
    { line: 3, text: '        lo, hi = 0, len(nums) - 1' },
    { line: 4, text: '' },
    { line: 5, text: '        while lo < hi:' },
    { line: 6, text: '            mid = (lo + hi) // 2' },
    { line: 7, text: '' },
    { line: 8, text: '            if nums[mid] > nums[hi]:' },
    { line: 9, text: '                # min is in right half' },
    { line: 10, text: '                lo = mid + 1' },
    { line: 11, text: '            else:' },
    { line: 12, text: '                # min is in left half (including mid)' },
    { line: 13, text: '                hi = mid' },
    { line: 14, text: '' },
    { line: 15, text: '        return nums[lo]' },
]

function generateSteps(nums) {
    const steps = []
    let lo = 0
    let hi = nums.length - 1

    steps.push({
        phase: 'init', activeLine: 3,
        lo, hi, mid: null, result: null,
        message: `Initialize lo=0, hi=${hi}. Array may be rotated.`,
    })

    while (lo < hi) {
        steps.push({
            phase: 'loop', activeLine: 5,
            lo, hi, mid: null, result: null,
            message: `lo=${lo} < hi=${hi}. Continue.`,
        })

        const mid = Math.floor((lo + hi) / 2)

        steps.push({
            phase: 'calc_mid', activeLine: 6,
            lo, hi, mid, result: null,
            message: `mid = (${lo} + ${hi}) // 2 = ${mid}. nums[mid]=${nums[mid]}, nums[hi]=${nums[hi]}.`,
        })

        if (nums[mid] > nums[hi]) {
            steps.push({
                phase: 'go_right', activeLine: 10,
                lo: mid + 1, hi, mid, result: null,
                message: `nums[${mid}](${nums[mid]}) > nums[${hi}](${nums[hi]}) → min is in right half. lo = ${mid + 1}.`,
            })
            lo = mid + 1
        } else {
            steps.push({
                phase: 'go_left', activeLine: 13,
                lo, hi: mid, mid, result: null,
                message: `nums[${mid}](${nums[mid]}) ≤ nums[${hi}](${nums[hi]}) → min is in left half (including mid). hi = ${mid}.`,
            })
            hi = mid
        }
    }

    steps.push({
        phase: 'done', activeLine: 15,
        lo, hi, mid: null, result: nums[lo],
        message: `lo == hi == ${lo}. Minimum = nums[${lo}] = ${nums[lo]}.`,
    })

    return steps
}

const EXAMPLES = [
    { label: 'Classic', nums: [3, 4, 5, 1, 2] },
    { label: 'More', nums: [4, 5, 6, 7, 0, 1, 2] },
    { label: 'Not rotated', nums: [1, 2, 3, 4, 5] },
    { label: 'Two elems', nums: [2, 1] },
    { label: 'Large', nums: [7, 8, 9, 10, 11, 1, 2, 3, 4, 5, 6] },
]

export default function FindMinRotatedVisualizer() {
    const [input, setInput] = useState('[3,4,5,1,2]')
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const { nums, inputError } = useMemo(() => {
        try {
            const parsed = JSON.parse(input)
            if (!Array.isArray(parsed) || !parsed.every(Number.isInteger))
                throw new Error('Must be JSON array of integers')
            if (parsed.length < 1) throw new Error('Need at least 1 element')
            if (parsed.length > 14) throw new Error('Max 14 elements for clarity')
            return { nums: parsed, inputError: '' }
        } catch (e) {
            return { nums: [3, 4, 5, 1, 2], inputError: e.message }
        }
    }, [input])

    const steps = useMemo(() => generateSteps(nums), [nums])
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)

    const step = stepIndex >= 0 ? steps[stepIndex] : null
    const applyExample = useCallback((ex) => {
        setInput(JSON.stringify(ex.nums))
        handleReset()
    }, [handleReset])

    const lo = step?.lo ?? 0
    const hi = step?.hi ?? nums.length - 1
    const mid = step?.mid ?? null
    const result = step?.result ?? null

    return (
        <div className="fmr-shell">
            <section className="fmr-panel">
                <header className="fmr-head">
                    <span>Find Min in Rotated Sorted Array · Binary Search</span>
                    {inputError && <span className="fmr-error">{inputError}</span>}
                </header>
                <div className="fmr-body">
                    <div className="fmr-top-row">
                        <div className="fmr-examples">
                            {EXAMPLES.map(ex => (
                                <button key={ex.label} className="fmr-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <div className="fmr-input-group">
                            <label className="fmr-label">nums (sorted + rotated)</label>
                            <input className="fmr-input" value={input}
                                onChange={e => { setInput(e.target.value); handleReset() }} />
                        </div>
                    </div>

                    {/* Array */}
                    <div className="fmr-array">
                        {nums.map((val, idx) => {
                            const isLo = idx === lo
                            const isHi = idx === hi
                            const isMid = idx === mid
                            const isDone = step?.phase === 'done'
                            const isResult = isDone && idx === lo
                            const inLeft = idx >= lo && mid !== null && idx <= mid
                            const inRight = mid !== null && idx > mid && idx <= hi
                            const inRange = idx >= lo && idx <= hi

                            let variant = ''
                            if (isResult) variant = 'result'
                            else if (isMid) variant = 'mid'
                            else if (isLo && isHi) variant = 'lohi'
                            else if (isLo) variant = 'lo'
                            else if (isHi) variant = 'hi'
                            else if (!inRange) variant = 'elim'
                            else if (step?.phase === 'go_right' && inLeft) variant = 'elim'
                            else if (step?.phase === 'go_left' && inRight) variant = 'elim'

                            return (
                                <div key={idx} className="fmr-col">
                                    <motion.div
                                        className={['fmr-cell', variant].filter(Boolean).join(' ')}
                                        animate={{
                                            y: variant === 'result' || variant === 'mid' || variant === 'lo' || variant === 'hi' || variant === 'lohi' ? -8 : 0,
                                            scale: variant === 'result' ? 1.2 : (variant === 'mid' ? 1.1 : 1),
                                        }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                                    >
                                        {val}
                                    </motion.div>
                                    <span className="fmr-idx">{idx}</span>
                                    <div className="fmr-ptrs">
                                        {isLo && <span className="fmr-ptr fmr-lo">lo</span>}
                                        {isMid && <span className="fmr-ptr fmr-mid">mid</span>}
                                        {isHi && !isLo && <span className="fmr-ptr fmr-hi">hi</span>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Comparison box */}
                    {mid !== null && step?.phase !== 'done' && (
                        <motion.div
                            className={['fmr-compare', step?.phase === 'go_right' ? 'right' : 'left'].join(' ')}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        >
                            {step?.phase === 'go_right'
                                ? `nums[mid]=${nums[mid]} > nums[hi]=${nums[hi]} → rotation pivot is in right half → lo = mid+1`
                                : `nums[mid]=${nums[mid]} ≤ nums[hi]=${nums[hi]} → min could be at mid or left → hi = mid`}
                        </motion.div>
                    )}

                    <AnimatePresence>
                        {result !== null && (
                            <motion.div className="fmr-result"
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                Minimum = {result}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />

            <div className={`fmr-status${result !== null ? ' ok' : ''}`}>
                {step?.message ?? 'Press Play or Step to begin.'}
            </div>

            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward}
                onReset={handleReset} prevDisabled={stepIndex < 0}
                nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={e => setSpeed(Number(e.target.value))}
                showPatternOverlay={showPatternOverlay}
                onShowPatternOverlayChange={setShowPatternOverlay}
                patternOverlayLabel="Show pattern overlay"
                showPatternOverlayToggle
            />
            {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
        </div>
    )
}
