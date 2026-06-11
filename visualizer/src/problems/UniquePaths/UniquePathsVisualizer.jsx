import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DockableWorkspace from '../../components/shared/DockableWorkspace'
import FloatingPanel from '../../components/shared/FloatingPanel'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import { useAutoScroll } from '../../hooks/useAutoScroll'
import './UniquePathsVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def uniquePaths(self, m: int, n: int) -> int:' },
    { line: 3, text: '        dp = [[1] * n for _ in range(m)]' },
    { line: 4, text: '' },
    { line: 5, text: '        for r in range(1, m):' },
    { line: 6, text: '            for c in range(1, n):' },
    { line: 7, text: '                dp[r][c] = dp[r-1][c] + dp[r][c-1]' },
    { line: 8, text: '' },
    { line: 9, text: '        return dp[m-1][n-1]' },
]

function generateSteps(m, n) {
    const steps = []

    // Initialize grid with 1s
    const dp = Array.from({ length: m }, () => Array(n).fill(1))

    steps.push({
        phase: 'init', activeLine: 3,
        dp: dp.map(r => [...r]), r: -1, c: -1, result: null,
        message: `Initialize ${m}×${n} grid. First row and column = 1 (only one path each).`,
    })

    for (let r = 1; r < m; r++) {
        for (let c = 1; c < n; c++) {
            const above = dp[r - 1][c]
            const left = dp[r][c - 1]
            dp[r][c] = above + left

            steps.push({
                phase: 'fill', activeLine: 7,
                dp: dp.map(row => [...row]), r, c, result: null,
                from_above: above, from_left: left,
                message: `dp[${r}][${c}] = dp[${r - 1}][${c}](${above}) + dp[${r}][${c - 1}](${left}) = ${dp[r][c]}.`,
            })
        }
    }

    steps.push({
        phase: 'done', activeLine: 9,
        dp: dp.map(row => [...row]), r: m - 1, c: n - 1, result: dp[m - 1][n - 1],
        message: `dp[${m - 1}][${n - 1}] = ${dp[m - 1][n - 1]}. There are ${dp[m - 1][n - 1]} unique paths.`,
    })

    return steps
}

const EXAMPLES = [
    { label: '3×7', m: 3, n: 7 },
    { label: '3×2', m: 3, n: 2 },
    { label: '2×2', m: 2, n: 2 },
    { label: '4×4', m: 4, n: 4 },
    { label: '5×5', m: 5, n: 5 },
]

function UniquePathsVisualization({ m, n, step, onApplyExample, mInput, nInput, setMInput, setNInput, handleReset }) {
    const dp = step?.dp ?? generateSteps(m, n)[0].dp
    const currR = step?.r ?? -1
    const currC = step?.c ?? -1

    return (
        <section className="up-panel">
            <header className="up-head"><span>Unique Paths · 2D DP</span></header>
            <div className="up-body">
                <div className="up-top-row">
                    <div className="up-examples">
                        {EXAMPLES.map((ex) => (
                            <button key={ex.label} className="up-chip" onClick={() => onApplyExample(ex)}>{ex.label}</button>
                        ))}
                    </div>
                    <div className="up-inputs">
                        <label className="up-input-label">
                            m (rows):
                            <input className="up-input-num" type="number" min={1} max={7} value={mInput}
                                onChange={(e) => { setMInput(Number(e.target.value)); handleReset() }} />
                        </label>
                        <label className="up-input-label">
                            n (cols):
                            <input className="up-input-num" type="number" min={1} max={8} value={nInput}
                                onChange={(e) => { setNInput(Number(e.target.value)); handleReset() }} />
                        </label>
                    </div>
                </div>

                {/* Grid */}
                <div className="up-grid-wrap">
                    <div
                        className="up-grid"
                        style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
                    >
                        {dp.map((row, r) =>
                            row.map((val, c) => {
                                const isCurr = r === currR && c === currC
                                const isAbove = r === currR - 1 && c === currC
                                const isLeft = r === currR && c === currC - 1
                                const isDone = step?.phase === 'done'
                                const isResult = isDone && r === m - 1 && c === n - 1
                                const isEdge = r === 0 || c === 0
                                const isStart = r === 0 && c === 0
                                const isEnd = r === m - 1 && c === n - 1

                                return (
                                    <motion.div
                                        key={`${r}-${c}`}
                                        className={[
                                            'up-cell',
                                            isCurr ? 'curr' : '',
                                            isAbove ? 'above' : '',
                                            isLeft ? 'left' : '',
                                            isResult ? 'result' : '',
                                            isEdge && !isCurr && !isResult ? 'edge' : '',
                                            isStart ? 'start' : '',
                                            isEnd && !isResult ? 'end-cell' : '',
                                        ].filter(Boolean).join(' ')}
                                        animate={{ scale: isCurr || isResult ? 1.08 : 1 }}
                                        transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                                    >
                                        {val}
                                        {isStart && <span className="up-corner-label">S</span>}
                                        {isEnd && <span className="up-corner-label">E</span>}
                                    </motion.div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Source arrows */}
                {currR >= 1 && currC >= 1 && step?.phase === 'fill' && (
                    <div className="up-arrows">
                        <span className="up-arrow above-arrow">↓ from above: {step.from_above}</span>
                        <span className="up-plus">+</span>
                        <span className="up-arrow left-arrow">→ from left: {step.from_left}</span>
                        <span className="up-plus">=</span>
                        <span className="up-arrow curr-arrow">dp[{currR}][{currC}] = {dp[currR][currC]}</span>
                    </div>
                )}

                <AnimatePresence>
                    {step?.phase === 'done' && (
                        <motion.div
                            className="up-result"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            {step.result} unique paths from top-left to bottom-right
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    )
}

export default function UniquePathsVisualizer() {
    const [mInput, setMInput] = useState(3)
    const [nInput, setNInput] = useState(7)

    const [autoScrollCode, setAutoScrollCode] = useAutoScroll()
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const { m, n } = useMemo(() => ({
        m: Math.min(Math.max(1, mInput), 7),
        n: Math.min(Math.max(1, nInput), 8),
    }), [mInput, nInput])

    const steps = useMemo(() => generateSteps(m, n), [m, n])

    const {
        stepIndex, stepForward, stepBack, togglePlay,
        handleReset, isPlaying, speed, setSpeed, isDone,
    } = usePlaybackState(steps.length)

    const step = stepIndex >= 0 ? steps[stepIndex] : null
    const applyExample = useCallback((ex) => {
        setMInput(ex.m); setNInput(ex.n); handleReset()
    }, [handleReset])

    const dockPanels = [
        {
            id: 'code',
            title: 'Code',
            content: <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} autoScroll={autoScrollCode} />,
        },
        {
            id: 'viz',
            title: 'Visualization',
            content: <UniquePathsVisualization m={m} n={n} step={step} onApplyExample={applyExample} mInput={mInput} nInput={nInput} setMInput={setMInput} setNInput={setNInput} handleReset={handleReset} />,
        },
    ]

    return (
        <div className="problem-shell">
            <DockableWorkspace panels={dockPanels} initialLayout={{ rows: [['code', 'viz']], minimized: [] }} />
            <FloatingPanel title="Playback Controls">
                <PlaybackControls
                    isPlaying={isPlaying} isDone={isDone} speed={speed}
                    onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward}
                    onReset={handleReset} prevDisabled={stepIndex < 0}
                    nextDisabled={isDone} resetDisabled={stepIndex < 0}
                    onSpeedChange={(e) => setSpeed(Number(e.target.value))}
                    autoScroll={autoScrollCode} onAutoScrollChange={setAutoScrollCode} showAutoScroll
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
