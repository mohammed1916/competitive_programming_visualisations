import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { buildTree, computeLayout, collectNodes, buildEdges, parseTreeInput } from '../../components/treeUtils'
import './LCABinaryTreeVisualizer.css'

const CANVAS_W = 520
const CANVAS_H = 320
const NODE_R = 22

const SOLUTION_CODE = [
    { line: 1, text: 'def lowestCommonAncestor(root, p, q):' },
    { line: 2, text: '    if not root: return None' },
    { line: 3, text: '    if root == p or root == q:' },
    { line: 4, text: '        return root' },
    { line: 5, text: '    left  = lca(root.left,  p, q)' },
    { line: 6, text: '    right = lca(root.right, p, q)' },
    { line: 7, text: '    if left and right:' },
    { line: 8, text: '        return root  # split point = LCA' },
    { line: 9, text: '    return left or right' },
]

function generateSteps(arr, pVal, qVal) {
    const root = buildTree(arr)
    const positions = computeLayout(root, CANVAS_W, 80)
    const edges = buildEdges(root)
    const allNodes = collectNodes(root)
    const steps = []

    const pNode = allNodes.find((n) => n.val === pVal)
    const qNode = allNodes.find((n) => n.val === qVal)

    if (!root || !pNode || !qNode) {
        return [{ phase: 'done', activeLine: 2, activeId: -1, lcaId: -1, pId: pNode?.id ?? -1, qId: qNode?.id ?? -1, foundIds: new Set(), positions, edges, allNodes, message: 'p or q not found in tree' }]
    }

    const foundIds = new Set()
    let lcaId = -1

    function dfs(node) {
        if (!node) return null

        if (node.val === pVal || node.val === qVal) {
            foundIds.add(node.id)
            steps.push({
                phase: 'found-target', activeLine: 3, activeId: node.id,
                lcaId, pId: pNode.id, qId: qNode.id, foundIds: new Set(foundIds),
                positions, edges, allNodes,
                message: `Found target node ${node.val} → return it`,
            })
            return node
        }

        steps.push({
            phase: 'recurse-left', activeLine: 5, activeId: node.id,
            lcaId, pId: pNode.id, qId: qNode.id, foundIds: new Set(foundIds),
            positions, edges, allNodes,
            message: `Node ${node.val}: search left subtree`,
        })

        const left = dfs(node.left)

        steps.push({
            phase: 'recurse-right', activeLine: 6, activeId: node.id,
            lcaId, pId: pNode.id, qId: qNode.id, foundIds: new Set(foundIds),
            positions, edges, allNodes,
            message: `Node ${node.val}: search right subtree (left=${left ? left.val : 'null'})`,
        })

        const right = dfs(node.right)

        if (left && right) {
            lcaId = node.id
            steps.push({
                phase: 'lca-found', activeLine: 8, activeId: node.id,
                lcaId, pId: pNode.id, qId: qNode.id, foundIds: new Set(foundIds),
                positions, edges, allNodes,
                message: `Both sides found: ${node.val} is the LCA!`,
            })
            return node
        }

        return left || right
    }

    dfs(root)

    steps.push({
        phase: 'done', activeLine: 9, activeId: -1,
        lcaId, pId: pNode.id, qId: qNode.id, foundIds: new Set(foundIds),
        positions, edges, allNodes,
        message: `LCA of ${pVal} and ${qVal} = ${lcaId !== -1 ? allNodes.find((n) => n.id === lcaId)?.val : '?'}`,
    })

    return steps
}

const EXAMPLES = [
    { label: 'LeetCode', arr: [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p: 5, q: 1 },
    { label: 'p=5,q=4', arr: [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p: 5, q: 4 },
    { label: 'Small', arr: [1, 2, 3], p: 2, q: 3 },
    { label: 'Deep', arr: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 0, q: 5 },
]

export default function LCABinaryTreeVisualizer() {
    const [arrInput, setArrInput] = useState('[3,5,1,6,2,0,8,null,null,7,4]')
    const [pInput, setPInput] = useState('5')
    const [qInput, setQInput] = useState('1')

    const { arr, pVal, qVal } = useMemo(() => {
        try {
            return { arr: parseTreeInput(arrInput), pVal: parseInt(pInput), qVal: parseInt(qInput) }
        } catch {
            return { arr: [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], pVal: 5, qVal: 1 }
        }
    }, [arrInput, pInput, qInput])

    const steps = useMemo(() => generateSteps(arr, pVal, qVal), [arr, pVal, qVal])
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useCallback((ex) => {
        setArrInput(JSON.stringify(ex.arr))
        setPInput(String(ex.p))
        setQInput(String(ex.q))
        handleReset()
    }, [handleReset])

    const positions = step?.positions ?? new Map()
    const edges = step?.edges ?? []
    const allNodes = step?.allNodes ?? []

    return (
        <div className="lcabt-shell">
            <div className="lcabt-top">
                <section className="lcabt-panel main">
                    <header className="lcabt-head"><span>Post-order DFS — find split point</span></header>
                    <div className="lcabt-body">
                        <div className="lcabt-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="lcabt-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <div className="lcabt-inputs">
                            <label>Tree <input className="lcabt-input wide" value={arrInput} onChange={(e) => { setArrInput(e.target.value); handleReset() }} /></label>
                            <label>p <input className="lcabt-input narrow" value={pInput} onChange={(e) => { setPInput(e.target.value); handleReset() }} /></label>
                            <label>q <input className="lcabt-input narrow" value={qInput} onChange={(e) => { setQInput(e.target.value); handleReset() }} /></label>
                        </div>
                        <div className="lcabt-canvas" style={{ width: CANVAS_W, height: CANVAS_H }}>
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
                                const isP = step?.pId === node.id
                                const isQ = step?.qId === node.id
                                const isLCA = step?.lcaId === node.id
                                return (
                                    <motion.div key={node.id} style={{ position: 'absolute', left: pos.x - NODE_R, top: pos.y - NODE_R }}>
                                        <motion.div
                                            className={`lcabt-node ${isActive ? 'active' : ''} ${isLCA ? 'lca' : ''} ${(isP || isQ) && !isLCA ? 'target' : ''}`}
                                            animate={isActive ? { scale: 1.2 } : { scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        >
                                            {node.val}
                                        </motion.div>
                                        {isP && <div className="lcabt-badge p-badge">p</div>}
                                        {isQ && <div className="lcabt-badge q-badge">q</div>}
                                        {isLCA && <div className="lcabt-badge lca-badge">LCA</div>}
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                <section className="lcabt-panel side">
                    <header className="lcabt-head"><span>Search State</span></header>
                    <div className="lcabt-body">
                        <div className="lcabt-metric"><span className="lcabt-label">p</span><strong className="lcabt-val p-color">{pVal}</strong></div>
                        <div className="lcabt-metric"><span className="lcabt-label">q</span><strong className="lcabt-val q-color">{qVal}</strong></div>
                        <div className="lcabt-legend">
                            <div className="lcabt-legend-item"><div className="lcabt-dot active" />Processing</div>
                            <div className="lcabt-legend-item"><div className="lcabt-dot target" />p or q</div>
                            <div className="lcabt-legend-item"><div className="lcabt-dot lca" />LCA</div>
                        </div>
                        <div className={`lcabt-result ${step?.phase === 'done' && step.lcaId !== -1 ? 'done' : ''}`}>
                            {step?.phase === 'done' && step.lcaId !== -1
                                ? `LCA = ${allNodes.find((n) => n.id === step.lcaId)?.val}`
                                : 'Searching…'}
                        </div>
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="lcabt-status">{step?.message || 'Press Play to begin.'}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
            />
        </div>
    )
}
