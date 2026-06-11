import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import { buildTree, computeLayout, collectNodes, buildEdges, parseTreeInput } from '../../components/treeUtils'
import './RightSideViewVisualizer.css'

const CANVAS_W = 520
const CANVAS_H = 320
const NODE_R = 22

const SOLUTION_CODE = [
    { line: 1, text: 'def rightSideView(root):' },
    { line: 2, text: '    if not root: return []' },
    { line: 3, text: '    res, queue = [], deque([root])' },
    { line: 4, text: '    while queue:' },
    { line: 5, text: '        for i in range(len(queue)):' },
    { line: 6, text: '            node = queue.popleft()' },
    { line: 7, text: '            if node.left:  queue.append(node.left)' },
    { line: 8, text: '            if node.right: queue.append(node.right)' },
    { line: 9, text: '            if i == len_level - 1:' },
    { line: 10, text: '                res.append(node.val)' },
    { line: 11, text: '    return res' },
]

function generateSteps(arr) {
    const root = buildTree(arr)
    const positions = computeLayout(root, CANVAS_W, 80)
    const edges = buildEdges(root)
    const allNodes = collectNodes(root)
    const steps = []

    if (!root) {
        return [{ phase: 'done', activeLine: 2, activeId: -1, levelIds: [], rightmostIds: new Set(), result: [], queueIds: [], positions, edges, allNodes, message: 'Empty tree → []' }]
    }

    const rightmostIds = new Set()
    const result = []
    let queue = [root]

    steps.push({
        phase: 'init', activeLine: 3, activeId: -1,
        levelIds: [], rightmostIds: new Set(), result: [...result],
        queueIds: queue.map((n) => n.id), positions, edges, allNodes,
        message: 'Initialize queue with root',
    })

    while (queue.length > 0) {
        const levelSize = queue.length
        const levelIds = queue.map((n) => n.id)
        const nextQueue = []

        steps.push({
            phase: 'level-start', activeLine: 5, activeId: -1,
            levelIds, rightmostIds: new Set(rightmostIds), result: [...result],
            queueIds: queue.map((n) => n.id), positions, edges, allNodes,
            message: `Processing level with ${levelSize} node(s)`,
        })

        for (let i = 0; i < levelSize; i++) {
            const node = queue[i]

            steps.push({
                phase: 'dequeue', activeLine: 6, activeId: node.id,
                levelIds, rightmostIds: new Set(rightmostIds), result: [...result],
                queueIds: queue.slice(i + 1).map((n) => n.id), positions, edges, allNodes,
                message: `Dequeue node ${node.val} (index ${i} / ${levelSize - 1})`,
            })

            if (node.left) {
                nextQueue.push(node.left)
                steps.push({
                    phase: 'enqueue-left', activeLine: 7, activeId: node.id,
                    levelIds, rightmostIds: new Set(rightmostIds), result: [...result],
                    queueIds: [...queue.slice(i + 1), ...nextQueue].map((n) => n.id), positions, edges, allNodes,
                    message: `Enqueue left child ${node.left.val}`,
                })
            }
            if (node.right) {
                nextQueue.push(node.right)
                steps.push({
                    phase: 'enqueue-right', activeLine: 8, activeId: node.id,
                    levelIds, rightmostIds: new Set(rightmostIds), result: [...result],
                    queueIds: [...queue.slice(i + 1), ...nextQueue].map((n) => n.id), positions, edges, allNodes,
                    message: `Enqueue right child ${node.right.val}`,
                })
            }

            if (i === levelSize - 1) {
                rightmostIds.add(node.id)
                result.push(node.val)
                steps.push({
                    phase: 'rightmost', activeLine: 10, activeId: node.id,
                    levelIds, rightmostIds: new Set(rightmostIds), result: [...result],
                    queueIds: nextQueue.map((n) => n.id), positions, edges, allNodes,
                    message: `Last node in level → ${node.val} added to result`,
                })
            }
        }

        queue = nextQueue
    }

    steps.push({
        phase: 'done', activeLine: 11, activeId: -1,
        levelIds: [], rightmostIds: new Set(rightmostIds), result: [...result],
        queueIds: [], positions, edges, allNodes,
        message: `Right side view: [${result.join(', ')}]`,
    })

    return steps
}

const EXAMPLES = [
    { label: 'Example', arr: [1, 2, 3, null, 5, null, 4] },
    { label: 'Skewed', arr: [1, 2, null, 3] },
    { label: 'Single', arr: [1] },
    { label: 'Full', arr: [1, 2, 3, 4, 5, 6, 7] },
]

export default function RightSideViewVisualizer() {
    const [arrInput, setArrInput] = useState('[1,2,3,null,5,null,4]')
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const { arr, inputError } = useMemo(() => {
        try {
            return { arr: parseTreeInput(arrInput), inputError: '' }
        } catch (e) {
            return { arr: [1, 2, 3, null, 5, null, 4], inputError: e.message || 'Invalid input' }
        }
    }, [arrInput])

    const steps = useMemo(() => generateSteps(arr), [arr])
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useCallback((ex) => {
        setArrInput(JSON.stringify(ex.arr))
        handleReset()
    }, [handleReset])

    const positions = step?.positions ?? new Map()
    const edges = step?.edges ?? []
    const allNodes = step?.allNodes ?? []

    return (
        <div className="rsv-shell">
            <div className="rsv-top">
                <section className="rsv-panel main">
                    <header className="rsv-head"><span>BFS Level-by-Level</span>{inputError && <span className="rsv-error">{inputError}</span>}</header>
                    <div className="rsv-body">
                        <div className="rsv-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="rsv-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <input className="rsv-input" value={arrInput} onChange={(e) => { setArrInput(e.target.value); handleReset() }} />
                        <div className="rsv-canvas" style={{ width: CANVAS_W, height: CANVAS_H }}>
                            <svg style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} width={CANVAS_W} height={CANVAS_H}>
                                {edges.map(({ fromId, toId }) => {
                                    const from = positions.get(fromId)
                                    const to = positions.get(toId)
                                    if (!from || !to) return null
                                    return <line key={`${fromId}-${toId}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#45475a" strokeWidth={1.5} />
                                })}
                            </svg>
                            {allNodes.map((node) => {
                                const pos = positions.get(node.id)
                                if (!pos) return null
                                const isActive = step?.activeId === node.id
                                const isRightmost = step?.rightmostIds?.has(node.id)
                                const inLevel = step?.levelIds?.includes(node.id)
                                return (
                                    <motion.div
                                        key={node.id}
                                        className={`rsv-node ${isActive ? 'active' : ''} ${isRightmost ? 'rightmost' : ''} ${inLevel && !isActive ? 'inlevel' : ''}`}
                                        style={{ left: pos.x - NODE_R, top: pos.y - NODE_R }}
                                        animate={isActive ? { scale: 1.2 } : { scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    >
                                        {node.val}
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                <section className="rsv-panel side">
                    <header className="rsv-head"><span>State</span></header>
                    <div className="rsv-body">
                        <div className="rsv-sub-head">Queue</div>
                        <div className="rsv-queue">
                            <AnimatePresence mode="popLayout">
                                {(step?.queueIds ?? []).map((id) => {
                                    const n = allNodes.find((x) => x.id === id)
                                    return (
                                        <motion.div key={id} className="rsv-q-cell"
                                            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}>
                                            {n?.val ?? '?'}
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                            {(!step?.queueIds || step.queueIds.length === 0) && <span className="rsv-empty">empty</span>}
                        </div>
                        <div className="rsv-sub-head">Result</div>
                        <div className="rsv-result-row">
                            <AnimatePresence mode="popLayout">
                                {(step?.result ?? []).map((v, i) => (
                                    <motion.div key={i} className="rsv-res-cell"
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                        {v}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {(!step?.result || step.result.length === 0) && <span className="rsv-empty">[]</span>}
                        </div>
                        <div className="rsv-legend">
                            <div className="rsv-legend-item"><div className="rsv-dot active" />Current node</div>
                            <div className="rsv-legend-item"><div className="rsv-dot rightmost" />Rightmost</div>
                            <div className="rsv-legend-item"><div className="rsv-dot inlevel" />Current level</div>
                        </div>
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className="rsv-status">{step?.message || 'Press Play to begin.'}</div>
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
