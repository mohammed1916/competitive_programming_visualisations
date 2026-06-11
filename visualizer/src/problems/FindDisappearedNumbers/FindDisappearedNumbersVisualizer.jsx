import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './FindDisappearedNumbersVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'def findDisappearedNumbers(nums):' },
    { line: 2, text: '    for num in nums:' },
    { line: 3, text: '        idx = abs(num) - 1' },
    { line: 4, text: '        nums[idx] = -abs(nums[idx])' },
    { line: 5, text: '    result = []' },
    { line: 6, text: '    for i in range(len(nums)):' },
    { line: 7, text: '        if nums[i] > 0:' },
    { line: 8, text: '            result.append(i + 1)' },
    { line: 9, text: '    return result' },
]

const EXAMPLES = [
    { label: '[4,3,2,7,8,2,3,1]', input: [4, 3, 2, 7, 8, 2, 3, 1] },
    { label: '[1,1]', input: [1, 1] },
]

function generateSteps(input) {
    const steps = []
    const nums = [...input]
    const n = nums.length

    steps.push({
        activeLine: 1,
        message: `Start: nums = [${nums.join(', ')}]`,
        nums: [...nums],
        phase: 'init',
        currentIdx: -1,
        targetIdx: -1,
        result: [],
    })

    // Phase 1: Mark visited indices
    for (let i = 0; i < n; i++) {
        const val = nums[i]
        const idx = Math.abs(val) - 1

        steps.push({
            activeLine: 2,
            message: `Process nums[${i}] = ${val}`,
            nums: [...nums],
            phase: 'mark-start',
            currentIdx: i,
            targetIdx: -1,
            result: [],
        })

        steps.push({
            activeLine: 3,
            message: `idx = abs(${val}) - 1 = ${idx}`,
            nums: [...nums],
            phase: 'mark-calc',
            currentIdx: i,
            targetIdx: idx,
            result: [],
        })

        steps.push({
            activeLine: 4,
            message: `Negate nums[${idx}]: ${nums[idx]} → ${-Math.abs(nums[idx])}`,
            nums: [...nums],
            phase: 'mark-negate',
            currentIdx: i,
            targetIdx: idx,
            result: [],
        })

        nums[idx] = -Math.abs(nums[idx])

        steps.push({
            activeLine: 4,
            message: `Marked: nums = [${nums.map((x) => (x < 0 ? x : x)).join(', ')}]`,
            nums: [...nums],
            phase: 'mark-done',
            currentIdx: i,
            targetIdx: idx,
            result: [],
        })
    }

    // Phase 2: Find positives
    const result = []

    steps.push({
        activeLine: 5,
        message: 'Phase 2: Scan for positive values',
        nums: [...nums],
        phase: 'scan-init',
        currentIdx: -1,
        targetIdx: -1,
        result: [],
    })

    for (let i = 0; i < n; i++) {
        steps.push({
            activeLine: 6,
            message: `Check nums[${i}] = ${nums[i]}`,
            nums: [...nums],
            phase: 'scan-check',
            currentIdx: i,
            targetIdx: -1,
            result: [...result],
        })

        if (nums[i] > 0) {
            result.push(i + 1)
            steps.push({
                activeLine: 8,
                message: `nums[${i}] > 0: Missing number ${i + 1}`,
                nums: [...nums],
                phase: 'scan-found',
                currentIdx: i,
                targetIdx: -1,
                result: [...result],
            })
        }
    }

    steps.push({
        activeLine: 9,
        message: `Result: [${result.join(', ')}]`,
        nums: [...nums],
        phase: 'done',
        currentIdx: -1,
        targetIdx: -1,
        result,
    })

    return steps
}

const EXAMPLES_OBJ = [
    { label: '[4,3,2,7,8,2,3,1]', input: [4, 3, 2, 7, 8, 2, 3, 1] },
    { label: '[1,1]', input: [1, 1] },
]

export default function FindDisappearedNumbersVisualizer() {
    const [input, setInput] = useState([4, 3, 2, 7, 8, 2, 3, 1])
    const steps = useMemo(() => generateSteps(input), [input])
    const { currentStep, isPlaying, setCurrentStep, setIsPlaying } = usePlaybackState(steps.length)
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const handleExample = useCallback((ex) => {
        setInput(ex.input)
        setCurrentStep(0)
    }, [setCurrentStep])

    if (steps.length === 0) return null

    const step = steps[currentStep]

    return (
        <div className="fdn-shell">
            <div className="fdn-top">
                <div className="fdn-panel fdn-panel-input">
                    <div className="fdn-head">Input</div>
                    <div className="fdn-body">
                        <div className="fdn-examples">
                            {EXAMPLES_OBJ.map((ex) => (
                                <button key={ex.label} className="fdn-chip" onClick={() => handleExample(ex)}>
                                    {ex.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="fdn-panel fdn-panel-stats">
                    <div className="fdn-head">Info</div>
                    <div className="fdn-body">
                        <div className="fdn-metric">
                            <span className="fdn-label">Array Size</span>
                            <span className="fdn-val">{step.nums.length}</span>
                        </div>
                        <div className="fdn-metric">
                            <span className="fdn-label">Missing Count</span>
                            <span className="fdn-val">{step.result.length}</span>
                        </div>
                        <div className="fdn-legend">
                            <div className="fdn-legend-item">
                                <span className="fdn-dot positive"></span> Positive
                            </div>
                            <div className="fdn-legend-item">
                                <span className="fdn-dot negative"></span> Negative
                            </div>
                            <div className="fdn-legend-item">
                                <span className="fdn-dot marked"></span> Marked
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fdn-panel fdn-panel-main">
                <div className="fdn-head">Array Cells</div>
                <div className="fdn-array-container">
                    <div className="fdn-array">
                        {step.nums.map((val, idx) => {
                            const isTarget = idx === step.targetIdx
                            const isCurrent = idx === step.currentIdx
                            const isNegative = val < 0
                            const isPositive = val > 0

                            return (
                                <motion.div
                                    key={idx}
                                    className={`fdn-cell ${isNegative ? 'negative' : ''} ${isTarget ? 'target' : ''} ${isCurrent ? 'current' : ''}`}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <div className="fdn-cell-val">{val}</div>
                                    <div className="fdn-cell-idx">{idx}</div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="fdn-panel fdn-panel-result">
                <div className="fdn-head">Missing Numbers</div>
                <div className="fdn-body">
                    <div className="fdn-result-display">
                        {step.result.length === 0 ? (
                            <span className="fdn-result-empty">[ ]</span>
                        ) : (
                            step.result.map((num) => (
                                <motion.div
                                    key={num}
                                    className="fdn-result-chip"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                >
                                    {num}
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <CodeTracePanel code={SOLUTION_CODE} activeLine={step.activeLine} onActiveLineDomChange={setActiveLineDom} />

            <div className="fdn-panel">
                <div className="fdn-head">Status</div>
                <div className="fdn-status">{step.message}</div>
            </div>

            <PlaybackControls
              currentStep={currentStep}
              totalSteps={steps.length}
              onStepChange={setCurrentStep}
              isPlaying={isPlaying}
              onPlayingChange={setIsPlaying}
              showPatternOverlay={showPatternOverlay}
              onShowPatternOverlayChange={setShowPatternOverlay}
              patternOverlayLabel="Show pattern overlay"
              showPatternOverlayToggle
            />

            {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
        </div>
    )
}
