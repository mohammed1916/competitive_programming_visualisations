import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './SameTreeVisualizer.css'

const CANVAS_W = 340
const CANVAS_H = 280
const NODE_R = 22

// ─── Python solution ──────────────────────────────────────────────────────────
const SOLUTION_CODE = [
    { line: 1,  text: 'class Solution:' },
    { line: 2,  text: '    def isSameTree(self, p, q):' },
    { line: 3,  text: '        if not p and not q:' },
    { line: 4,  text: '            return True' },
    { line: 5,  text: '        if not p or not q:' },
    { line: 6,  text: '            return False' },
    { line: 7,  text: '        if p.val != q.val:' },
    { line: 8,  text: '            return False' },
    { line: 9,  text: '        left  = isSameTree(p.left,  q.left)' },
    { line: 10, text: '        right = isSameTree(p.right, q.right)' },
    { line: 11, text: '        return left and right' },
]

// ─── Preset examples ──────────────────────────────────────────────────────────
const EXAMPLES = [
    { label: 'Same (LC ex1)',  p: [1,2,3],         q: [1,2,3]         },
    { label: 'Different vals', p: [1,2],            q: [1,null,2]      },
    { label: 'Val mismatch',   p: [1,2,1],          q: [1,1,2]         },
    { label: 'Larger same',    p: [4,2,7,1,3,6,9], q: [4,2,7,1,3,6,9] },
]

// ─── Tree utilities ───────────────────────────────────────────────────────────
function buildLinkedTree(arr, prefix = 'p') {
    if (!arr || !arr.length || arr[0] == null) return null
    const nodes = arr.map((val, i) =>
        val == null ? null : { id: `${prefix}-${i}`, val, left: null, right: null }
    )
    for (let i = 0; i < nodes.length; i++) {
        if (!nodes[i]) continue
        const li = 2 * i + 1, ri = 2 * i + 2
        if (li < nodes.length) nodes[i].left  = nodes[li]
        if (ri < nodes.length) nodes[i].right = nodes[ri]
    }
    return nodes[0]
}

function computePositions(node, depth, left, right, out = new Map()) {
    if (!node) return out
    const x = (left + right) / 2
    const y = depth * 72 + 38
    out.set(node.id, { x, y })
    computePositions(node.left,  depth + 1, left, x, out)
    computePositions(node.right, depth + 1, x, right, out)
    return out
}

function buildEdges(node, edges = []) {
    if (!node) return edges
    if (node.left)  { edges.push({ fromId: node.id, toId: node.left.id });  buildEdges(node.left,  edges) }
    if (node.right) { edges.push({ fromId: node.id, toId: node.right.id }); buildEdges(node.right, edges) }
    return edges
}

function collectNodes(root) {
    const r = []
    if (!root) return r
    const q = [root]
    while (q.length) {
        const n = q.shift()
        r.push(n)
        if (n.left)  q.push(n.left)
        if (n.right) q.push(n.right)
    }
    return r
}

function treeSnapshot(root, canvasW) {
    const positions = computePositions(root, 0, 0, canvasW)
    const edges     = buildEdges(root)
    const nodes     = collectNodes(root)
    return { positions, edges, nodes }
}

// ─── Step generator ───────────────────────────────────────────────────────────
function generateSteps(pArr, qArr) {
    const pRoot = buildLinkedTree(pArr, 'p')
    const qRoot = buildLinkedTree(qArr, 'q')

    const pSnap = treeSnapshot(pRoot, CANVAS_W)
    const qSnap = treeSnapshot(qRoot, CANVAS_W)

    const steps = []

    // Tracks node state: 'match' | 'mismatch' | 'null-match' | 'null-mismatch'
    const nodeStates = {}   // id -> 'match'|'mismatch'

    function push(activeLine, activePId, activeQId, message, finalResult = null) {
        steps.push({
            activeLine,
            activePId,
            activeQId,
            nodeStates: { ...nodeStates },
            pPositions: pSnap.positions,
            pEdges:     pSnap.edges,
            pNodes:     pSnap.nodes,
            qPositions: qSnap.positions,
            qEdges:     qSnap.edges,
            qNodes:     qSnap.nodes,
            message,
            finalResult,
        })
    }

    push(2, null, null, 'Call isSameTree(p, q). Begin recursive DFS.')

    // Returns boolean
    function dfs(p, q) {
        const pId = p ? p.id : null
        const qId = q ? q.id : null

        // Both null
        push(3, pId, qId, `Check: p=${p ? p.val : 'null'}, q=${q ? q.val : 'null'} — both null?`)
        if (!p && !q) {
            push(4, pId, qId, 'Both nodes are null → return True (base case)')
            return true
        }

        // One null
        push(5, pId, qId, `One of p/q is null — structural mismatch?`)
        if (!p || !q) {
            if (pId) nodeStates[pId] = 'mismatch'
            if (qId) nodeStates[qId] = 'mismatch'
            push(6, pId, qId, `One node is null, other is ${p ? p.val : q.val} → return False`)
            return false
        }

        // Value check
        push(7, pId, qId, `Compare values: p.val=${p.val} vs q.val=${q.val}`)
        if (p.val !== q.val) {
            nodeStates[pId] = 'mismatch'
            nodeStates[qId] = 'mismatch'
            push(8, pId, qId, `p.val (${p.val}) ≠ q.val (${q.val}) → return False`)
            return false
        }

        // Values match — mark tentatively; will confirm after children
        nodeStates[pId] = 'match'
        nodeStates[qId] = 'match'
        push(9, pId, qId, `Values match (${p.val}=${q.val}) — recurse into left subtrees`)

        const leftOk = dfs(p.left, q.left)

        push(10, pId, qId, `Left subtrees ${leftOk ? 'match' : 'differ'} — recurse into right subtrees`)

        const rightOk = dfs(p.right, q.right)

        if (!leftOk || !rightOk) {
            nodeStates[pId] = 'mismatch'
            nodeStates[qId] = 'mismatch'
        }

        const result = leftOk && rightOk
        push(11, pId, qId, `Return ${result} for node ${p.val}`)
        return result
    }

    const result = dfs(pRoot, qRoot)

    push(
        result ? 11 : 8,
        null, null,
        result ? 'Trees are identical! isSameTree returns True.' : 'Trees differ. isSameTree returns False.',
        result
    )

    return steps
}

// ─── Tree canvas ──────────────────────────────────────────────────────────────
function TreeCanvas({ positions, edges, nodes, activePId, activeQId, nodeStates, label, prefix }) {
    return (
        <div className="st-tree-wrap">
            <div className="st-tree-label">{label}</div>
            <div className="st-canvas" style={{ width: CANVAS_W, height: CANVAS_H }}>
                <svg
                    style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
                    width={CANVAS_W}
                    height={CANVAS_H}
                >
                    {edges.map(({ fromId, toId }) => {
                        const from = positions.get(fromId)
                        const to   = positions.get(toId)
                        if (!from || !to) return null
                        return (
                            <line
                                key={`${fromId}-${toId}`}
                                x1={from.x} y1={from.y}
                                x2={to.x}   y2={to.y}
                                stroke="#45475a"
                                strokeWidth={1.5}
                            />
                        )
                    })}
                </svg>
                {nodes.map((node) => {
                    const pos     = positions.get(node.id)
                    if (!pos) return null
                    const isActive = prefix === 'p' ? activePId === node.id : activeQId === node.id
                    const state    = nodeStates?.[node.id]
                    return (
                        <motion.div
                            key={node.id}
                            className={[
                                'st-node',
                                isActive ? 'active'   : '',
                                state === 'match'    ? 'match'    : '',
                                state === 'mismatch' ? 'mismatch' : '',
                            ].join(' ')}
                            animate={{
                                left:  pos.x - NODE_R,
                                top:   pos.y - NODE_R,
                                scale: isActive ? 1.18 : 1,
                            }}
                            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                            style={{ left: pos.x - NODE_R, top: pos.y - NODE_R }}
                        >
                            {node.val}
                        </motion.div>
                    )
                })}
                {nodes.length === 0 && (
                    <div className="st-empty-tree">null</div>
                )}
            </div>
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SameTreeVisualizer() {
    const [selected, setSelected] = useState(0)
    const [pInput, setPInput] = useState(JSON.stringify(EXAMPLES[0].p))
    const [qInput, setQInput] = useState(JSON.stringify(EXAMPLES[0].q))
    const [inputError, setInputError] = useState('')
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    function parseArr(str) {
        const parsed = JSON.parse(str)
        if (!Array.isArray(parsed)) throw new Error('Expected array')
        return parsed.map(v => v === null ? null : Number(v))
    }

    const { pArr, qArr } = useMemo(() => {
        try {
            const pArr = parseArr(pInput)
            const qArr = parseArr(qInput)
            setInputError('')
            return { pArr, qArr }
        } catch {
            setInputError('Invalid input — using last valid')
            return { pArr: EXAMPLES[selected].p, qArr: EXAMPLES[selected].q }
        }
    }, [pInput, qInput, selected])

    const steps = useMemo(() => generateSteps(pArr, qArr), [pArr, qArr])

    const {
        stepIndex, stepForward, stepBack, togglePlay,
        handleReset, isPlaying, speed, setSpeed, isDone,
    } = usePlaybackState(steps.length)

    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useCallback((idx) => {
        setSelected(idx)
        setPInput(JSON.stringify(EXAMPLES[idx].p))
        setQInput(JSON.stringify(EXAMPLES[idx].q))
        handleReset()
    }, [handleReset])

    const finalResult = step?.finalResult
    const hasFinal    = finalResult !== null && finalResult !== undefined

    return (
        <div className="st-shell">

            {/* ── Top: two tree canvases ───────────────────────────────────── */}
            <div className="st-top">
                <section className="st-panel main">
                    <header className="st-head">
                        <span>Two Tree DFS Comparison</span>
                        {inputError && <span className="st-error">{inputError}</span>}
                    </header>
                    <div className="st-body">
                        {/* Example chips */}
                        <div className="st-examples">
                            {EXAMPLES.map((ex, i) => (
                                <button
                                    key={ex.label}
                                    className={`st-chip${selected === i ? ' selected' : ''}`}
                                    onClick={() => applyExample(i)}
                                >
                                    {ex.label}
                                </button>
                            ))}
                        </div>

                        {/* Input row */}
                        <div className="st-inputs">
                            <div className="st-input-group">
                                <label className="st-input-label">Tree p</label>
                                <input
                                    className="st-input"
                                    value={pInput}
                                    onChange={(e) => { setPInput(e.target.value); handleReset() }}
                                />
                            </div>
                            <div className="st-input-group">
                                <label className="st-input-label">Tree q</label>
                                <input
                                    className="st-input"
                                    value={qInput}
                                    onChange={(e) => { setQInput(e.target.value); handleReset() }}
                                />
                            </div>
                        </div>

                        {/* Side-by-side trees */}
                        <div className="st-trees">
                            <TreeCanvas
                                positions={step?.pPositions ?? new Map()}
                                edges={step?.pEdges ?? []}
                                nodes={step?.pNodes ?? []}
                                activePId={step?.activePId}
                                activeQId={step?.activeQId}
                                nodeStates={step?.nodeStates}
                                label="p"
                                prefix="p"
                            />
                            <div className="st-vs">
                                {hasFinal
                                    ? <motion.span
                                        className={`st-vs-badge ${finalResult ? 'true' : 'false'}`}
                                        initial={{ scale: 0.7, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                      >
                                        {finalResult ? 'true' : 'false'}
                                      </motion.span>
                                    : <span className="st-vs-label">vs</span>
                                }
                            </div>
                            <TreeCanvas
                                positions={step?.qPositions ?? new Map()}
                                edges={step?.qEdges ?? []}
                                nodes={step?.qNodes ?? []}
                                activePId={step?.activePId}
                                activeQId={step?.activeQId}
                                nodeStates={step?.nodeStates}
                                label="q"
                                prefix="q"
                            />
                        </div>
                    </div>
                </section>

                {/* ── Side panel: legend + call info ─────────────────────────── */}
                <section className="st-panel side">
                    <header className="st-head"><span>State</span></header>
                    <div className="st-body">

                        <div className="st-legend">
                            <div className="st-legend-item">
                                <div className="st-dot active" />
                                <span>Current comparison</span>
                            </div>
                            <div className="st-legend-item">
                                <div className="st-dot match" />
                                <span>Values matched</span>
                            </div>
                            <div className="st-legend-item">
                                <div className="st-dot mismatch" />
                                <span>Mismatch found</span>
                            </div>
                        </div>

                        <div className="st-state-row">
                            <span className="st-state-label">p node</span>
                            <span className="st-state-val">
                                {step?.activePId != null
                                    ? step.pNodes?.find(n => n.id === step.activePId)?.val ?? 'null'
                                    : '—'}
                            </span>
                        </div>
                        <div className="st-state-row">
                            <span className="st-state-label">q node</span>
                            <span className="st-state-val">
                                {step?.activeQId != null
                                    ? step.qNodes?.find(n => n.id === step.activeQId)?.val ?? 'null'
                                    : '—'}
                            </span>
                        </div>
                        <div className="st-state-row">
                            <span className="st-state-label">Matched</span>
                            <span className="st-state-val">
                                {Object.values(step?.nodeStates ?? {}).filter(s => s === 'match').length / 2}
                            </span>
                        </div>
                        <div className="st-state-row">
                            <span className="st-state-label">Mismatched</span>
                            <span className="st-state-val st-mismatch-count">
                                {Object.values(step?.nodeStates ?? {}).filter(s => s === 'mismatch').length / 2}
                            </span>
                        </div>

                        <div className={`st-result-box ${hasFinal ? (finalResult ? 'true' : 'false') : ''}`}>
                            {hasFinal
                                ? `isSameTree → ${finalResult}`
                                : (step ? 'Running…' : 'Press Play')}
                        </div>
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />

            <div className={`st-status ${hasFinal ? (finalResult ? 'ok' : 'bad') : ''}`}>
                {step?.message || 'Press Play or Step to begin.'}
            </div>

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
