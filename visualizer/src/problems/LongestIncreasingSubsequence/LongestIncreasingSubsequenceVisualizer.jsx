import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './LongestIncreasingSubsequenceVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def lengthOfLIS(self, nums: List[int]) -> int:' },
    { line: 3, text: '        dp = [1] * len(nums)' },
    { line: 4, text: '' },
    { line: 5, text: '        for i in range(len(nums)):' },
    { line: 6, text: '            for j in range(i):' },
    { line: 7, text: '                if nums[j] < nums[i]:' },
    { line: 8, text: '                    dp[i] = max(dp[i], dp[j] + 1)' },
    { line: 9, text: '' },
    { line: 10, text: '        return max(dp)' },
]

function generateSteps(nums) {
    const steps = []
    const n = nums.length

    if (n === 0) {
        steps.push({ phase: 'done', activeLine: 10, nums, dp: [], i: -1, j: -1, result: 0, message: 'Empty array. Return 0.' })
        return steps
    }

    const dp = Array(n).fill(1)

    steps.push({
        phase: 'init', activeLine: 3, nums, dp: [...dp],
        i: -1, j: -1, result: null,
        message: 'Initialize dp[i] = 1 for all i. Every element is a subsequence of length 1.',
    })

    for (let i = 0; i < n; i++) {
        steps.push({
            phase: 'outer', activeLine: 5, nums, dp: [...dp],
            i, j: -1, result: null,
            message: `Outer loop i=${i}: consider nums[${i}]=${nums[i]} as the ending element.`,
        })

        for (let j = 0; j < i; j++) {
            steps.push({
                phase: 'check', activeLine: 7, nums, dp: [...dp],
                i, j, result: null,
                message: `Compare nums[${j}]=${nums[j]} < nums[${i}]=${nums[i]}? ${nums[j] < nums[i] ? 'Yes → can extend!' : 'No → skip.'}`,
            })

            if (nums[j] < nums[i]) {
                const candidate = dp[j] + 1
                const improved = candidate > dp[i]
                if (improved) dp[i] = candidate

                steps.push({
                    phase: improved ? 'update' : 'no_update', activeLine: 8, nums, dp: [...dp],
                    i, j, result: null, candidate,
                    message: improved
                        ? `dp[${i}] = max(dp[${i}], dp[${j}]+1) = max(${dp[i]}, ${dp[j]}+1) → dp[${i}] = ${dp[i]}.`
                        : `dp[${j}]+1=${candidate} ≤ dp[${i}]=${dp[i]}. No update.`,
                })
            }
        }
    }

    const result = Math.max(...dp)
    steps.push({
        phase: 'done', activeLine: 10, nums, dp: [...dp],
        i: -1, j: -1, result,
        message: `Done! max(dp) = ${result}. Longest increasing subsequence length = ${result}.`,
    })

    return steps
}

const EXAMPLES = [
    { label: 'Classic', nums: [10, 9, 2, 5, 3, 7, 101, 18] },
    { label: 'All same', nums: [1, 1, 1, 1] },
    { label: 'Sorted', nums: [1, 2, 3, 4, 5] },
    { label: 'Reversed', nums: [5, 4, 3, 2, 1] },
    { label: 'LeetCode', nums: [0, 1, 0, 3, 2, 3] },
]

export default function LongestIncreasingSubsequenceVisualizer() {
    const [numsInput, setNumsInput] = useState('[10,9,2,5,3,7,101,18]')
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const { nums, inputError } = useMemo(() => {
        try {
            const n = JSON.parse(numsInput)
            if (!Array.isArray(n)) throw new Error('nums must be an array')
            if (n.length > 12) throw new Error('Max 12 elements for clarity')
            return { nums: n, inputError: '' }
        } catch (e) {
            return { nums: [10, 9, 2, 5, 3, 7, 101, 18], inputError: e.message || 'Invalid input' }
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

    const dp = step?.dp ?? Array(nums.length).fill(1)
    const maxDp = dp.length ? Math.max(...dp) : 1
    const currI = step?.i ?? -1
    const currJ = step?.j ?? -1

    return (
        <div className="lis-shell">
            <section className="lis-panel">
                <header className="lis-head">
                    <span>Longest Increasing Subsequence · O(n²) DP</span>
                    {inputError && <span className="lis-error">{inputError}</span>}
                </header>
                <div className="lis-body">
                    <div className="lis-top-row">
                        <div className="lis-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="lis-chip" onClick={() => applyExample(ex)}>
                                    {ex.label}
                                </button>
                            ))}
                        </div>
                        <input
                            className="lis-input"
                            value={numsInput}
                            onChange={(e) => { setNumsInput(e.target.value); handleReset() }}
                            placeholder="[10,9,2,5,3,7,101,18]"
                        />
                    </div>

                    {/* Array + dp rows */}
                    <div className="lis-arrays">
                        {/* nums row */}
                        <div className="lis-row-label">nums</div>
                        <div className="lis-array-row">
                            {nums.map((val, idx) => {
                                const isI = currI === idx
                                const isJ = currJ === idx
                                const isDone = step?.phase === 'done'
                                const isMax = isDone && dp[idx] === maxDp
                                return (
                                    <div key={idx} className="lis-col">
                                        <motion.div
                                            className={`lis-cell nums-cell${isI ? ' curr-i' : ''}${isJ ? ' curr-j' : ''}${isMax ? ' max-cell' : ''}`}
                                            animate={{ y: isI ? -8 : isJ ? -4 : 0, scale: isI ? 1.12 : 1 }}
                                            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                                        >
                                            {val}
                                        </motion.div>
                                        <span className="lis-idx">{idx}</span>
                                        <div className="lis-ptrs">
                                            {isI && <span className="lis-ptr ptr-i">i</span>}
                                            {isJ && <span className="lis-ptr ptr-j">j</span>}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* dp row */}
                        <div className="lis-row-label">dp</div>
                        <div className="lis-array-row">
                            {dp.map((val, idx) => {
                                const isI = currI === idx
                                const isDone = step?.phase === 'done'
                                const isMax = isDone && val === maxDp
                                return (
                                    <div key={idx} className="lis-col">
                                        <motion.div
                                            className={`lis-cell dp-cell${isI ? ' curr-i' : ''}${isMax ? ' max-dp' : ''}`}
                                            animate={{ scale: isI ? 1.12 : 1 }}
                                            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                                        >
                                            {val}
                                        </motion.div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Comparison box */}
                    {currJ >= 0 && currI >= 0 && (
                        <div className={`lis-cmp-box${nums[currJ] < nums[currI] ? ' match' : ' no-match'}`}>
                            <span>
                                nums[j]={nums[currJ]} {nums[currJ] < nums[currI] ? '<' : '≥'} nums[i]={nums[currI]}
                                {nums[currJ] < nums[currI]
                                    ? <strong> → dp[{currI}] = max(dp[{currI}], dp[{currJ}]+1) = max({dp[currI]}, {dp[currJ]}+1) = {Math.max(dp[currI], dp[currJ] + 1)}</strong>
                                    : ' → skip'}
                            </span>
                        </div>
                    )}

                    {/* Result */}
                    {step?.phase === 'done' && (
                        <motion.div
                            className="lis-result"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            LIS length = {step.result}
                        </motion.div>
                    )}
                </div>
            </section>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />

            <div className={`lis-status${step?.phase === 'done' ? ' done' : ''}`}>
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
