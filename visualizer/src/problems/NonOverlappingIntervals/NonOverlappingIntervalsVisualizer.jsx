import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './NonOverlappingIntervalsVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'def eraseOverlapIntervals(intervals):' },
    { line: 2, text: '    intervals.sort(key=lambda x: x[1])' },
    { line: 3, text: '    removed = 0' },
    { line: 4, text: '    end = -inf' },
    { line: 5, text: '    for start, finish in intervals:' },
    { line: 6, text: '        if start < end:      # overlap' },
    { line: 7, text: '            removed += 1' },
    { line: 8, text: '        else:' },
    { line: 9, text: '            end = finish    # keep this interval' },
    { line: 10, text: '    return removed' },
]

function parseIntervals(str) {
    return JSON.parse(str)
}

function generateSteps(intervals) {
    if (!intervals || intervals.length === 0) {
        return [{ phase: 'done', activeLine: 10, activeIdx: -1, end: -Infinity, removed: 0, keptIdx: new Set(), removedIdx: new Set(), sorted: [], message: 'No intervals' }]
    }

    const sorted = [...intervals].sort((a, b) => a[1] - b[1])
    const steps = []

    steps.push({
        phase: 'sort', activeLine: 2, activeIdx: -1,
        end: -Infinity, removed: 0, keptIdx: new Set(), removedIdx: new Set(), sorted,
        message: `Sort by end time: [${sorted.map((iv) => `[${iv}]`).join(', ')}]`,
    })

    let removed = 0
    let end = -Infinity
    const keptIdx = new Set()
    const removedIdx = new Set()

    for (let i = 0; i < sorted.length; i++) {
        const [start, finish] = sorted[i]
        const overlaps = start < end

        steps.push({
            phase: 'compare', activeLine: 6, activeIdx: i,
            end, removed, keptIdx: new Set(keptIdx), removedIdx: new Set(removedIdx), sorted,
            message: `Interval [${start},${finish}]: start(${start}) ${overlaps ? '<' : '>='} end(${end === -Infinity ? '-∞' : end}) → ${overlaps ? 'OVERLAP' : 'no overlap'}`,
        })

        if (overlaps) {
            removed++
            removedIdx.add(i)
            steps.push({
                phase: 'remove', activeLine: 7, activeIdx: i,
                end, removed, keptIdx: new Set(keptIdx), removedIdx: new Set(removedIdx), sorted,
                message: `Remove [${start},${finish}] — removed count = ${removed}`,
            })
        } else {
            end = finish
            keptIdx.add(i)
            steps.push({
                phase: 'keep', activeLine: 9, activeIdx: i,
                end, removed, keptIdx: new Set(keptIdx), removedIdx: new Set(removedIdx), sorted,
                message: `Keep [${start},${finish}], update end = ${finish}`,
            })
        }
    }

    steps.push({
        phase: 'done', activeLine: 10, activeIdx: -1,
        end, removed, keptIdx: new Set(keptIdx), removedIdx: new Set(removedIdx), sorted,
        message: `Removed = ${removed}`,
    })

    return steps
}

// Visual timeline helpers
const TIMELINE_W = 480
const TIMELINE_PAD = 30

function getScale(sorted) {
    if (!sorted || sorted.length === 0) return { min: 0, max: 10 }
    const min = Math.min(...sorted.map((iv) => iv[0]))
    const max = Math.max(...sorted.map((iv) => iv[1]))
    return { min: min - 1, max: max + 1 }
}

function toX(val, min, max) {
    return TIMELINE_PAD + ((val - min) / (max - min)) * (TIMELINE_W - 2 * TIMELINE_PAD)
}

const EXAMPLES = [
    { label: 'LeetCode', val: '[[1,2],[2,3],[3,4],[1,3]]' },
    { label: 'Example 2', val: '[[1,2],[1,2],[1,2]]' },
    { label: 'Example 3', val: '[[1,2],[2,3]]' },
    { label: 'Complex', val: '[[1,100],[11,22],[1,11],[2,12]]' },
]

export default function NonOverlappingIntervalsVisualizer() {
    const [input, setInput] = useState('[[1,2],[2,3],[3,4],[1,3]]')
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const { intervals, inputError } = useMemo(() => {
        try {
            const parsed = parseIntervals(input)
            if (!Array.isArray(parsed)) throw new Error('Must be array of pairs')
            return { intervals: parsed, inputError: '' }
        } catch (e) {
            return { intervals: [[1, 2], [2, 3], [3, 4], [1, 3]], inputError: e.message }
        }
    }, [input])

    const steps = useMemo(() => generateSteps(intervals), [intervals])
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useCallback((ex) => {
        setInput(ex.val)
        handleReset()
    }, [handleReset])

    const sorted = step?.sorted ?? []
    const { min, max } = getScale(sorted)
    const ROW_H = 32
    const CANVAS_H = Math.max(120, sorted.length * ROW_H + 60)

    return (
        <div className="noi-shell">
            <div className="noi-top">
                <section className="noi-panel main">
                    <header className="noi-head">
                        <span>Greedy — sort by end time</span>
                        {inputError && <span className="noi-error">{inputError}</span>}
                    </header>
                    <div className="noi-body">
                        <div className="noi-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="noi-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <input className="noi-input" value={input} onChange={(e) => { setInput(e.target.value); handleReset() }} />

                        {/* Timeline */}
                        <div className="noi-timeline-wrap">
                            <svg width={TIMELINE_W} height={CANVAS_H}>
                                {/* Axis */}
                                <line x1={TIMELINE_PAD} y1={CANVAS_H - 20} x2={TIMELINE_W - TIMELINE_PAD} y2={CANVAS_H - 20} stroke="#45475a" strokeWidth={1} />
                                {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((v) => (
                                    <g key={v}>
                                        <line x1={toX(v, min, max)} y1={CANVAS_H - 24} x2={toX(v, min, max)} y2={CANVAS_H - 16} stroke="#45475a" strokeWidth={1} />
                                        <text x={toX(v, min, max)} y={CANVAS_H - 6} textAnchor="middle" fontSize={10} fill="#6c7086">{v}</text>
                                    </g>
                                ))}

                                {/* Intervals */}
                                {sorted.map((iv, i) => {
                                    const isActive = step?.activeIdx === i
                                    const isKept = step?.keptIdx?.has(i)
                                    const isRemoved = step?.removedIdx?.has(i)
                                    const x1 = toX(iv[0], min, max)
                                    const x2 = toX(iv[1], min, max)
                                    const y = 20 + i * ROW_H
                                    const color = isRemoved ? '#f38ba8' : isKept ? '#a6e3a1' : isActive ? '#f9e2af' : '#89b4fa'
                                    const bgColor = isRemoved ? '#3a1d1d' : isKept ? '#1d3a2a' : isActive ? '#2a2a3e' : '#1a2a3a'
                                    return (
                                        <g key={i}>
                                            <rect x={x1} y={y} width={Math.max(x2 - x1, 4)} height={22} rx={4} fill={bgColor} stroke={color} strokeWidth={isActive ? 2 : 1.5} opacity={isRemoved && !isActive ? 0.45 : 1} />
                                            <text x={(x1 + x2) / 2} y={y + 14} textAnchor="middle" fontSize={11} fontWeight="700" fill={color}>
                                                [{iv[0]},{iv[1]}]
                                            </text>
                                        </g>
                                    )
                                })}

                                {/* Current end line */}
                                {step && step.end !== -Infinity && (
                                    <line
                                        x1={toX(step.end, min, max)} y1={10}
                                        x2={toX(step.end, min, max)} y2={CANVAS_H - 28}
                                        stroke="#cba6f7" strokeWidth={1.5} strokeDasharray="4,3"
                                    />
                                )}
                            </svg>
                            {step && step.end !== -Infinity && (
                                <div className="noi-end-label" style={{ left: toX(step.end, min, max) }}>end={step.end}</div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="noi-panel side">
                    <header className="noi-head"><span>Greedy State</span></header>
                    <div className="noi-body">
                        <div className="noi-metric"><span className="noi-label">end</span><strong className="noi-val end-color">{step?.end === -Infinity ? '-∞' : step?.end ?? '—'}</strong></div>
                        <div className="noi-metric"><span className="noi-label">removed</span><strong className="noi-val removed-color">{step?.removed ?? 0}</strong></div>
                        <div className="noi-legend">
                            <div className="noi-legend-item"><div className="noi-dot kept" />Kept</div>
                            <div className="noi-legend-item"><div className="noi-dot removed" />Removed</div>
                            <div className="noi-legend-item"><div className="noi-dot active" />Checking</div>
                            <div className="noi-legend-item"><div className="noi-dot end-line" />Current end</div>
                        </div>
                        <div className={`noi-result ${step?.phase === 'done' ? 'done' : ''}`}>
                            {step?.phase === 'done' ? `Remove ${step.removed} intervals` : 'Processing…'}
                        </div>
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className="noi-status">{step?.message || 'Press Play to begin.'}</div>
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
