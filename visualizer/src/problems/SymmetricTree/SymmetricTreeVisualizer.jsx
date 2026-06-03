import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './SymmetricTreeVisualizer.css'

const CANVAS_W = 340
const CANVAS_H = 280
const NODE_R = 22

// ─── Python solution ──────────────────────────────────────────────────────────
const SOLUTION_CODE = [
    { line: 1,  text: 'class Solution:' },
    { line: 2,  text: '    def isSymmetric(self, root):' },
    { line: 3,  text: '        def isMirror(left, right):' },
    { line: 4,  text: '            if not left and not right:' },
    { line: 5,  text: '                return True' },
    { line: 6,  text: '            if not left or not right:' },
    { line: 7,  text: '                return False' },
    { line: 8,  text: '            if left.val != right.val:' },
    { line: 9,  text: '                return False' },
    { line: 10, text: '            return isMirror(left.left, right.right)' },
    { line: 11, text: '                and isMirror(left.right, right.left)' },
]

// ─── Preset examples ──────────────────────────────────────────────────────────
const EXAMPLES = [
    { label: 'Symmetric',      tree: [1,2,2,3,4,4,3]           },
    { label: 'Symmetric null', tree: [1,2,2,null,3,null,3]     },
    { label: 'Not symmetric',  tree: [1,2,2,null,3,3,null]     },
    { label: 'Single node',    tree: [1]                       },
]

// ─── Tree utilities ───────────────────────────────────────────────────────────
function buildLinkedTree(arr) {
    if (!arr || !arr.length || arr[0] == null) return null
    const nodes = arr.map((val, i) =>
        val == null ? null : { id: `n-${i}`, val, left: null, right: null }
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
function generateSteps(treeArr) {
    const root = buildLinkedTree(treeArr)
    const snap = treeSnapshot(root, CANVAS_W)

    const steps = []
    const nodeStates = {}

    function push(activeLine, activeLeftId, activeRightId, message, finalResult = null) {
        steps.push({
            activeLine,
            activeLeftId,
            activeRightId,
            nodeStates: { ...nodeStates },
            positions: snap.positions,
            edges:     snap.edges,
            nodes:     snap.nodes,
            message,
            finalResult,
        })
    }

    push(2, null, null, 'Call isSymmetric(root). Begin mirror check.')

    function isMirror(left, right) {
        const leftId = left ? left.id : null
        const rightId = right ? right.id : null

        // Both null
        push(4, leftId, rightId, `Check: left=${left ? left.val : 'null'}, right=${right ? right.val : 'null'} — both null?`)
        if (!left && !right) {
            push(5, leftId, rightId, 'Both null → return True (base case)')
            return true
        }

        // One null
        push(6, leftId, rightId, `One null, other not? Structural mismatch.`)
        if (!left || !right) {
            if (leftId) nodeStates[leftId] = 'mirror-fail'
            if (rightId) nodeStates[rightId] = 'mirror-fail'
            push(7, leftId, rightId, `One is null → return False`)
            return false
        }

        // Value check
        push(8, leftId, rightId, `Values: left=${left.val} vs right=${right.val}`)
        if (left.val !== right.val) {
            nodeStates[leftId] = 'mirror-fail'
            nodeStates[rightId] = 'mirror-fail'
            push(9, leftId, rightId, `Values differ → return False`)
            return false
        }

        // Values match
        nodeStates[leftId] = 'mirror-ok'
        nodeStates[rightId] = 'mirror-ok'
        push(10, leftId, rightId, `Values match (${left.val}) — recurse into (left.left, right.right)`)

        const outerOk = isMirror(left.left, right.right)

        push(11, leftId, rightId, `Outer pair ${outerOk ? 'ok' : 'fail'} — recurse into (left.right, right.left)`)

        const innerOk = isMirror(left.right, right.left)

        if (!outerOk || !innerOk) {
            nodeStates[leftId] = 'mirror-fail'
            nodeStates[rightId] = 'mirror-fail'
        }

        const result = outerOk && innerOk
        push(11, leftId, rightId, `Return ${result} for pair at (${left.val}, ${right.val})`)
        return result
    }

    if (!root) {
        push(2, null, null, 'Root is null → symmetric (empty tree)', true)
    } else {
        const result = isMirror(root.left, root.right)
        push(
            result ? 11 : 9,
            null, null,
            result ? 'Tree is symmetric! isSymmetric returns True.' : 'Tree is not symmetric. isSymmetric returns False.',
            result
        )
    }

    return steps
}

// ─── Tree canvas ──────────────────────────────────────────────────────────────
function TreeCanvas({ positions, edges, nodes, activeLeftId, activeRightId, nodeStates }) {
    return (
        <div className="sym-canvas" style={{ width: CANVAS_W, height: CANVAS_H }}>
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
                const pos = positions.get(node.id)
                if (!pos) return null
                const isLeftActive = activeLeftId === node.id
                const isRightActive = activeRightId === node.id
                const state = nodeStates?.[node.id]
                return (
                    <motion.div
                        key={node.id}
                        className={[
                            'sym-node',
                            isLeftActive || isRightActive ? 'active' : '',
                            state === 'mirror-ok' ? 'mirror-ok' : '',
                            state === 'mirror-fail' ? 'mirror-fail' : '',
                        ].join(' ')}
                        animate={{
                            left:  pos.x - NODE_R,
                            top:   pos.y - NODE_R,
                            scale: isLeftActive || isRightActive ? 1.18 : 1,
                        }}
                        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                        style={{ left: pos.x - NODE_R, top: pos.y - NODE_R }}
                    >
                        {node.val}
                    </motion.div>
                )
            })}
            {nodes.length === 0 && (
                <div className="sym-empty">null</div>
            )}
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SymmetricTreeVisualizer() {
    const [selected, setSelected] = useState(0)
    const [treeInput, setTreeInput] = useState(JSON.stringify(EXAMPLES[0].tree))
    const [inputError, setInputError] = useState('')

    function parseArr(str) {
        const parsed = JSON.parse(str)
        if (!Array.isArray(parsed)) throw new Error('Expected array')
        return parsed.map(v => v === null ? null : Number(v))
    }

    const treeArr = useMemo(() => {
        try {
            const arr = parseArr(treeInput)
            setInputError('')
            return arr
        } catch {
            setInputError('Invalid input — using last valid')
            return EXAMPLES[selected].tree
        }
    }, [treeInput, selected])

    const steps = useMemo(() => generateSteps(treeArr), [treeArr])

    const {
        stepIndex, stepForward, stepBack, togglePlay,
        handleReset, isPlaying, speed, setSpeed, isDone,
    } = usePlaybackState(steps.length)

    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useCallback((idx) => {
        setSelected(idx)
        setTreeInput(JSON.stringify(EXAMPLES[idx].tree))
        handleReset()
    }, [handleReset])

    const finalResult = step?.finalResult
    const hasFinal    = finalResult !== null && finalResult !== undefined

    return (
        <div className="sym-shell">

            <div className="sym-top">
                <section className="sym-panel main">
                    <header className="sym-head">
                        <span>Symmetric Tree Mirror Check</span>
                        {inputError && <span className="sym-error">{inputError}</span>}
                    </header>
                    <div className="sym-body">
                        {/* Example chips */}
                        <div className="sym-examples">
                            {EXAMPLES.map((ex, i) => (
                                <button
                                    key={ex.label}
                                    className={`sym-chip${selected === i ? ' selected' : ''}`}
                                    onClick={() => applyExample(i)}
                                >
                                    {ex.label}
                                </button>
                            ))}
                        </div>

                        {/* Input row */}
                        <div className="sym-input-group">
                            <label className="sym-input-label">Tree (array)</label>
                            <input
                                className="sym-input"
                                value={treeInput}
                                onChange={(e) => { setTreeInput(e.target.value); handleReset() }}
                            />
                        </div>

                        {/* Canvas */}
                        <div className="sym-canvas-wrap">
                            <div className="sym-canvas-label">Tree visualization</div>
                            <TreeCanvas
                                positions={step?.positions ?? new Map()}
                                edges={step?.edges ?? []}
                                nodes={step?.nodes ?? []}
                                activeLeftId={step?.activeLeftId}
                                activeRightId={step?.activeRightId}
                                nodeStates={step?.nodeStates}
                            />
                            {hasFinal && (
                                <motion.div
                                    className={`sym-result-badge ${finalResult ? 'symmetric' : 'not-symmetric'}`}
                                    initial={{ scale: 0.7, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                >
                                    {finalResult ? 'SYMMETRIC' : 'NOT SYMMETRIC'}
                                </motion.div>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── Side panel ─────────────────────────────────────────────── */}
                <section className="sym-panel side">
                    <header className="sym-head"><span>State</span></header>
                    <div className="sym-body">

                        <div className="sym-legend">
                            <div className="sym-legend-item">
                                <div className="sym-dot active" />
                                <span>Current pair</span>
                            </div>
                            <div className="sym-legend-item">
                                <div className="sym-dot mirror-ok" />
                                <span>Pair matches</span>
                            </div>
                            <div className="sym-legend-item">
                                <div className="sym-dot mirror-fail" />
                                <span>Pair differs</span>
                            </div>
                        </div>

                        <div className="sym-state-row">
                            <span className="sym-state-label">Left node</span>
                            <span className="sym-state-val">
                                {step?.activeLeftId != null
                                    ? step.nodes?.find(n => n.id === step.activeLeftId)?.val ?? 'null'
                                    : '—'}
                            </span>
                        </div>
                        <div className="sym-state-row">
                            <span className="sym-state-label">Right node</span>
                            <span className="sym-state-val">
                                {step?.activeRightId != null
                                    ? step.nodes?.find(n => n.id === step.activeRightId)?.val ?? 'null'
                                    : '—'}
                            </span>
                        </div>
                        <div className="sym-state-row">
                            <span className="sym-state-label">Pairs OK</span>
                            <span className="sym-state-val">
                                {Object.values(step?.nodeStates ?? {}).filter(s => s === 'mirror-ok').length / 2}
                            </span>
                        </div>
                        <div className="sym-state-row">
                            <span className="sym-state-label">Pairs failed</span>
                            <span className="sym-state-val sym-fail-count">
                                {Object.values(step?.nodeStates ?? {}).filter(s => s === 'mirror-fail').length / 2}
                            </span>
                        </div>

                        <div className={`sym-result-box ${hasFinal ? (finalResult ? 'symmetric' : 'not-symmetric') : ''}`}>
                            {hasFinal
                                ? `isSymmetric → ${finalResult}`
                                : (step ? 'Running…' : 'Press Play')}
                        </div>
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />

            <div className={`sym-status ${hasFinal ? (finalResult ? 'ok' : 'bad') : ''}`}>
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
            />
        </div>
    )
}
