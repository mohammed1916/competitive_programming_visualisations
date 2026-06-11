import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './HouseRobberIIVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'def rob(nums):' },
    { line: 2, text: '    def rob_range(lo, hi):' },
    { line: 3, text: '        prev2 = prev1 = 0' },
    { line: 4, text: '        for i in range(lo, hi):' },
    { line: 5, text: '            cur = max(prev1, prev2 + nums[i])' },
    { line: 6, text: '            prev2, prev1 = prev1, cur' },
    { line: 7, text: '        return prev1' },
    { line: 8, text: '    if len(nums) == 1: return nums[0]' },
    { line: 9, text: '    return max(rob_range(0, n-1), rob_range(1, n))' },
]

function robRange(nums, lo, hi) {
    const steps = []
    let prev2 = 0, prev1 = 0
    steps.push({ i: lo - 1, prev2, prev1, cur: null, phase: 'init' })
    for (let i = lo; i < hi; i++) {
        const cur = Math.max(prev1, prev2 + nums[i])
        steps.push({ i, prev2, prev1, cur, phase: 'pick' })
        prev2 = prev1
        prev1 = cur
        steps.push({ i, prev2, prev1, cur, phase: 'shift' })
    }
    return { result: prev1, steps }
}

function generateSteps(nums) {
    const n = nums.length
    const allSteps = []

    if (n === 0) return [{ phase: 'done', activeLine: 1, pass: 0, activeIdx: -1, dp: [], dp2: [], result: 0, message: 'Empty array' }]
    if (n === 1) return [{ phase: 'done', activeLine: 8, pass: 0, activeIdx: -1, dp: [nums[0]], dp2: [], result: nums[0], message: `Single house → ${nums[0]}` }]

    const { result: res1, steps: steps1 } = robRange(nums, 0, n - 1)
    const { result: res2, steps: steps2 } = robRange(nums, 1, n)

    const dpFull1 = Array(n).fill(null)
    const dpFull2 = Array(n).fill(null)

    for (const s of steps1) {
        if (s.phase === 'shift' && s.i >= 0) dpFull1[s.i] = s.cur
        allSteps.push({
            phase: s.phase, activeLine: s.phase === 'init' ? 3 : s.phase === 'pick' ? 5 : 6,
            pass: 1, activeIdx: s.i, dp: [...dpFull1], dp2: [...dpFull2],
            prev2: s.prev2, prev1: s.prev1, cur: s.cur,
            message: s.phase === 'init'
                ? `Pass 1 (indices 0..${n - 2}): skip last house`
                : s.phase === 'pick'
                    ? `Pass 1 idx ${s.i}: max(${s.prev1}, ${s.prev2} + ${nums[s.i]}) = ${s.cur}`
                    : `Shift: prev2=${s.prev2} prev1=${s.prev1}`,
        })
    }

    allSteps.push({
        phase: 'pass1-done', activeLine: 7, pass: 1,
        activeIdx: -1, dp: [...dpFull1], dp2: [...dpFull2],
        prev2: 0, prev1: res1, cur: res1,
        message: `Pass 1 result = ${res1}`,
    })

    for (const s of steps2) {
        if (s.phase === 'shift' && s.i >= 1) dpFull2[s.i] = s.cur
        allSteps.push({
            phase: s.phase, activeLine: s.phase === 'init' ? 3 : s.phase === 'pick' ? 5 : 6,
            pass: 2, activeIdx: s.i, dp: [...dpFull1], dp2: [...dpFull2],
            prev2: s.prev2, prev1: s.prev1, cur: s.cur,
            message: s.phase === 'init'
                ? `Pass 2 (indices 1..${n - 1}): skip first house`
                : s.phase === 'pick'
                    ? `Pass 2 idx ${s.i}: max(${s.prev1}, ${s.prev2} + ${nums[s.i]}) = ${s.cur}`
                    : `Shift: prev2=${s.prev2} prev1=${s.prev1}`,
        })
    }

    const result = Math.max(res1, res2)
    allSteps.push({
        phase: 'done', activeLine: 9,
        pass: 0, activeIdx: -1, dp: [...dpFull1], dp2: [...dpFull2],
        prev2: 0, prev1: 0, cur: result,
        message: `Result = max(${res1}, ${res2}) = ${result}`,
    })

    return allSteps
}

const EXAMPLES = [
    { label: 'LeetCode', nums: [2, 3, 2] },
    { label: 'Example 2', nums: [1, 2, 3, 1] },
    { label: 'All Same', nums: [5, 5, 5, 5, 5] },
    { label: 'Long', nums: [1, 2, 3, 4, 5, 6, 7] },
]

export default function HouseRobberIIVisualizer() {
    const [numsInput, setNumsInput] = useState('[2,3,2]')
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const { nums, inputError } = useMemo(() => {
        try {
            const parsed = JSON.parse(numsInput)
            if (!Array.isArray(parsed)) throw new Error('Must be an array')
            return { nums: parsed.map(Number), inputError: '' }
        } catch (e) {
            return { nums: [2, 3, 2], inputError: e.message }
        }
    }, [numsInput])

    const steps = useMemo(() => generateSteps(nums), [nums])
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useCallback((ex) => {
        setNumsInput(JSON.stringify(ex.nums))
        handleReset()
    }, [handleReset])

    const renderRow = (label, dp, activeIdx, pass, targetPass, nums) => (
        <div className="hr2-row">
            <span className="hr2-row-label">{label}</span>
            <div className="hr2-cells">
                {nums.map((v, i) => {
                    const isActive = step?.pass === targetPass && step?.activeIdx === i
                    const hasVal = dp[i] !== null && dp[i] !== undefined
                    return (
                        <div key={i} className={`hr2-house ${isActive ? 'active' : ''} ${step?.pass !== targetPass ? 'dim' : ''}`}>
                            <motion.div
                                className={`hr2-cell ${isActive ? 'active' : ''}`}
                                animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                            >
                                {v}
                            </motion.div>
                            <div className={`hr2-dp-val ${hasVal ? 'filled' : ''}`}>{hasVal ? dp[i] : ''}</div>
                        </div>
                    )
                })}
            </div>
        </div>
    )

    return (
        <div className="hr2-shell">
            <div className="hr2-top">
                <section className="hr2-panel main">
                    <header className="hr2-head">
                        <span>Two-Pass Linear DP</span>
                        {inputError && <span className="hr2-error">{inputError}</span>}
                    </header>
                    <div className="hr2-body">
                        <div className="hr2-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="hr2-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <input className="hr2-input" value={numsInput} onChange={(e) => { setNumsInput(e.target.value); handleReset() }} />
                        {renderRow('Pass 1 (skip last)', step?.dp ?? [], step?.activeIdx, step?.pass, 1, nums)}
                        {renderRow('Pass 2 (skip first)', step?.dp2 ?? [], step?.activeIdx, step?.pass, 2, nums)}
                    </div>
                </section>

                <section className="hr2-panel side">
                    <header className="hr2-head"><span>DP State</span></header>
                    <div className="hr2-body">
                        <div className="hr2-metric"><span className="hr2-label">pass</span><strong className="hr2-val">{step?.pass > 0 ? step.pass : '—'}</strong></div>
                        <div className="hr2-metric"><span className="hr2-label">prev2</span><strong className="hr2-val">{step?.prev2 ?? '—'}</strong></div>
                        <div className="hr2-metric"><span className="hr2-label">prev1</span><strong className="hr2-val">{step?.prev1 ?? '—'}</strong></div>
                        <div className="hr2-metric"><span className="hr2-label">cur</span><strong className="hr2-val accent">{step?.cur ?? '—'}</strong></div>
                        <div className={`hr2-result ${step?.phase === 'done' ? 'done' : ''}`}>
                            {step?.phase === 'done' ? `Max = ${step.cur}` : 'Running…'}
                        </div>
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className="hr2-status">{step?.message || 'Press Play to begin.'}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
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
