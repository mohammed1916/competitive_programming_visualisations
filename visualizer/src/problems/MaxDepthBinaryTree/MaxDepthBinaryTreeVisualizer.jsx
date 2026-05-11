import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { buildTree, computeLayout, collectNodes, buildEdges, parseTreeInput, TreeSVG } from '../../components/treeUtils'
import './MaxDepthBinaryTreeVisualizer.css'

const CANVAS_W = 500
const CANVAS_H = 320
const NODE_R = 22

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def maxDepth(self, root):' },
    { line: 3, text: '        if not root: return 0' },
    { line: 4, text: '        leftDepth  = self.maxDepth(root.left)' },
    { line: 5, text: '        rightDepth = self.maxDepth(root.right)' },
    { line: 6, text: '        return 1 + max(leftDepth, rightDepth)' },
]

function generateSteps(arr) {
    const steps = []
    const root = buildTree(arr)
    const positions = computeLayout(root, CANVAS_W, 80)
    const edges = buildEdges(root)

    const returnValues = new Map() // nodeId -> depth returned

    function dfs(node, callStack) {
        if (!node) return 0

        steps.push({
            phase: 'call', activeLine: 4,
            activeId: node.id,
            callStack: [...callStack, node.val],
            returnValues: new Map(returnValues),
            message: `Call maxDepth(${node.val}) — explore left subtree`,
        })

        const leftDepth = dfs(node.left, [...callStack, node.val])

        steps.push({
            phase: 'right', activeLine: 5,
            activeId: node.id,
            callStack: [...callStack, node.val],
            returnValues: new Map(returnValues),
            message: `Back at ${node.val}: leftDepth=${leftDepth} — explore right subtree`,
        })

        const rightDepth = dfs(node.right, [...callStack, node.val])

        const depth = 1 + Math.max(leftDepth, rightDepth)
        returnValues.set(node.id, depth)

        steps.push({
            phase: 'return', activeLine: 6,
            activeId: node.id,
            callStack: [...callStack, node.val],
            returnValues: new Map(returnValues),
            message: `Return from ${node.val}: 1 + max(${leftDepth}, ${rightDepth}) = ${depth}`,
        })

        return depth
    }

    if (root) {
        const total = dfs(root, [])
        steps.push({
            phase: 'done', activeLine: 6,
            activeId: -1,
            callStack: [],
            returnValues: new Map(returnValues),
            message: `Maximum depth = ${total}`,
        })
    } else {
        steps.push({ phase: 'done', activeLine: 3, activeId: -1, callStack: [], returnValues: new Map(), message: 'Empty tree → depth = 0' })
    }

    return { steps, positions, edges, nodes: collectNodes(root) }
}

const EXAMPLES = [
    { label: 'LeetCode', arr: [3, 9, 20, null, null, 15, 7] },
    { label: 'Skewed', arr: [1, 2, null, 3, null, 4] },
    { label: 'Single', arr: [1] },
    { label: 'Full', arr: [1, 2, 3, 4, 5, 6, 7] },
]

export default function MaxDepthBinaryTreeVisualizer() {
    const [arrInput, setArrInput] = useState('[3,9,20,null,null,15,7]')

    const { arr, inputError } = useMemo(() => {
        try {
            return { arr: parseTreeInput(arrInput), inputError: '' }
        } catch (e) {
            return { arr: [3, 9, 20, null, null, 15, 7], inputError: e.message || 'Invalid input' }
        }
    }, [arrInput])

    const { steps, positions, edges, nodes } = useMemo(() => generateSteps(arr), [arr])
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useCallback((ex) => {
        setArrInput(JSON.stringify(ex.arr))
        handleReset()
    }, [handleReset])

    return (
        <div className="mdbt-shell">
            <div className="mdbt-top">
                <section className="mdbt-panel main">
                    <header className="mdbt-head">
                        <span>Binary Tree DFS</span>
                        {inputError && <span className="mdbt-error">{inputError}</span>}
                    </header>
                    <div className="mdbt-body">
                        <div className="mdbt-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="mdbt-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <input className="mdbt-input" value={arrInput} onChange={(e) => { setArrInput(e.target.value); handleReset() }} />
                        <div className="mdbt-canvas" style={{ width: CANVAS_W, height: CANVAS_H }}>
                            <TreeSVG edges={edges} positions={positions} canvasWidth={CANVAS_W} canvasHeight={CANVAS_H} />
                            {nodes.map((node) => {
                                const pos = positions.get(node.id)
                                if (!pos) return null
                                const isActive = step?.activeId === node.id
                                const retVal = step?.returnValues?.get(node.id)
                                return (
                                    <motion.div
                                        key={node.id}
                                        className={`mdbt-node ${isActive ? 'active' : ''} ${retVal !== undefined ? 'returned' : ''}`}
                                        style={{ left: pos.x - NODE_R, top: pos.y - NODE_R }}
                                        animate={isActive ? { scale: 1.2 } : { scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    >
                                        {node.val}
                                        {retVal !== undefined && <span className="mdbt-badge">{retVal}</span>}
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                <section className="mdbt-panel side">
                    <header className="mdbt-head"><span>Call Stack</span></header>
                    <div className="mdbt-body">
                        <div className="mdbt-stack">
                            {(step?.callStack ?? []).map((val, i) => (
                                <div key={i} className={`mdbt-frame ${i === (step.callStack.length - 1) ? 'top' : ''}`}>
                                    maxDepth({val})
                                </div>
                            ))}
                            {(step?.callStack?.length === 0) && <div className="mdbt-empty">—</div>}
                        </div>
                        <div className={`mdbt-result ${step?.phase === 'done' ? 'ok' : ''}`}>
                            {step?.phase === 'done' ? step.message : 'Traversing…'}
                        </div>
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className={`mdbt-status ${step?.phase === 'done' ? 'ok' : ''}`}>{step?.message || 'Press Play to begin.'}</div>
            <PlaybackControls
                isPlaying={isPlaying}
                isDone={isDone}
                speed={speed}
                onPlayToggle={togglePlay}
                onPrev={stepBack}
                onNext={stepForward}
                onReset={handleReset}
                prevDisabled={stepIndex < 0}
                nextDisabled={isDone}
                resetDisabled={stepIndex < 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
            />
        </div>
    )
}
