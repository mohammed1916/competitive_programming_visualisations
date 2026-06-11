import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './JumpGameVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def canJump(self, nums: List[int]) -> bool:' },
    { line: 3, text: '        maxReach = 0' },
    { line: 4, text: '        for i in range(len(nums)):' },
    { line: 5, text: '            if i > maxReach:' },
    { line: 6, text: '                return False  # stuck' },
    { line: 7, text: '            maxReach = max(maxReach, i + nums[i])' },
    { line: 8, text: '        return True' },
]

function generateSteps(nums) {
    const steps = []
    const n = nums.length

    if (n === 0) {
        steps.push({ phase: 'done', activeLine: 8, nums: [], i: -1, maxReach: 0, result: true, message: 'Empty array. Return True.' })
        return steps
    }

    let maxReach = 0

    steps.push({
        phase: 'init', activeLine: 3,
        nums, i: -1, maxReach,
        result: null,
        message: 'Initialize maxReach = 0. This tracks the furthest index reachable so far.',
    })

    for (let i = 0; i < n; i++) {
        steps.push({
            phase: 'check', activeLine: 5,
            nums, i, maxReach,
            result: null,
            message: `i=${i}: is ${i} > maxReach (${maxReach})? ${i > maxReach ? 'Yes → stuck!' : 'No → can reach.'}`,
        })

        if (i > maxReach) {
            steps.push({
                phase: 'stuck', activeLine: 6,
                nums, i, maxReach,
                result: false,
                message: `Index ${i} is beyond maxReach (${maxReach}). We cannot reach it. Return False.`,
            })
            return steps
        }

        const newMax = Math.max(maxReach, i + nums[i])

        steps.push({
            phase: 'update', activeLine: 7,
            nums, i, maxReach: newMax,
            result: null,
            message: `maxReach = max(${maxReach}, ${i} + ${nums[i]}) = max(${maxReach}, ${i + nums[i]}) = ${newMax}.`,
        })

        maxReach = newMax
    }

    steps.push({
        phase: 'done', activeLine: 8,
        nums, i: n, maxReach,
        result: true,
        message: `Scanned all ${n} indices without getting stuck. Return True!`,
    })

    return steps
}

const EXAMPLES = [
    { label: 'Reachable', nums: [2, 3, 1, 1, 4] },
    { label: 'Stuck', nums: [3, 2, 1, 0, 4] },
    { label: 'Single', nums: [0] },
    { label: 'Big jumps', nums: [5, 0, 0, 0, 0, 1] },
    { label: 'Tight', nums: [1, 1, 1, 1, 0] },
]

export default function JumpGameVisualizer() {
    const [numsInput, setNumsInput] = useState('[2,3,1,1,4]')
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const { nums, inputError } = useMemo(() => {
        try {
            const n = JSON.parse(numsInput)
            if (!Array.isArray(n)) throw new Error('nums must be an array')
            if (n.length > 14) throw new Error('Max 14 elements for clarity')
            return { nums: n, inputError: '' }
        } catch (e) {
            return { nums: [2, 3, 1, 1, 4], inputError: e.message || 'Invalid input' }
        }
    }, [numsInput])

    const steps = useMemo(() => generateSteps(nums), [nums])

    const {
        stepIndex, stepForward, stepBack, togglePlay,
        handleReset, isPlaying, speed, setSpeed, isDone,
    } = usePlaybackState(steps.length)

    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useCallback((ex) => {
        setNumsInput(JSON.stringify(ex.nums))
        handleReset()
    }, [handleReset])

    const displayNums = step?.nums ?? nums
    const maxReach = step?.maxReach ?? 0
    const currI = step?.i ?? -1

    return (
        <div className="jg-shell">
            <section className="jg-panel">
                <header className="jg-head">
                    <span>Jump Game · Greedy Reach Tracking</span>
                    {inputError && <span className="jg-error">{inputError}</span>}
                </header>
                <div className="jg-body">
                    <div className="jg-top-row">
                        <div className="jg-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="jg-chip" onClick={() => applyExample(ex)}>
                                    {ex.label}
                                </button>
                            ))}
                        </div>
                        <input
                            className="jg-input"
                            value={numsInput}
                            onChange={(e) => { setNumsInput(e.target.value); handleReset() }}
                            placeholder="[2,3,1,1,4]"
                        />
                    </div>

                    {/* maxReach indicator */}
                    <div className="jg-reach-bar">
                        <span className="jg-reach-label">maxReach</span>
                        <span className="jg-reach-val mono">{maxReach}</span>
                        {step?.result === false && <span className="jg-badge stuck">STUCK ✗</span>}
                        {step?.result === true && <span className="jg-badge success">REACHABLE ✓</span>}
                    </div>

                    {/* Array */}
                    <div className="jg-array">
                        {displayNums.map((val, idx) => {
                            const isCurr = currI === idx
                            const isReachable = idx <= maxReach
                            const isStuck = step?.phase === 'stuck' && idx === currI
                            const isBeyond = idx > maxReach && idx <= currI
                            const isDoneAll = step?.result === true

                            return (
                                <div key={idx} className="jg-cell-wrap">
                                    {/* Jump arc above the cell */}
                                    {isCurr && val > 0 && (
                                        <div className="jg-jump-arc" style={{ width: `${val * 72}px` }} />
                                    )}
                                    <motion.div
                                        className={`jg-cell${isCurr ? ' curr' : ''}${isStuck ? ' stuck-cell' : ''}${isReachable && !isCurr ? ' reachable' : ''}${isDoneAll ? ' success-cell' : ''}`}
                                        animate={{ y: isCurr ? -8 : 0, scale: isCurr ? 1.12 : 1 }}
                                        transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                                    >
                                        <span className="jg-val">{val}</span>
                                    </motion.div>
                                    <span className="jg-idx">{idx}</span>
                                    {isCurr && <span className="jg-ptr">i</span>}
                                    {idx === maxReach && maxReach > 0 && !isCurr && (
                                        <span className="jg-reach-ptr">max</span>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Reachable zone label */}
                    <div className="jg-zone-legend">
                        <span className="jg-zone-dot reachable" />
                        <span>Reachable (index ≤ maxReach)</span>
                        <span className="jg-zone-dot curr-dot" />
                        <span>Current index i</span>
                    </div>
                </div>
            </section>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />

            <div className={`jg-status${step?.result === true ? ' ok' : step?.result === false ? ' fail' : ''}`}>
                {step?.message ?? 'Press Play or Step to begin.'}
            </div>

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
                showPatternOverlay={showPatternOverlay}
                onShowPatternOverlayChange={setShowPatternOverlay}
                patternOverlayLabel="Show pattern overlay"
                showPatternOverlayToggle
            />

            {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
        </div>
    )
}
