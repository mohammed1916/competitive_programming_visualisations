import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import FloatingPanel from '../../components/shared/FloatingPanel'
import DockableWorkspace from '../../components/shared/DockableWorkspace'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { useAutoScroll } from '../../hooks/useAutoScroll'
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
    const [autoScrollCode, setAutoScrollCode] = useAutoScroll()
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

    const dockPanels = [
        {
            id: 'input',
            title: 'Input Playground',
            subtitle: inputError ? 'Fix the input to resume playback.' : 'Edit the array and replay the solver.',
            defaultZone: 'left',
            content: (
                <div className="hr2-panel-body">
                    <div className="hr2-examples">
                        {EXAMPLES.map((ex) => (
                            <button key={ex.label} className="hr2-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                        ))}
                    </div>
                    <label className="hr2-field">
                        <span>nums array</span>
                        <input
                            className="hr2-input"
                            value={numsInput}
                            onChange={(e) => {
                                setNumsInput(e.target.value)
                                handleReset()
                            }}
                        />
                    </label>
                    {inputError && <div className="hr2-error">{inputError}</div>}
                    <div className="hr2-output-wrap">
                        <div className="hr2-output-label">Input parsed</div>
                        <div className="hr2-output mono">{nums.length > 0 ? `[${nums.join(', ')}]` : '[]'}</div>
                    </div>
                </div>
            ),
        },
        {
            id: 'state',
            title: 'DP State Monitor',
            subtitle: step ? `Step ${stepIndex + 1} of ${steps.length}` : 'Press play to start.',
            defaultZone: 'right',
            content: (
                <div className="hr2-panel-body">
                    <div className="hr2-metrics">
                        <div className="hr2-metric-card">
                            <span>Pass</span>
                            <strong>{step?.pass > 0 ? step.pass : '—'}</strong>
                        </div>
                        <div className="hr2-metric-card">
                            <span>Index</span>
                            <strong>{step?.activeIdx >= 0 ? step.activeIdx : '—'}</strong>
                        </div>
                        <div className="hr2-metric-card">
                            <span>prev2</span>
                            <strong>{step?.prev2 ?? '—'}</strong>
                        </div>
                        <div className="hr2-metric-card">
                            <span>prev1</span>
                            <strong>{step?.prev1 ?? '—'}</strong>
                        </div>
                        <div className="hr2-metric-card">
                            <span>cur</span>
                            <strong className="accent">{step?.cur ?? '—'}</strong>
                        </div>
                    </div>

                    <div className={`hr2-result ${step?.phase === 'done' ? 'done' : ''}`}>
                        {step?.phase === 'done' ? `Final Result = ${step.cur}` : 'Computing…'}
                    </div>

                    <div className="hr2-message-box">
                        <strong>Step Message</strong>
                        <p>{step?.message || 'Press Play to begin.'}</p>
                    </div>
                </div>
            ),
        },
        {
            id: 'viz',
            title: 'DP Array Visualization',
            subtitle: step ? `Active pass: ${step.pass}` : 'Waiting for playback.',
            defaultZone: 'full',
            content: (
                <div className="hr2-panel-body">
                    {renderRow('Pass 1 (skip last)', step?.dp ?? [], step?.activeIdx, step?.pass, 1, nums)}
                    {renderRow('Pass 2 (skip first)', step?.dp2 ?? [], step?.activeIdx, step?.pass, 2, nums)}
                </div>
            ),
        },
        {
            id: 'code',
            title: 'Code Trace',
            subtitle: step ? `Active line ${step.activeLine}` : 'Line-by-line solution view.',
            defaultZone: 'full',
            content: (
                <CodeTracePanel
                    step={step}
                    codeLines={SOLUTION_CODE}
                    onActiveLineDomChange={setActiveLineDom}
                    autoScroll={autoScrollCode}
                />
            ),
        },
    ]

    return (
        <div className="hr2-shell">
            <section className="hr2-hero">
                <div className="hr2-hero-copy">
                    <span className="hr2-kicker">Two-Pass Linear DP</span>
                    <h2>Rob houses in a circle: two passes without the first or last.</h2>
                    <p>
                        This interactive walkthrough shows how House Robber II solves the circular constraint by running the standard 1D algorithm twice: once skipping the last house, once skipping the first, then taking the maximum.
                    </p>
                </div>
                <div className="hr2-summary-grid">
                    <div className="hr2-summary-card">
                        <span>Array length</span>
                        <strong>{nums.length}</strong>
                    </div>
                    <div className="hr2-summary-card">
                        <span>Total steps</span>
                        <strong>{steps.length}</strong>
                    </div>
                    <div className="hr2-summary-card">
                        <span>Current step</span>
                        <strong>{stepIndex >= 0 ? stepIndex + 1 : '—'}</strong>
                    </div>
                </div>
            </section>

            <DockableWorkspace
                title="House Robber II Workspace"
                panels={dockPanels}
                initialLayout={{
                    rows: [
                        ['input', 'state'],
                        ['viz', 'code'],
                    ],
                    minimized: [],
                }}
            />

            <FloatingPanel title="Playback Controls">
                <PlaybackControls
                    onReset={handleReset}
                    onPrev={stepBack}
                    onPlayToggle={togglePlay}
                    onNext={stepForward}
                    resetDisabled={steps.length === 0}
                    prevDisabled={stepIndex <= 0}
                    nextDisabled={steps.length === 0 || isDone}
                    isPlaying={isPlaying}
                    isDone={isDone}
                    speed={speed}
                    onSpeedChange={(event) => setSpeed(Number(event.target.value))}
                    speedIndicator={`${speed}ms`}
                    autoScroll={autoScrollCode}
                    onAutoScrollChange={setAutoScrollCode}
                    autoScrollLabel="Auto-scroll code"
                    showAutoScroll
                    showPatternOverlay={showPatternOverlay}
                    onShowPatternOverlayChange={setShowPatternOverlay}
                    patternOverlayLabel="Show pattern overlay"
                    showPatternOverlayToggle
                />
            </FloatingPanel>

            {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
        </div>
    )
}
