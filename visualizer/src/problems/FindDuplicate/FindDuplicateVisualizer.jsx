import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './FindDuplicateVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'def findDuplicate(nums):' },
    { line: 2, text: '    slow = fast = nums[0]' },
    { line: 3, text: '    while True:' },
    { line: 4, text: '        slow = nums[slow]' },
    { line: 5, text: '        fast = nums[nums[fast]]' },
    { line: 6, text: '        if slow == fast: break' },
    { line: 7, text: '    slow = nums[0]' },
    { line: 8, text: '    while slow != fast:' },
    { line: 9, text: '        slow = nums[slow]' },
    { line: 10, text: '        fast = nums[fast]' },
    { line: 11, text: '    return slow  # duplicate' },
]

function generateSteps(nums) {
    const steps = []
    const n = nums.length

    let slow = nums[0]
    let fast = nums[0]

    steps.push({
        phase: 'init', activeLine: 2, slow, fast,
        phase1Done: false, result: null,
        message: `Init slow=${slow} fast=${fast}`,
    })

    // Phase 1: detect cycle
    while (true) {
        slow = nums[slow]
        fast = nums[nums[fast]]
        const met = slow === fast

        steps.push({
            phase: 'phase1', activeLine: met ? 6 : 5, slow, fast,
            phase1Done: false, result: null,
            message: met
                ? `slow=fast=${slow} → cycle detected`
                : `slow→${slow}, fast→${fast}`,
        })

        if (met) break
    }

    steps.push({
        phase: 'phase1-done', activeLine: 7, slow, fast: nums[0],
        phase1Done: true, result: null,
        message: `Reset slow to nums[0]=${nums[0]}, keep fast=${slow}`,
    })

    // Phase 2: find entrance
    slow = nums[0]
    fast = slow === fast ? fast : fast // fast stays

    while (slow !== fast) {
        slow = nums[slow]
        fast = nums[fast]

        steps.push({
            phase: 'phase2', activeLine: slow === fast ? 11 : 10, slow, fast,
            phase1Done: true, result: slow === fast ? slow : null,
            message: slow === fast
                ? `slow=fast=${slow} → duplicate found!`
                : `slow→${slow}, fast→${fast}`,
        })
    }

    steps.push({
        phase: 'done', activeLine: 11, slow, fast,
        phase1Done: true, result: slow,
        message: `Duplicate = ${slow}`,
    })

    return steps
}

const EXAMPLES = [
    { label: 'LeetCode', nums: [1, 3, 4, 2, 2] },
    { label: 'Example 2', nums: [3, 1, 3, 4, 2] },
    { label: 'Simple', nums: [1, 1] },
    { label: 'Longer', nums: [2, 5, 9, 6, 9, 3, 8, 9, 7, 1] },
]

export default function FindDuplicateVisualizer() {
    const [numsInput, setNumsInput] = useState('[1,3,4,2,2]')

    const { nums, inputError } = useMemo(() => {
        try {
            const parsed = JSON.parse(numsInput)
            if (!Array.isArray(parsed)) throw new Error('Must be an array')
            return { nums: parsed.map(Number), inputError: '' }
        } catch (e) {
            return { nums: [1, 3, 4, 2, 2], inputError: e.message }
        }
    }, [numsInput])

    const steps = useMemo(() => generateSteps(nums), [nums])
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useCallback((ex) => {
        setNumsInput(JSON.stringify(ex.nums))
        handleReset()
    }, [handleReset])

    return (
        <div className="fd-shell">
            <div className="fd-top">
                <section className="fd-panel main">
                    <header className="fd-head">
                        <span>Floyd's Cycle Detection</span>
                        {inputError && <span className="fd-error">{inputError}</span>}
                    </header>
                    <div className="fd-body">
                        <div className="fd-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="fd-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <input className="fd-input" value={numsInput} onChange={(e) => { setNumsInput(e.target.value); handleReset() }} />

                        {/* Array visual */}
                        <div className="fd-array-wrap">
                            <div className="fd-indices">
                                {nums.map((_, i) => <span key={i} className="fd-idx">{i}</span>)}
                            </div>
                            <div className="fd-cells">
                                {nums.map((v, i) => {
                                    const isSlow = step?.slow === i
                                    const isFast = step?.fast === i
                                    const isDup = step?.result === v && v === i
                                    return (
                                        <motion.div
                                            key={i}
                                            className={`fd-cell ${isSlow ? 'slow' : ''} ${isFast ? 'fast' : ''} ${isSlow && isFast ? 'both' : ''}`}
                                            animate={isSlow || isFast ? { scale: 1.15 } : { scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                                        >
                                            {v}
                                        </motion.div>
                                    )
                                })}
                            </div>
                            {/* Pointer badges below array */}
                            <div className="fd-pointers">
                                {nums.map((_, i) => {
                                    const isSlow = step?.slow === i
                                    const isFast = step?.fast === i
                                    return (
                                        <div key={i} className="fd-ptr-slot">
                                            {isSlow && <span className="fd-ptr slow-ptr">S</span>}
                                            {isFast && <span className="fd-ptr fast-ptr">F</span>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="fd-phase-badge">
                            {!step?.phase1Done ? 'Phase 1: Find cycle' : 'Phase 2: Find entrance'}
                        </div>
                    </div>
                </section>

                <section className="fd-panel side">
                    <header className="fd-head"><span>Pointers</span></header>
                    <div className="fd-body">
                        <div className="fd-metric"><span className="fd-label">slow</span><strong className="fd-val slow-color">{step?.slow ?? '—'}</strong></div>
                        <div className="fd-metric"><span className="fd-label">fast</span><strong className="fd-val fast-color">{step?.fast ?? '—'}</strong></div>
                        <div className={`fd-result ${step?.phase === 'done' ? 'done' : ''}`}>
                            {step?.phase === 'done' ? `Duplicate: ${step.result}` : 'Searching…'}
                        </div>
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="fd-status">{step?.message || 'Press Play to begin.'}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
            />
        </div>
    )
}
