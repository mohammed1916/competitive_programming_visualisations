import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import VisualizerPlaybackSection from '../../components/VisualizerPlaybackSection'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { useCodeVisualConnectivity } from '../../hooks/useCodeVisualConnectivity'
import { useParsedInput } from '../../hooks/useParsedInput'
import { useApplyExample } from '../../hooks/useApplyExample'
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

const SNIPPETS = [
    { id: 'init', label: 'Init', lines: [3] },
    { id: 'loop', label: 'DFS Calls', lines: [4, 5] },
    { id: 'update', label: 'Depth Update', lines: [6] },
    { id: 'return', label: 'Return', lines: [6] },
]

function snippetIdForPhase(phase) {
    if (phase === 'done') return 'return'
    if (phase === 'call' || phase === 'right') return 'loop'
    if (phase === 'return') return 'update'
    return 'init'
}

export default function MaxDepthBinaryTreeVisualizer() {
    const [arrInput, setArrInput] = useState('[3,9,20,null,null,15,7]')

    const { value: arr, error: inputError } = useParsedInput(
        arrInput,
        parseTreeInput,
        [3, 9, 20, null, null, 15, 7],
    )

    const { steps, positions, edges, nodes } = useMemo(() => {
        const generated = generateSteps(arr)
        return {
            ...generated,
            steps: generated.steps.map((current) => ({
                ...current,
                snippetId: snippetIdForPhase(current.phase),
                relatedLines: current.relatedLines ?? (current.activeLine != null ? [current.activeLine] : []),
            })),
        }
    }, [arr])
    const { stepIndex, setStepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useApplyExample((ex) => {
        setArrInput(JSON.stringify(ex.arr))
    }, handleReset)

    const connectivity = useCodeVisualConnectivity({
        steps,
        stepIndex,
        snippetOptions: SNIPPETS,
        onStepJump: setStepIndex,
    })

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
                                        onClick={() =>
                                            connectivity.setVisualFocus({
                                                lines: [4, 5, 6],
                                                reason: `Tree node ${node.val} selected in DFS preview.`,
                                                targetType: 'node',
                                                targetId: String(node.id),
                                            })
                                        }
                                        role="button"
                                        tabIndex={0}
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

            <VisualizerPlaybackSection
                step={step}
                codeLines={SOLUTION_CODE}
                statusClassName="mdbt-status"
                statusDone={step?.phase === 'done'}
                statusMessage={step?.message}
                fallbackStatus="Press Play to begin."
                playback={{
                    stepIndex,
                    stepForward,
                    stepBack,
                    togglePlay,
                    handleReset,
                    isPlaying,
                    speed,
                    setSpeed,
                    isDone,
                }}
                connectivity={{
                    snippetOptions: SNIPPETS,
                    activeSnippetId: connectivity.activeSnippetId,
                    highlightedLines: connectivity.highlightedLines,
                    linkInfo: connectivity.linkInfo,
                    onLineSelect: connectivity.handleLineSelect,
                    onSnippetSelect: connectivity.handleSnippetSelect,
                }}
            />
        </div>
    )
}
