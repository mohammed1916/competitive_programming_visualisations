import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { buildTree, computeLayout, collectNodes, buildEdges, parseTreeInput } from '../../components/treeUtils'
import './BalancedBinaryTreeVisualizer.css'

const CANVAS_W = 520
const CANVAS_H = 320
const NODE_R = 22

const SOLUTION_CODE = [
    { line: 1, text: 'def isBalanced(root):' },
    { line: 2, text: '    def height(node):' },
    { line: 3, text: '        if not node: return 0' },
    { line: 4, text: '        lh = height(node.left)' },
    { line: 5, text: '        if lh == -1: return -1' },
    { line: 6, text: '        rh = height(node.right)' },
    { line: 7, text: '        if rh == -1: return -1' },
    { line: 8, text: '        if abs(lh - rh) > 1: return -1' },
    { line: 9, text: '        return max(lh, rh) + 1' },
    { line: 10, text: '    return height(root) != -1' },
]

function generateSteps(arr) {
    const root = buildTree(arr)
    const positions = computeLayout(root, CANVAS_W, 80)
    const edges = buildEdges(root)
    const allNodes = collectNodes(root)
    const steps = []

    if (!root) {
        return [{ phase: 'done', activeLine: 3, activeId: -1, heights: new Map(), unbalancedIds: new Set(), result: true, positions, edges, allNodes, message: 'Empty tree → balanced' }]
    }

    const heights = new Map()
    const unbalancedIds = new Set()

    function dfs(node) {
        if (!node) return 0

        steps.push({
            phase: 'recurse-left', activeLine: 4, activeId: node.id,
            heights: new Map(heights), unbalancedIds: new Set(unbalancedIds),
            result: null, positions, edges, allNodes,
            message: `Node ${node.val}: recurse left subtree`,
        })

        const lh = dfs(node.left)

        steps.push({
            phase: 'recurse-right', activeLine: 6, activeId: node.id,
            heights: new Map(heights), unbalancedIds: new Set(unbalancedIds),
            result: null, positions, edges, allNodes,
            message: `Node ${node.val}: lh=${lh === -1 ? '-1(unbalanced)' : lh}, recurse right subtree`,
        })

        const rh = dfs(node.right)

        const lhStr = lh === -1 ? '-1' : lh
        const rhStr = rh === -1 ? '-1' : rh

        if (lh === -1 || rh === -1 || Math.abs(lh - rh) > 1) {
            unbalancedIds.add(node.id)
            steps.push({
                phase: 'unbalanced', activeLine: 8, activeId: node.id,
                heights: new Map(heights), unbalancedIds: new Set(unbalancedIds),
                result: false, positions, edges, allNodes,
                message: `Node ${node.val}: |lh(${lhStr}) - rh(${rhStr})| > 1 → UNBALANCED, return -1`,
            })
            return -1
        }

        const h = Math.max(lh, rh) + 1
        heights.set(node.id, h)
        steps.push({
            phase: 'balanced', activeLine: 9, activeId: node.id,
            heights: new Map(heights), unbalancedIds: new Set(unbalancedIds),
            result: null, positions, edges, allNodes,
            message: `Node ${node.val}: balanced, height = max(${lhStr},${rhStr})+1 = ${h}`,
        })
        return h
    }

    const finalH = dfs(root)
    const result = finalH !== -1

    steps.push({
        phase: 'done', activeLine: 10, activeId: -1,
        heights: new Map(heights), unbalancedIds: new Set(unbalancedIds),
        result, positions, edges, allNodes,
        message: `Result: ${result ? '✓ Balanced' : '✗ Not Balanced'}`,
    })

    return steps
}

const EXAMPLES = [
    { label: 'Balanced', arr: [3, 9, 20, null, null, 15, 7] },
    { label: 'Unbalanced', arr: [1, 2, 2, 3, 3, null, null, 4, 4] },
    { label: 'Single', arr: [1] },
    { label: 'Full', arr: [1, 2, 3, 4, 5, 6, 7] },
]

export default function BalancedBinaryTreeVisualizer() {
    const [arrInput, setArrInput] = useState('[3,9,20,null,null,15,7]')

    const { arr, inputError } = useMemo(() => {
        try {
            return { arr: parseTreeInput(arrInput), inputError: '' }
        } catch (e) {
            return { arr: [3, 9, 20, null, null, 15, 7], inputError: e.message }
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
        <div className="bbt-shell">
            <div className="bbt-top">
                <section className="bbt-panel main">
                    <header className="bbt-head">
                        <span>Post-order DFS with height tracking</span>
                        {inputError && <span className="bbt-error">{inputError}</span>}
                    </header>
                    <div className="bbt-body">
                        <div className="bbt-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="bbt-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <input className="bbt-input" value={arrInput} onChange={(e) => { setArrInput(e.target.value); handleReset() }} />
                        <div className="bbt-canvas" style={{ width: CANVAS_W, height: CANVAS_H }}>
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
                                const isUnbal = step?.unbalancedIds?.has(node.id)
                                const h = step?.heights?.get(node.id)
                                return (
                                    <motion.div key={node.id} style={{ position: 'absolute', left: pos.x - NODE_R, top: pos.y - NODE_R }}>
                                        <motion.div
                                            className={`bbt-node ${isActive ? 'active' : ''} ${isUnbal ? 'unbalanced' : h != null ? 'balanced' : ''}`}
                                            animate={isActive ? { scale: 1.2 } : { scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        >
                                            {node.val}
                                        </motion.div>
                                        {h != null && (
                                            <div className="bbt-height-badge">{h}</div>
                                        )}
                                        {isUnbal && (
                                            <div className="bbt-height-badge unbal">!</div>
                                        )}
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                <section className="bbt-panel side">
                    <header className="bbt-head"><span>State</span></header>
                    <div className="bbt-body">
                        <div className="bbt-metric">
                            <span className="bbt-label">Active node</span>
                            <strong className="bbt-val">
                                {step?.activeId != null && step.activeId !== -1
                                    ? allNodes.find((n) => n.id === step.activeId)?.val ?? '—'
                                    : '—'}
                            </strong>
                        </div>
                        <div className="bbt-legend">
                            <div className="bbt-legend-item"><div className="bbt-dot active" />Processing</div>
                            <div className="bbt-legend-item"><div className="bbt-dot balanced" />Balanced subtree</div>
                            <div className="bbt-legend-item"><div className="bbt-dot unbalanced" />Unbalanced</div>
                        </div>
                        <div className={`bbt-result ${step?.phase === 'done' ? (step.result ? 'ok' : 'fail') : ''}`}>
                            {step?.phase === 'done'
                                ? (step.result ? '✓ Balanced' : '✗ Not Balanced')
                                : 'Checking…'}
                        </div>
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="bbt-status">{step?.message || 'Press Play to begin.'}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
            />
        </div>
    )
}
