import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import { buildTree, computeLayout, collectNodes, buildEdges, parseTreeInput } from '../../components/treeUtils'
import './DiameterBinaryTreeVisualizer.css'

const CANVAS_W = 520
const CANVAS_H = 320
const NODE_R = 22

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def diameterOfBinaryTree(self, root):' },
    { line: 3, text: '        self.diameter = 0' },
    { line: 4, text: '        def depth(node):' },
    { line: 5, text: '            if not node: return 0' },
    { line: 6, text: '            left  = depth(node.left)' },
    { line: 7, text: '            right = depth(node.right)' },
    { line: 8, text: '            self.diameter = max(self.diameter, left + right)' },
    { line: 9, text: '            return 1 + max(left, right)' },
    { line: 10, text: '        depth(root)' },
    { line: 11, text: '        return self.diameter' },
]

function generateSteps(arr) {
    const root = buildTree(arr)
    const positions = computeLayout(root, CANVAS_W, 80)
    const edges = buildEdges(root)
    const allNodes = collectNodes(root)
    const steps = []

    if (!root) {
        return [{ phase: 'done', activeLine: 5, activeId: -1, diameter: 0, depthMap: new Map(), bestPairIds: [], positions, edges, allNodes, message: 'Empty tree → diameter = 0' }]
    }

    let diameter = 0
    const depthMap = new Map() // nodeId -> depth returned
    let bestPairIds = []  // [leftDescendant ids, rightDescendant ids] for visualizing the path

    // Track which pair gives the best diameter
    let bestLeft = null
    let bestRight = null
    let bestNode = null

    function dfs(node) {
        if (!node) return 0

        steps.push({
            phase: 'call', activeLine: 6, activeId: node.id,
            diameter, depthMap: new Map(depthMap), bestPairIds,
            positions, edges, allNodes,
            message: `Call depth(${node.val}) — recurse left`,
        })

        const left = dfs(node.left)

        steps.push({
            phase: 'right', activeLine: 7, activeId: node.id,
            diameter, depthMap: new Map(depthMap), bestPairIds,
            positions, edges, allNodes,
            message: `depth(${node.val}): left=${left} — recurse right`,
        })

        const right = dfs(node.right)

        const localDiameter = left + right
        if (localDiameter > diameter) {
            diameter = localDiameter
            bestNode = node.id
        }

        const d = 1 + Math.max(left, right)
        depthMap.set(node.id, d)

        steps.push({
            phase: 'return', activeLine: 9, activeId: node.id,
            diameter, depthMap: new Map(depthMap), bestPairIds,
            positions, edges, allNodes,
            message: `depth(${node.val}): left=${left}, right=${right}, path=${localDiameter}, diameter=${diameter}, return ${d}`,
        })

        return d
    }

    dfs(root)

    steps.push({
        phase: 'done', activeLine: 11, activeId: -1,
        diameter, depthMap: new Map(depthMap), bestPairIds,
        positions, edges, allNodes,
        message: `Diameter = ${diameter}`,
    })

    return steps
}

const EXAMPLES = [
    { label: 'LeetCode', arr: [1, 2, 3, 4, 5] },
    { label: 'Full', arr: [1, 2, 3, 4, 5, 6, 7] },
    { label: 'Linear', arr: [1, 2, null, 3, null, 4] },
    { label: 'Single', arr: [1] },
]

export default function DiameterBinaryTreeVisualizer() {
    const [arrInput, setArrInput] = useState('[1,2,3,4,5]')
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const { arr, inputError } = useMemo(() => {
        try {
            return { arr: parseTreeInput(arrInput), inputError: '' }
        } catch (e) {
            return { arr: [1, 2, 3, 4, 5], inputError: e.message || 'Invalid input' }
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
        <div className="dbt-shell">
            <div className="dbt-top">
                <section className="dbt-panel main">
                    <header className="dbt-head">
                        <span>Post-order DFS (depth tracking)</span>
                        {inputError && <span className="dbt-error">{inputError}</span>}
                    </header>
                    <div className="dbt-body">
                        <div className="dbt-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="dbt-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <input className="dbt-input" value={arrInput} onChange={(e) => { setArrInput(e.target.value); handleReset() }} />
                        <div className="dbt-canvas" style={{ width: CANVAS_W, height: CANVAS_H }}>
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
                                const depthVal = step?.depthMap?.get(node.id)
                                return (
                                    <motion.div
                                        key={node.id}
                                        className={`dbt-node ${isActive ? 'active' : ''} ${depthVal !== undefined ? 'done' : ''}`}
                                        style={{ left: pos.x - NODE_R, top: pos.y - NODE_R }}
                                        animate={isActive ? { scale: 1.2 } : { scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    >
                                        {node.val}
                                        {depthVal !== undefined && <span className="dbt-badge">{depthVal}</span>}
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                <section className="dbt-panel side">
                    <header className="dbt-head"><span>Diameter</span></header>
                    <div className="dbt-body">
                        <div className="dbt-diameter-display">
                            <span className="dbt-label">Current diameter</span>
                            <motion.div
                                className="dbt-diameter-val"
                                key={step?.diameter}
                                initial={{ scale: 0.7 }}
                                animate={{ scale: 1 }}
                            >
                                {step?.diameter ?? 0}
                            </motion.div>
                        </div>
                        <div className="dbt-depth-list">
                            <span className="dbt-label">Depths computed</span>
                            {allNodes.filter((n) => step?.depthMap?.has(n.id)).map((n) => (
                                <div key={n.id} className="dbt-depth-row">
                                    <span>node {n.val}</span>
                                    <span className="dbt-depth-val">depth={step.depthMap.get(n.id)}</span>
                                </div>
                            ))}
                            {!(allNodes.some((n) => step?.depthMap?.has(n.id))) && <span className="dbt-empty">none yet</span>}
                        </div>
                        <div className={`dbt-result ${step?.phase === 'done' ? 'ok' : ''}`}>
                            {step?.phase === 'done' ? `Diameter = ${step.diameter}` : 'Computing…'}
                        </div>
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className={`dbt-status ${step?.phase === 'done' ? 'ok' : ''}`}>{step?.message || 'Press Play to begin.'}</div>
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
