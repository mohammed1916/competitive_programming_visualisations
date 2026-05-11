import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './ProductOfArrayExceptSelfVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def productExceptSelf(self, nums: List[int]) -> List[int]:' },
    { line: 3, text: '        n = len(nums)' },
    { line: 4, text: '        output = [1] * n' },
    { line: 5, text: '' },
    { line: 6, text: '        # Left pass: output[i] = product of all nums[j] where j < i' },
    { line: 7, text: '        prefix = 1' },
    { line: 8, text: '        for i in range(n):' },
    { line: 9, text: '            output[i] = prefix' },
    { line: 10, text: '            prefix *= nums[i]' },
    { line: 11, text: '' },
    { line: 12, text: '        # Right pass: multiply output[i] by suffix product' },
    { line: 13, text: '        suffix = 1' },
    { line: 14, text: '        for i in range(n - 1, -1, -1):' },
    { line: 15, text: '            output[i] *= suffix' },
    { line: 16, text: '            suffix *= nums[i]' },
    { line: 17, text: '' },
    { line: 18, text: '        return output' },
]

function generateSteps(nums) {
    const steps = []
    const n = nums.length

    if (n < 2) {
        steps.push({
            phase: 'done', activeLine: 18, nums, output: [...nums],
            prefix: 1, suffix: 1, activeIdx: -1,
            message: 'Need at least 2 elements.',
        })
        return steps
    }

    const output = Array(n).fill(1)

    steps.push({
        phase: 'init', activeLine: 4, nums, output: [...output],
        prefix: 1, suffix: 1, activeIdx: -1, pass: 'none',
        message: 'Initialize output array with all 1s.',
    })

    // Left pass
    let prefix = 1
    steps.push({
        phase: 'left_start', activeLine: 7, nums, output: [...output],
        prefix, suffix: 1, activeIdx: -1, pass: 'left',
        message: 'Left pass: prefix = 1. Will sweep left → right.',
    })

    for (let i = 0; i < n; i++) {
        output[i] = prefix

        steps.push({
            phase: 'left_assign', activeLine: 9, nums, output: [...output],
            prefix, suffix: 1, activeIdx: i, pass: 'left',
            message: `output[${i}] = prefix = ${prefix}. (Product of all elements left of index ${i}.)`,
        })

        prefix *= nums[i]

        steps.push({
            phase: 'left_update', activeLine: 10, nums, output: [...output],
            prefix, suffix: 1, activeIdx: i, pass: 'left',
            message: `prefix *= nums[${i}] (${nums[i]}) → prefix = ${prefix}.`,
        })
    }

    // Right pass
    let suffix = 1
    steps.push({
        phase: 'right_start', activeLine: 13, nums, output: [...output],
        prefix, suffix, activeIdx: -1, pass: 'right',
        message: 'Right pass: suffix = 1. Will sweep right → left.',
    })

    for (let i = n - 1; i >= 0; i--) {
        output[i] *= suffix

        steps.push({
            phase: 'right_assign', activeLine: 15, nums, output: [...output],
            prefix, suffix, activeIdx: i, pass: 'right',
            message: `output[${i}] *= suffix (${suffix}) → output[${i}] = ${output[i]}. (Now = left product × right product.)`,
        })

        suffix *= nums[i]

        steps.push({
            phase: 'right_update', activeLine: 16, nums, output: [...output],
            prefix, suffix, activeIdx: i, pass: 'right',
            message: `suffix *= nums[${i}] (${nums[i]}) → suffix = ${suffix}.`,
        })
    }

    steps.push({
        phase: 'done', activeLine: 18, nums, output: [...output],
        prefix, suffix, activeIdx: -1, pass: 'done',
        message: `Done! output = [${output.join(', ')}].`,
    })

    return steps
}

const EXAMPLES = [
    { label: 'Classic', nums: [1, 2, 3, 4] },
    { label: 'With Zero', nums: [1, 0, 3, 4] },
    { label: 'Two Zeros', nums: [0, 0, 1, 2] },
    { label: 'Negatives', nums: [-1, 2, -3, 4] },
]

export default function ProductOfArrayExceptSelfVisualizer() {
    const [numsInput, setNumsInput] = useState('[1,2,3,4]')

    const { nums, inputError } = useMemo(() => {
        try {
            const n = JSON.parse(numsInput)
            if (!Array.isArray(n)) throw new Error('nums must be an array')
            if (n.length > 10) throw new Error('Max 10 elements for clarity')
            if (n.length < 2) throw new Error('Need at least 2 elements')
            return { nums: n, inputError: '' }
        } catch (e) {
            return { nums: [1, 2, 3, 4], inputError: e.message || 'Invalid input' }
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
    const displayOutput = step?.output ?? Array(nums.length).fill(1)

    return (
        <div className="poaes-shell">
            <section className="poaes-panel">
                <header className="poaes-head">
                    <span>Product of Array Except Self · Prefix × Suffix</span>
                    {inputError && <span className="poaes-error">{inputError}</span>}
                </header>
                <div className="poaes-body">
                    <div className="poaes-row-top">
                        <div className="poaes-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="poaes-chip" onClick={() => applyExample(ex)}>
                                    {ex.label}
                                </button>
                            ))}
                        </div>
                        <input
                            className="poaes-input"
                            value={numsInput}
                            onChange={(e) => { setNumsInput(e.target.value); handleReset() }}
                            placeholder="[1,2,3,4]"
                        />
                    </div>

                    {/* Pass indicator */}
                    <div className="poaes-pass-bar">
                        <span className={`poaes-pass-badge${step?.pass === 'left' ? ' active-left' : ''}`}>
                            ← Left pass (prefix)
                        </span>
                        <span className={`poaes-pass-badge${step?.pass === 'right' ? ' active-right' : ''}`}>
                            Right pass (suffix) →
                        </span>
                        <div className="poaes-accum">
                            <span className="poaes-accum-label">prefix</span>
                            <span className="poaes-accum-val mono">{step?.prefix ?? 1}</span>
                            <span className="poaes-accum-sep" />
                            <span className="poaes-accum-label">suffix</span>
                            <span className="poaes-accum-val mono">{step?.suffix ?? 1}</span>
                        </div>
                    </div>

                    {/* Input row */}
                    <div className="poaes-array-wrap">
                        <span className="poaes-row-label">nums</span>
                        <div className="poaes-array">
                            {displayNums.map((val, idx) => {
                                const isActive = step?.activeIdx === idx
                                return (
                                    <div key={idx} className="poaes-cell-col">
                                        <motion.div
                                            className={`poaes-cell input-cell${isActive ? ' active' : ''}`}
                                            animate={{ scale: isActive ? 1.1 : 1 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                        >
                                            {val}
                                        </motion.div>
                                        <span className="poaes-idx">[{idx}]</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Output row */}
                    <div className="poaes-array-wrap">
                        <span className="poaes-row-label">output</span>
                        <div className="poaes-array">
                            {displayOutput.map((val, idx) => {
                                const isActive = step?.activeIdx === idx
                                const isDoneAll = step?.pass === 'done'
                                return (
                                    <div key={idx} className="poaes-cell-col">
                                        <motion.div
                                            className={`poaes-cell output-cell${isActive ? ' active' : ''}${isDoneAll ? ' final' : ''}`}
                                            animate={{ scale: isActive ? 1.1 : 1 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                        >
                                            {val}
                                        </motion.div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Equation explainer for active index */}
                    {step?.activeIdx != null && step.activeIdx >= 0 && step.pass !== 'done' && (
                        <div className="poaes-eq-box">
                            {step.pass === 'left'
                                ? <span>output[{step.activeIdx}] = <span className="eq-prefix">prefix</span> = product of elements <strong>before</strong> index {step.activeIdx}</span>
                                : <span>output[{step.activeIdx}] *= <span className="eq-suffix">suffix</span> = product of elements <strong>after</strong> index {step.activeIdx}</span>
                            }
                        </div>
                    )}
                </div>
            </section>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />

            <div className={`poaes-status${step?.phase === 'done' ? ' done' : ''}`}>
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
            />
        </div>
    )
}
