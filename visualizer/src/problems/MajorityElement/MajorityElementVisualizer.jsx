import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { useCodeVisualConnectivity } from '../../hooks/useCodeVisualConnectivity'
import './MajorityElementVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def majorityElement(self, nums):' },
    { line: 3, text: '        candidate, count = None, 0' },
    { line: 4, text: '        for num in nums:' },
    { line: 5, text: '            if count == 0:' },
    { line: 6, text: '                candidate = num' },
    { line: 7, text: '            if num == candidate:' },
    { line: 8, text: '                count += 1' },
    { line: 9, text: '            else:' },
    { line: 10, text: '                count -= 1' },
    { line: 11, text: '        return candidate' },
]

function parseNums(input) {
    const parsed = JSON.parse(input)
    if (!Array.isArray(parsed)) throw new Error('Input must be an array')
    return parsed.map((n) => {
        const v = Number(n)
        if (Number.isNaN(v)) throw new Error('Values must be numbers')
        return v
    })
}

function generateSteps(nums) {
    const steps = []
    let candidate = null
    let count = 0

    steps.push({ phase: 'init', activeLine: 3, i: -1, candidate, count, action: '', message: 'Initialize candidate=None, count=0.' })

    for (let i = 0; i < nums.length; i++) {
        const num = nums[i]
        if (count === 0) {
            candidate = num
            steps.push({ phase: 'set', activeLine: 6, i, candidate, count, action: 'set', message: `count is 0 → set candidate = ${num}` })
        }
        if (num === candidate) {
            count += 1
            steps.push({ phase: 'vote', activeLine: 8, i, candidate, count, action: 'inc', message: `nums[${i}]=${num} matches candidate → count = ${count}` })
        } else {
            count -= 1
            steps.push({ phase: 'vote', activeLine: 10, i, candidate, count, action: 'dec', message: `nums[${i}]=${num} ≠ candidate → count = ${count}` })
        }
    }

    steps.push({ phase: 'done', activeLine: 11, i: -1, candidate, count, action: 'done', message: `Majority element = ${candidate}` })
    return steps
}

const EXAMPLES = [
    { label: 'Basic', nums: [3, 2, 3] },
    { label: 'LeetCode', nums: [2, 2, 1, 1, 1, 2, 2] },
    { label: 'All Same', nums: [5, 5, 5, 5] },
    { label: 'Longer', nums: [1, 3, 1, 3, 1, 3, 1] },
]

export default function MajorityElementVisualizer() {
    const [numsInput, setNumsInput] = useState('[2,2,1,1,1,2,2]')

    const { nums, inputError } = useMemo(() => {
        try {
            return { nums: parseNums(numsInput), inputError: '' }
        } catch (e) {
            return { nums: [2, 2, 1, 1, 1, 2, 2], inputError: e.message || 'Invalid input' }
        }
    }, [numsInput])

    const steps = useMemo(
        () => generateSteps(nums).map((current) => ({
            ...current,
            relatedLines: current.relatedLines ?? (current.activeLine != null ? [current.activeLine] : []),
        })),
        [nums],
    )
    const { stepIndex, setStepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useCallback((ex) => {
        setNumsInput(JSON.stringify(ex.nums))
        handleReset()
    }, [handleReset])

    const connectivity = useCodeVisualConnectivity({
        steps,
        stepIndex,
        onStepJump: setStepIndex,
    })

    return (
        <div className="me-shell">
            <div className="me-top">
                <section className="me-panel main">
                    <header className="me-head">
                        <span>Boyer-Moore Voting</span>
                        {inputError && <span className="me-error">{inputError}</span>}
                    </header>
                    <div className="me-body">
                        <div className="me-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="me-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <input className="me-input" value={numsInput} onChange={(e) => { setNumsInput(e.target.value); handleReset() }} />
                        <div className="me-array">
                            {nums.map((val, i) => {
                                const isActive = step?.i === i
                                const isCandidate = step?.candidate === val && step?.i !== -1
                                return (
                                    <motion.div
                                        key={i}
                                        className={`me-cell ${isActive ? 'active' : ''} ${step?.phase === 'done' && val === step.candidate ? 'winner' : ''}`}
                                        animate={isActive ? { y: -8, scale: 1.15 } : { y: 0, scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    >
                                        <span className="me-idx">{i}</span>
                                        <span className="me-val">{val}</span>
                                        {isCandidate && step?.i === i && <span className="me-arrow">▲</span>}
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                <section className="me-panel side">
                    <header className="me-head"><span>Vote State</span></header>
                    <div className="me-body">
                        <div className="me-candidate">
                            <span className="me-label">Candidate</span>
                            <motion.div
                                className="me-badge"
                                key={String(step?.candidate)}
                                initial={{ scale: 0.7, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                            >
                                {step?.candidate ?? '—'}
                            </motion.div>
                        </div>
                        <div className="me-count-wrap">
                            <span className="me-label">Count</span>
                            <motion.div
                                className={`me-count ${step?.action === 'inc' ? 'up' : step?.action === 'dec' ? 'down' : ''}`}
                                key={step?.count}
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                            >
                                {step?.count ?? 0}
                            </motion.div>
                        </div>
                        <div className={`me-result ${step?.phase === 'done' ? 'ok' : ''}`}>
                            {step?.phase === 'done' ? `Answer: ${step.candidate}` : 'Running…'}
                        </div>
                    </div>
                </section>
            </div>

            <CodeTracePanel
                step={step}
                codeLines={SOLUTION_CODE}
                highlightedLines={connectivity.highlightedLines}
                onLineSelect={connectivity.handleLineSelect}
            />
            <div className={`me-status ${step?.phase === 'done' ? 'ok' : ''}`}>{step?.message || 'Press Play to begin.'}</div>
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
            />
        </div>
    )
}
