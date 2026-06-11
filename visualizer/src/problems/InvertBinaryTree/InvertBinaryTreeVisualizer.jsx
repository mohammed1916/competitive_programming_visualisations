import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import { parseTreeInput } from '../../components/treeUtils'
import './InvertBinaryTreeVisualizer.css'

const CANVAS_W = 500
const CANVAS_H = 320
const NODE_R = 22

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def invertTree(self, root):' },
    { line: 3, text: '        if not root: return None' },
    { line: 4, text: '        self.invertTree(root.left)' },
    { line: 5, text: '        self.invertTree(root.right)' },
    { line: 6, text: '        root.left, root.right = root.right, root.left' },
    { line: 7, text: '        return root' },
]

// ── Deep-clone a linked node tree ──────────────────────────────────────────
function cloneTree(node) {
    if (!node) return null
    return { id: node.id, val: node.val, left: cloneTree(node.left), right: cloneTree(node.right) }
}

// ── Build linked nodes from level-order array ──────────────────────────────
function buildLinkedTree(arr) {
    if (!arr || !arr.length || arr[0] == null) return null
    const nodes = arr.map((val, i) => (val == null ? null : { id: i, val, left: null, right: null }))
    for (let i = 0; i < nodes.length; i++) {
        if (!nodes[i]) continue
        const li = 2 * i + 1, ri = 2 * i + 2
        if (li < nodes.length) nodes[i].left = nodes[li]
        if (ri < nodes.length) nodes[i].right = nodes[ri]
    }
    return nodes[0]
}

// ── Compute x/y positions recursively ─────────────────────────────────────
function computePositions(node, depth, left, right, out = new Map()) {
    if (!node) return out
    const x = (left + right) / 2
    const y = depth * 80 + 40
    out.set(node.id, { x, y })
    computePositions(node.left, depth + 1, left, x, out)
    computePositions(node.right, depth + 1, x, right, out)
    return out
}

// ── Build edges list ───────────────────────────────────────────────────────
function buildEdges(node, edges = []) {
    if (!node) return edges
    if (node.left) { edges.push({ fromId: node.id, toId: node.left.id }); buildEdges(node.left, edges) }
    if (node.right) { edges.push({ fromId: node.id, toId: node.right.id }); buildEdges(node.right, edges) }
    return edges
}

// ── Collect all nodes BFS ─────────────────────────────────────────────────
function collectNodes(root) {
    const r = []
    if (!root) return r
    const q = [root]
    while (q.length) { const n = q.shift(); r.push(n); if (n.left) q.push(n.left); if (n.right) q.push(n.right) }
    return r
}

// ── Snapshot helper ────────────────────────────────────────────────────────
function snapshot(root) {
    const clone = cloneTree(root)
    const positions = computePositions(clone, 0, 0, CANVAS_W)
    const edges = buildEdges(clone)
    const nodes = collectNodes(clone)
    return { positions, edges, nodes }
}

// ── Step generator ─────────────────────────────────────────────────────────
function generateSteps(arr) {
    const root = buildLinkedTree(arr)
    const steps = []

    steps.push({ phase: 'init', activeLine: 2, activeId: -1, swappedIds: new Set(), ...snapshot(root), message: 'Initial tree. Begin post-order DFS.' })

    const swappedIds = new Set()

    function dfs(node) {
        if (!node) return

        steps.push({ phase: 'visit', activeLine: 4, activeId: node.id, swappedIds: new Set(swappedIds), ...snapshot(root), message: `Visit node ${node.val} — recurse left` })

        dfs(node.left)

        steps.push({ phase: 'right', activeLine: 5, activeId: node.id, swappedIds: new Set(swappedIds), ...snapshot(root), message: `Back at ${node.val} — recurse right` })

        dfs(node.right)

        // Swap children
        const tmp = node.left
        node.left = node.right
        node.right = tmp
        swappedIds.add(node.id)

        steps.push({ phase: 'swap', activeLine: 6, activeId: node.id, swappedIds: new Set(swappedIds), ...snapshot(root), message: `Swap children of ${node.val}` })
    }

    if (root) {
        dfs(root)
        steps.push({ phase: 'done', activeLine: 7, activeId: -1, swappedIds: new Set(swappedIds), ...snapshot(root), message: 'Tree fully inverted!' })
    } else {
        steps.push({ phase: 'done', activeLine: 3, activeId: -1, swappedIds: new Set(), positions: new Map(), edges: [], nodes: [], message: 'Empty tree → return None' })
    }

    return steps
}

const EXAMPLES = [
    { label: 'LeetCode', arr: [4, 2, 7, 1, 3, 6, 9] },
    { label: 'Simple', arr: [2, 1, 3] },
    { label: 'Single', arr: [1] },
    { label: 'Left Heavy', arr: [1, 2, null, 3, 4] },
]

export default function InvertBinaryTreeVisualizer() {
    const [arrInput, setArrInput] = useState('[4,2,7,1,3,6,9]')
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const { arr, inputError } = useMemo(() => {
        try {
            return { arr: parseTreeInput(arrInput), inputError: '' }
        } catch (e) {
            return { arr: [4, 2, 7, 1, 3, 6, 9], inputError: e.message || 'Invalid input' }
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
    const nodes = step?.nodes ?? []

    return (
        <div className="ibt-shell">
            <div className="ibt-top">
                <section className="ibt-panel main">
                    <header className="ibt-head">
                        <span>Post-order DFS Swap</span>
                        {inputError && <span className="ibt-error">{inputError}</span>}
                    </header>
                    <div className="ibt-body">
                        <div className="ibt-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="ibt-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <input className="ibt-input" value={arrInput} onChange={(e) => { setArrInput(e.target.value); handleReset() }} />
                        <div className="ibt-canvas" style={{ width: CANVAS_W, height: CANVAS_H }}>
                            <svg style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} width={CANVAS_W} height={CANVAS_H}>
                                {edges.map(({ fromId, toId }) => {
                                    const from = positions.get(fromId)
                                    const to = positions.get(toId)
                                    if (!from || !to) return null
                                    return (
                                        <line key={`${fromId}-${toId}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                                            stroke="#45475a" strokeWidth={1.5} />
                                    )
                                })}
                            </svg>
                            {nodes.map((node) => {
                                const pos = positions.get(node.id)
                                if (!pos) return null
                                const isActive = step?.activeId === node.id
                                const isSwapped = step?.swappedIds?.has(node.id)
                                return (
                                    <motion.div
                                        key={node.id}
                                        className={`ibt-node ${isActive ? 'active' : ''} ${isSwapped ? 'swapped' : ''}`}
                                        animate={{ left: pos.x - NODE_R, top: pos.y - NODE_R, scale: isActive ? 1.2 : 1 }}
                                        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                                        style={{ left: pos.x - NODE_R, top: pos.y - NODE_R }}
                                    >
                                        {node.val}
                                        {isSwapped && !isActive && <span className="ibt-check">✓</span>}
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                <section className="ibt-panel side">
                    <header className="ibt-head"><span>Progress</span></header>
                    <div className="ibt-body">
                        <div className="ibt-legend">
                            <div className="ibt-legend-item"><div className="ibt-dot active" />Active node</div>
                            <div className="ibt-legend-item"><div className="ibt-dot swapped" />Swapped children</div>
                        </div>
                        <div className="ibt-swapped-list">
                            <span className="ibt-label">Inverted nodes</span>
                            {step?.swappedIds?.size > 0
                                ? [...(step.swappedIds)].map((id) => {
                                    const node = step.nodes?.find((n) => n.id === id)
                                    return <span key={id} className="ibt-tag">{node?.val ?? id}</span>
                                })
                                : <span className="ibt-empty">none yet</span>}
                        </div>
                        <div className={`ibt-result ${step?.phase === 'done' ? 'ok' : ''}`}>
                            {step?.phase === 'done' ? 'Done!' : `Phase: ${step?.phase ?? '—'}`}
                        </div>
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className={`ibt-status ${step?.phase === 'done' ? 'ok' : ''}`}>{step?.message || 'Press Play to begin.'}</div>
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
                showPatternOverlay={showPatternOverlay}
                onShowPatternOverlayChange={setShowPatternOverlay}
                patternOverlayLabel="Show pattern overlay"
                showPatternOverlayToggle
            />
            {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
        </div>
    )
}
