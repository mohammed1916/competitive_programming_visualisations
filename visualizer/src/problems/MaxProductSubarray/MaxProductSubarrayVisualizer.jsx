import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './MaxProductSubarrayVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def maxProduct(self, nums):' },
    { line: 3, text: '        curMax = curMin = res = nums[0]' },
    { line: 4, text: '        for num in nums[1:]:' },
    { line: 5, text: '            candidates = (num, curMax*num, curMin*num)' },
    { line: 6, text: '            curMax = max(candidates)' },
    { line: 7, text: '            curMin = min(candidates)' },
    { line: 8, text: '            res = max(res, curMax)' },
    { line: 9, text: '        return res' },
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
    if (!nums.length) return [{ phase: 'done', activeLine: 9, i: -1, curMax: 0, curMin: 0, res: 0, candidates: [], message: 'Empty array.' }]

    let curMax = nums[0]
    let curMin = nums[0]
    let res = nums[0]

    steps.push({ phase: 'init', activeLine: 3, i: 0, curMax, curMin, res, candidates: [], message: `Init: curMax=curMin=res=${nums[0]}` })

    for (let i = 1; i < nums.length; i++) {
        const num = nums[i]
        const candidates = [num, curMax * num, curMin * num]
        const newMax = Math.max(...candidates)
        const newMin = Math.min(...candidates)
        const newRes = Math.max(res, newMax)

        steps.push({
            phase: 'calc', activeLine: 6, i, curMax: newMax, curMin: newMin, res: newRes,
            candidates, prevMax: curMax, prevMin: curMin,
            message: `i=${i}, num=${num}: candidates=[${candidates.join(', ')}] → curMax=${newMax}, curMin=${newMin}, res=${newRes}`,
        })

        curMax = newMax
        curMin = newMin
        res = newRes
    }

    steps.push({ phase: 'done', activeLine: 9, i: nums.length - 1, curMax, curMin, res, candidates: [], message: `Max product = ${res}` })
    return steps
}

const EXAMPLES = [
    { label: 'Basic', nums: [2, 3, -2, 4] },
    { label: 'Negatives', nums: [-2, 0, -1] },
    { label: 'LeetCode', nums: [2, -5, -2, -4, 3] },
    { label: 'All Neg', nums: [-3, -1, -1] },
]

export default function MaxProductSubarrayVisualizer() {
    const [numsInput, setNumsInput] = useState('[2,3,-2,4]')
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const { nums, inputError } = useMemo(() => {
        try {
            return { nums: parseNums(numsInput), inputError: '' }
        } catch (e) {
            return { nums: [2, 3, -2, 4], inputError: e.message || 'Invalid input' }
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
        <div className="mps-shell">
            <div className="mps-top">
                <section className="mps-panel main">
                    <header className="mps-head">
                        <span>Array & DP Tracking</span>
                        {inputError && <span className="mps-error">{inputError}</span>}
                    </header>
                    <div className="mps-body">
                        <div className="mps-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="mps-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <input className="mps-input" value={numsInput} onChange={(e) => { setNumsInput(e.target.value); handleReset() }} />
                        <div className="mps-array">
                            {nums.map((val, i) => {
                                const isActive = step?.i === i
                                return (
                                    <motion.div
                                        key={i}
                                        className={`mps-cell ${isActive ? 'active' : ''} ${val < 0 ? 'neg' : val === 0 ? 'zero' : 'pos'}`}
                                        animate={isActive ? { y: -8, scale: 1.12 } : { y: 0, scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    >
                                        <span className="mps-idx">{i}</span>
                                        <span className="mps-val">{val}</span>
                                    </motion.div>
                                )
                            })}
                        </div>
                        {step?.candidates?.length > 0 && (
                            <div className="mps-candidates">
                                <span className="mps-label">candidates</span>
                                {step.candidates.map((c, i) => (
                                    <span key={i} className={`mps-cand ${c === step.curMax ? 'hi' : c === step.curMin ? 'lo' : ''}`}>{c}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <section className="mps-panel side">
                    <header className="mps-head"><span>DP State</span></header>
                    <div className="mps-body">
                        <div className="mps-metrics">
                            <div className="mps-metric">
                                <span className="mps-label">curMax</span>
                                <motion.strong key={step?.curMax} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="mps-hi">{step?.curMax ?? '—'}</motion.strong>
                            </div>
                            <div className="mps-metric">
                                <span className="mps-label">curMin</span>
                                <motion.strong key={step?.curMin} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="mps-lo">{step?.curMin ?? '—'}</motion.strong>
                            </div>
                            <div className="mps-metric">
                                <span className="mps-label">result</span>
                                <motion.strong key={step?.res} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="mps-res">{step?.res ?? '—'}</motion.strong>
                            </div>
                        </div>
                        <div className={`mps-result ${step?.phase === 'done' ? 'ok' : ''}`}>
                            {step?.phase === 'done' ? `Answer: ${step.res}` : 'Iterating…'}
                        </div>
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className={`mps-status ${step?.phase === 'done' ? 'ok' : ''}`}>{step?.message || 'Press Play to begin.'}</div>
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
