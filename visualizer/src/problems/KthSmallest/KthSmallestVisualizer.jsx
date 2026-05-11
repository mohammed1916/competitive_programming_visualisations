import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { buildTree, computeLayout, collectNodes, buildEdges, parseTreeInput } from '../../components/treeUtils'
import './KthSmallestVisualizer.css'

const CANVAS_W = 520
const CANVAS_H = 320
const NODE_R = 22

const SOLUTION_CODE = [
    { line: 1, text: 'def kthSmallest(root, k):' },
    { line: 2, text: '    count, result = 0, None' },
    { line: 3, text: '    def inorder(node):' },
    { line: 4, text: '        nonlocal count, result' },
    { line: 5, text: '        if not node or result: return' },
    { line: 6, text: '        inorder(node.left)' },
    { line: 7, text: '        count += 1' },
    { line: 8, text: '        if count == k:' },
    { line: 9, text: '            result = node.val; return' },
    { line: 10, text: '        inorder(node.right)' },
    { line: 11, text: '    inorder(root); return result' },
]

function generateSteps(arr, k) {
    const root = buildTree(arr)
    const positions = computeLayout(root, CANVAS_W, 80)
    const edges = buildEdges(root)
    const allNodes = collectNodes(root)
    const steps = []

    let count = 0
    let resultId = -1
    const visitedIds = []

    function inorder(node) {
        if (!node || resultId !== -1) return

        steps.push({
            phase: 'go-left', activeLine: 6, activeId: node.id,
            count, resultId, visitedIds: [...visitedIds],
            positions, edges, allNodes,
            message: `Node ${node.val}: recurse left`,
        })

        inorder(node.left)
        if (resultId !== -1) return

        count++
        visitedIds.push(node.id)

        steps.push({
            phase: 'visit', activeLine: 7, activeId: node.id,
            count, resultId, visitedIds: [...visitedIds],
            positions, edges, allNodes,
            message: `Visit node ${node.val} (count=${count})`,
        })

        if (count === k) {
            resultId = node.id
            steps.push({
                phase: 'found', activeLine: 9, activeId: node.id,
                count, resultId, visitedIds: [...visitedIds],
                positions, edges, allNodes,
                message: `count=k=${k} → found kth smallest: ${node.val}`,
            })
            return
        }

        steps.push({
            phase: 'go-right', activeLine: 10, activeId: node.id,
            count, resultId, visitedIds: [...visitedIds],
            positions, edges, allNodes,
            message: `count=${count} < k=${k}, recurse right`,
        })

        inorder(node.right)
    }

    inorder(root)

    const resultVal = resultId !== -1 ? allNodes.find((n) => n.id === resultId)?.val : '?'
    steps.push({
        phase: 'done', activeLine: 11, activeId: -1,
        count, resultId, visitedIds: [...visitedIds],
        positions, edges, allNodes,
        message: `kth smallest (k=${k}) = ${resultVal}`,
    })

    return steps
}

const EXAMPLES = [
    { label: 'LeetCode', arr: [3, 1, 4, null, 2], k: 1 },
    { label: 'Example 2', arr: [5, 3, 6, 2, 4, null, null, 1], k: 3 },
    { label: 'k=4', arr: [5, 3, 7, 1, 4, 6, 8], k: 4 },
    { label: 'Root', arr: [2, 1, 3], k: 2 },
]

export default function KthSmallestVisualizer() {
    const [arrInput, setArrInput] = useState('[3,1,4,null,2]')
    const [kInput, setKInput] = useState('1')

    const { arr, k } = useMemo(() => {
        try {
            return { arr: parseTreeInput(arrInput), k: Math.max(1, parseInt(kInput) || 1) }
        } catch {
            return { arr: [3, 1, 4, null, 2], k: 1 }
        }
    }, [arrInput, kInput])

    const steps = useMemo(() => generateSteps(arr, k), [arr, k])
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useCallback((ex) => {
        setArrInput(JSON.stringify(ex.arr))
        setKInput(String(ex.k))
        handleReset()
    }, [handleReset])

    const positions = step?.positions ?? new Map()
    const edges = step?.edges ?? []
    const allNodes = step?.allNodes ?? []

    return (
        <div className="ks-shell">
            <div className="ks-top">
                <section className="ks-panel main">
                    <header className="ks-head"><span>Inorder DFS (sorted BST traversal)</span></header>
                    <div className="ks-body">
                        <div className="ks-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="ks-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <div className="ks-inputs">
                            <label>Tree <input className="ks-input wide" value={arrInput} onChange={(e) => { setArrInput(e.target.value); handleReset() }} /></label>
                            <label>k <input className="ks-input narrow" value={kInput} onChange={(e) => { setKInput(e.target.value); handleReset() }} /></label>
                        </div>
                        <div className="ks-canvas" style={{ width: CANVAS_W, height: CANVAS_H }}>
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
                                const visitIdx = step?.visitedIds?.indexOf(node.id)
                                const isVisited = visitIdx !== -1 && visitIdx !== undefined
                                const isResult = step?.resultId === node.id
                                return (
                                    <motion.div key={node.id} style={{ position: 'absolute', left: pos.x - NODE_R, top: pos.y - NODE_R }}>
                                        <motion.div
                                            className={`ks-node ${isActive ? 'active' : ''} ${isResult ? 'result' : isVisited ? 'visited' : ''}`}
                                            animate={isActive ? { scale: 1.2 } : { scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        >
                                            {node.val}
                                        </motion.div>
                                        {isVisited && (
                                            <div className="ks-order-badge">{visitIdx + 1}</div>
                                        )}
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                <section className="ks-panel side">
                    <header className="ks-head"><span>State</span></header>
                    <div className="ks-body">
                        <div className="ks-metric"><span className="ks-label">k</span><strong className="ks-val accent">{k}</strong></div>
                        <div className="ks-metric"><span className="ks-label">count</span><strong className="ks-val">{step?.count ?? 0}</strong></div>
                        <div className="ks-sub-head">Inorder so far</div>
                        <div className="ks-inorder">
                            {(step?.visitedIds ?? []).map((id, i) => {
                                const n = allNodes.find((x) => x.id === id)
                                const isK = i + 1 === k
                                return (
                                    <div key={id} className={`ks-inorder-cell ${isK ? 'kth' : ''}`}>
                                        <span className="ks-inorder-idx">{i + 1}</span>
                                        <span>{n?.val ?? '?'}</span>
                                    </div>
                                )
                            })}
                        </div>
                        <div className={`ks-result ${step?.phase === 'done' ? 'done' : ''}`}>
                            {step?.phase === 'done'
                                ? `${k}th smallest = ${allNodes.find((n) => n.id === step.resultId)?.val ?? '?'}`
                                : 'Traversing…'}
                        </div>
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="ks-status">{step?.message || 'Press Play to begin.'}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
            />
        </div>
    )
}
