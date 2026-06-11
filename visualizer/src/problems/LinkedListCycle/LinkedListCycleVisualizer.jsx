import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './LinkedListCycleVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def hasCycle(self, head: ListNode) -> bool:' },
    { line: 3, text: '        slow = head' },
    { line: 4, text: '        fast = head' },
    { line: 5, text: '' },
    { line: 6, text: '        while fast and fast.next:' },
    { line: 7, text: '            slow = slow.next' },
    { line: 8, text: '            fast = fast.next.next' },
    { line: 9, text: '' },
    { line: 10, text: '            if slow == fast:' },
    { line: 11, text: '                return True' },
    { line: 12, text: '' },
    { line: 13, text: '        return False' },
]

function generateSteps(nodeCount, tailConnectsTo) {
    // Build logical list: nodes 0..nodeCount-1, tail -> tailConnectsTo (-1 = no cycle)
    const steps = []
    const hasCycle = tailConnectsTo >= 0

    // Node indices: 0..n-1. next[i] = i+1, except next[n-1] = tailConnectsTo (-1 if none)
    const n = nodeCount
    const nextOf = (i) => {
        if (i < n - 1) return i + 1
        if (tailConnectsTo >= 0) return tailConnectsTo
        return null
    }

    steps.push({
        phase: 'init', activeLine: 3,
        slow: 0, fast: 0, detected: false, noMore: false,
        message: 'Initialize slow = head, fast = head (both at node 0).',
    })

    let slow = 0
    let fast = 0
    let maxIter = (n + 2) * 3 // safety cap

    for (let iter = 0; iter < maxIter; iter++) {
        // Check condition
        const fastNext = fast !== null ? nextOf(fast) : null
        const canContinue = fast !== null && fastNext !== null

        steps.push({
            phase: 'check', activeLine: 6,
            slow, fast, detected: false, noMore: !canContinue,
            message: !canContinue
                ? `fast or fast.next is null. No cycle. Return False.`
                : `fast=${fast}, fast.next=${fastNext}. Loop continues.`,
        })

        if (!canContinue) break

        const newSlow = nextOf(slow)
        const newFast = nextOf(nextOf(fast))

        steps.push({
            phase: 'move_slow', activeLine: 7,
            slow: newSlow, fast, detected: false, noMore: false,
            message: `slow moves 1 step: ${slow} → ${newSlow}.`,
        })

        slow = newSlow

        steps.push({
            phase: 'move_fast', activeLine: 8,
            slow, fast: newFast, detected: false, noMore: false,
            message: `fast moves 2 steps: ${fast} → ${newFast}.`,
        })

        fast = newFast

        if (slow === fast) {
            steps.push({
                phase: 'detected', activeLine: 11,
                slow, fast, detected: true, noMore: false,
                message: `slow == fast == node ${slow}. Cycle detected! Return True.`,
            })
            return steps
        } else {
            steps.push({
                phase: 'no_meet', activeLine: 10,
                slow, fast, detected: false, noMore: false,
                message: `slow=${slow} ≠ fast=${fast}. No collision yet, continue.`,
            })
        }
    }

    steps.push({
        phase: 'done_false', activeLine: 13,
        slow, fast: null, detected: false, noMore: true,
        message: 'No cycle found. Return False.',
    })

    return steps
}

const EXAMPLES = [
    { label: 'Cycle 0', nodeCount: 5, tail: 0, desc: '[3,2,0,-4] tail→pos 0' },
    { label: 'Cycle 1', nodeCount: 3, tail: 1, desc: '[1,2] tail→pos 1' },
    { label: 'No cycle', nodeCount: 4, tail: -1, desc: '[1,2,3,4] no cycle' },
    { label: 'Single', nodeCount: 1, tail: -1, desc: '[1] single node, no cycle' },
    { label: 'Self loop', nodeCount: 1, tail: 0, desc: '[1] self loop' },
]

const EXAMPLE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export default function LinkedListCycleVisualizer() {
    const [nodeCount, setNodeCount] = useState(5)
    const [tailTo, setTailTo] = useState(0)
    const [tailDesc, setTailDesc] = useState('Cycle 0')

    const steps = useMemo(() => generateSteps(nodeCount, tailTo), [nodeCount, tailTo])

    const {
        stepIndex, stepForward, stepBack, togglePlay,
        handleReset, isPlaying, speed, setSpeed, isDone,
    } = usePlaybackState(steps.length)

    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useCallback((ex) => {
        setNodeCount(ex.nodeCount)
        setTailTo(ex.tail)
        setTailDesc(ex.label)
        handleReset()
    }, [handleReset])

    const slow = step?.slow ?? 0
    const fast = step?.fast ?? 0
    const detected = step?.detected ?? false
    const noMore = step?.noMore ?? false

    // Layout: nodes in a row, with arc showing cycle back
    const hasCycle = tailTo >= 0
    const nodes = Array.from({ length: nodeCount }, (_, i) => i)

    return (
        <div className="llc-shell">
            <section className="llc-panel">
                <header className="llc-head">
                    <span>Linked List Cycle · Floyd's Tortoise &amp; Hare</span>
                </header>
                <div className="llc-body">
                    <div className="llc-examples">
                        {EXAMPLES.map((ex) => (
                            <button key={ex.label} className={`llc-chip${tailDesc === ex.label ? ' active' : ''}`} onClick={() => applyExample(ex)}>
                                {ex.label}
                            </button>
                        ))}
                    </div>

                    <div className="llc-config">
                        <label className="llc-cfg-label">
                            Nodes:
                            <select
                                className="llc-select"
                                value={nodeCount}
                                onChange={(e) => { setNodeCount(Number(e.target.value)); handleReset() }}
                            >
                                {[2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </label>
                        <label className="llc-cfg-label">
                            Tail connects to:
                            <select
                                className="llc-select"
                                value={tailTo}
                                onChange={(e) => { setTailTo(Number(e.target.value)); setTailDesc('custom'); handleReset() }}
                            >
                                <option value={-1}>None (no cycle)</option>
                                {nodes.map(n => <option key={n} value={n}>Node {n}</option>)}
                            </select>
                        </label>
                    </div>

                    {/* Node track */}
                    <div className="llc-track-wrap">
                        <div className="llc-track">
                            {nodes.map((i) => {
                                const isSlow = slow === i
                                const isFast = fast === i
                                const isBoth = isSlow && isFast
                                const isCycleEntry = hasCycle && tailTo === i
                                const isTail = i === nodeCount - 1

                                return (
                                    <div key={i} className="llc-node-wrap">
                                        <motion.div
                                            className={`llc-node${detected && isSlow ? ' meet' : ''}${isSlow && !isFast ? ' slow' : ''}${isFast && !isSlow ? ' fast' : ''}${isBoth ? ' both' : ''}${isCycleEntry ? ' cycle-entry' : ''}${noMore && isFast ? ' null-fast' : ''}`}
                                            animate={{ y: isBoth ? -12 : isSlow ? -8 : isFast ? -6 : 0, scale: isBoth || isSlow || isFast ? 1.1 : 1 }}
                                            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                                        >
                                            {EXAMPLE_LABELS[i]}
                                        </motion.div>
                                        <span className="llc-node-idx">{i}</span>
                                        {/* Pointer badges */}
                                        <div className="llc-ptr-row">
                                            {isSlow && !isBoth && <span className="llc-ptr slow-ptr">slow🐢</span>}
                                            {isFast && !isBoth && <span className="llc-ptr fast-ptr">fast🐇</span>}
                                            {isBoth && <span className="llc-ptr both-ptr">🐢🐇</span>}
                                        </div>
                                        {/* Arrow to next node */}
                                        {i < nodeCount - 1 && (
                                            <div className="llc-arrow">→</div>
                                        )}
                                        {isTail && hasCycle && (
                                            <div className="llc-cycle-label">↩ {tailTo}</div>
                                        )}
                                        {isTail && !hasCycle && (
                                            <div className="llc-null-label">→ null</div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Cycle arc indicator */}
                        {hasCycle && (
                            <div className="llc-cycle-arc">
                                <span className="llc-cycle-badge">⟳ Cycle: tail node {nodeCount - 1} → node {tailTo}</span>
                            </div>
                        )}
                    </div>

                    {/* Result */}
                    <AnimatePresence>
                        {detected && (
                            <motion.div
                                className="llc-result cycle"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                🐢🐇 Meeting at node {slow} — Cycle Detected! Return True
                            </motion.div>
                        )}
                        {noMore && (
                            <motion.div
                                className="llc-result no-cycle"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                fast reached null — No Cycle. Return False
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />

            <div className={`llc-status${detected ? ' cycle' : noMore ? ' no-cycle' : ''}`}>
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
