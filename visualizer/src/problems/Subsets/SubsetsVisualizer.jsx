import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import DockableWorkspace from '../../components/shared/DockableWorkspace'
import FloatingPanel from '../../components/shared/FloatingPanel'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import { useAutoScroll } from '../../hooks/useAutoScroll'
import './SubsetsVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'def subsets(nums):' },
    { line: 2, text: '    res = []' },
    { line: 3, text: '    def backtrack(start, path):' },
    { line: 4, text: '        res.append(path[:])' },
    { line: 5, text: '        for i in range(start, len(nums)):' },
    { line: 6, text: '            path.append(nums[i])' },
    { line: 7, text: '            backtrack(i + 1, path)' },
    { line: 8, text: '            path.pop()' },
    { line: 9, text: '    backtrack(0, [])' },
    { line: 10, text: '    return res' },
]

function generateSteps(nums) {
    const steps = []
    const res = []

    function backtrack(start, path) {
        res.push([...path])
        steps.push({
            phase: 'record', activeLine: 4,
            path: [...path], start, res: res.map((r) => [...r]),
            message: `Record subset [${path.join(', ')}]`,
        })

        for (let i = start; i < nums.length; i++) {
            path.push(nums[i])
            steps.push({
                phase: 'choose', activeLine: 6,
                path: [...path], start: i, res: res.map((r) => [...r]),
                message: `Choose nums[${i}]=${nums[i]}, path=[${path.join(', ')}]`,
            })

            steps.push({
                phase: 'recurse', activeLine: 7,
                path: [...path], start: i + 1, res: res.map((r) => [...r]),
                message: `Recurse with start=${i + 1}`,
            })

            backtrack(i + 1, path)

            path.pop()
            steps.push({
                phase: 'unchoose', activeLine: 8,
                path: [...path], start: i, res: res.map((r) => [...r]),
                message: `Unchoose nums[${i}]=${nums[i]}, path=[${path.join(', ')}]`,
            })
        }
    }

    steps.push({
        phase: 'init', activeLine: 9,
        path: [], start: 0, res: [],
        message: 'Start backtracking from index 0',
    })

    backtrack(0, [])

    steps.push({
        phase: 'done', activeLine: 10,
        path: [], start: nums.length, res: res.map((r) => [...r]),
        message: `Done. ${res.length} subsets found.`,
    })

    return steps
}

const EXAMPLES = [
    { label: '[1,2,3]', nums: [1, 2, 3] },
    { label: '[0]', nums: [0] },
    { label: '[1,2]', nums: [1, 2] },
    { label: '[1,2,3,4]', nums: [1, 2, 3, 4] },
]

export default function SubsetsVisualizer() {
    const [numsInput, setNumsInput] = useState('[1,2,3]')

    const { nums, inputError } = useMemo(() => {
        try {
            const parsed = JSON.parse(numsInput)
            if (!Array.isArray(parsed)) throw new Error('Must be array')
            return { nums: parsed.map(Number).slice(0, 6), inputError: '' }
        } catch (e) {
            return { nums: [1, 2, 3], inputError: e.message }
        }
    }, [numsInput])

    const steps = useMemo(() => generateSteps(nums), [nums])
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
    const step = stepIndex >= 0 ? steps[stepIndex] : null
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()
    const [autoScrollCode, setAutoScrollCode] = useAutoScroll()

    const applyExample = useCallback((ex) => {
        setNumsInput(JSON.stringify(ex.nums))
        handleReset()
    }, [handleReset])

    // Visualization component
    const SubsetsVizComponent = () => (
        <section className="sub-panel main">
            <header className="sub-head">
                <span>Backtracking (include / skip each element)</span>
                {inputError && <span className="sub-error">{inputError}</span>}
            </header>
            <div className="sub-body">
                <div className="sub-examples">
                    {EXAMPLES.map((ex) => (
                        <button key={ex.label} className="sub-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                    ))}
                </div>
                <input className="sub-input" value={numsInput} onChange={(e) => { setNumsInput(e.target.value); handleReset() }} />

                {/* Current path */}
                <div className="sub-section-label">Current path</div>
                <div className="sub-path-row">
                    <span className="sub-bracket">[</span>
                    <AnimatePresence mode="popLayout">
                        {(step?.path ?? []).map((v, i) => (
                            <motion.div key={`${i}-${v}`} className="sub-path-cell"
                                initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 24 }}>
                                {v}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <span className="sub-bracket">]</span>
                </div>

                {/* Input nums with selection highlight */}
                <div className="sub-section-label">Input array</div>
                <div className="sub-nums-row">
                    {nums.map((v, i) => {
                        const inPath = step?.path?.includes(v) // rough approximation
                        const isStart = step?.start === i
                        const isPast = step?.path?.length > 0 && i < (step?.start ?? nums.length)
                        return (
                            <div key={i} className={`sub-num-cell ${isStart ? 'start' : ''} ${isPast ? 'past' : ''}`}>
                                <span className="sub-num-val">{v}</span>
                                <span className="sub-num-idx">{i}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )

    const ResultsComponent = () => (
        <section className="sub-panel side">
            <header className="sub-head"><span>Results ({step?.res?.length ?? 0})</span></header>
            <div className="sub-body">
                <div className="sub-res-list">
                    <AnimatePresence mode="popLayout">
                        {(step?.res ?? []).map((subset, i) => (
                            <motion.div key={i} className={`sub-res-item ${i === (step?.res?.length ?? 0) - 1 && step?.phase === 'record' ? 'latest' : ''}`}
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}>
                                [{subset.join(', ')}]
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    )

    const dockPanels = [
        {
            id: 'viz',
            title: 'Visualization',
            content: <SubsetsVizComponent />,
        },
        {
            id: 'results',
            title: 'Results',
            content: <ResultsComponent />,
        },
        {
            id: 'code',
            title: 'Code',
            content: <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} autoScroll={autoScrollCode} />,
        },
    ]

    return (
        <div className="problem-shell">
            <DockableWorkspace
                panels={dockPanels}
                initialLayout={{ rows: [['viz', 'results'], ['code']], minimized: [] }}
            />
            <FloatingPanel title="Playback Controls">
                <div className="sub-status">{step?.message || 'Press Play to begin.'}</div>
                <PlaybackControls
                    isPlaying={isPlaying} isDone={isDone} speed={speed}
                    onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                    prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                    onSpeedChange={(e) => setSpeed(Number(e.target.value))}
                    autoScroll={autoScrollCode}
                    onAutoScrollChange={setAutoScrollCode}
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
