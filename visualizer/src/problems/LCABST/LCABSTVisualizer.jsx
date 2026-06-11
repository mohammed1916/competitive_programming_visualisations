import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import { buildTree, computeLayout, collectNodes, buildEdges, parseTreeInput } from '../../components/treeUtils'
import './LCABSTVisualizer.css'

const CANVAS_W = 520
const CANVAS_H = 320
const NODE_R = 22

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def lowestCommonAncestor(self, root, p, q):' },
    { line: 3, text: '        node = root' },
    { line: 4, text: '        while node:' },
    { line: 5, text: '            if p.val < node.val and q.val < node.val:' },
    { line: 6, text: '                node = node.left' },
    { line: 7, text: '            elif p.val > node.val and q.val > node.val:' },
    { line: 8, text: '                node = node.right' },
    { line: 9, text: '            else:' },
    { line: 10, text: '                return node' },
]

function findNode(root, val) {
    if (!root) return null
    if (root.val === val) return root
    return findNode(root.left, val) || findNode(root.right, val)
}

function generateSteps(arr, pVal, qVal) {
    const root = buildTree(arr)
    const positions = computeLayout(root, CANVAS_W, 80)
    const edges = buildEdges(root)
    const allNodes = collectNodes(root)
    const steps = []

    if (!root) {
        return [{ phase: 'done', activeLine: 4, activeId: -1, visitedIds: new Set(), lcaId: -1, positions, edges, allNodes, pVal, qVal, message: 'Empty tree.' }]
    }

    const pNode = findNode(root, pVal)
    const qNode = findNode(root, qVal)
    if (!pNode || !qNode) {
        return [{ phase: 'done', activeLine: 4, activeId: -1, visitedIds: new Set(), lcaId: -1, positions, edges, allNodes, pVal, qVal, message: `Node ${!pNode ? pVal : qVal} not found in tree.` }]
    }

    const visitedIds = new Set()
    let node = root
    let lcaId = -1

    steps.push({ phase: 'init', activeLine: 3, activeId: node.id, visitedIds: new Set(visitedIds), lcaId, positions, edges, allNodes, pVal, qVal, message: `Start at root (${root.val}). Looking for LCA of p=${pVal} and q=${qVal}.` })

    while (node) {
        visitedIds.add(node.id)

        if (pVal < node.val && qVal < node.val) {
            steps.push({
                phase: 'go-left', activeLine: 6, activeId: node.id, visitedIds: new Set(visitedIds), lcaId, positions, edges, allNodes, pVal, qVal,
                message: `Both ${pVal} and ${qVal} < ${node.val} → go left`,
            })
            node = node.left
            if (node) steps.push({ phase: 'move', activeLine: 4, activeId: node.id, visitedIds: new Set(visitedIds), lcaId, positions, edges, allNodes, pVal, qVal, message: `Now at node ${node.val}` })
        } else if (pVal > node.val && qVal > node.val) {
            steps.push({
                phase: 'go-right', activeLine: 8, activeId: node.id, visitedIds: new Set(visitedIds), lcaId, positions, edges, allNodes, pVal, qVal,
                message: `Both ${pVal} and ${qVal} > ${node.val} → go right`,
            })
            node = node.right
            if (node) steps.push({ phase: 'move', activeLine: 4, activeId: node.id, visitedIds: new Set(visitedIds), lcaId, positions, edges, allNodes, pVal, qVal, message: `Now at node ${node.val}` })
        } else {
            lcaId = node.id
            steps.push({
                phase: 'found', activeLine: 10, activeId: node.id, visitedIds: new Set(visitedIds), lcaId, positions, edges, allNodes, pVal, qVal,
                message: `${pVal} and ${qVal} split here → LCA = ${node.val}`,
            })
            break
        }
    }

    steps.push({ phase: 'done', activeLine: 10, activeId: lcaId, visitedIds: new Set(visitedIds), lcaId, positions, edges, allNodes, pVal, qVal, message: `LCA of ${pVal} and ${qVal} = ${allNodes.find((n) => n.id === lcaId)?.val ?? '?'}` })
    return steps
}

function parseInputs(arrInput, pInput, qInput) {
    const arr = parseTreeInput(arrInput)
    const p = parseInt(pInput, 10)
    const q = parseInt(qInput, 10)
    if (Number.isNaN(p) || Number.isNaN(q)) throw new Error('p and q must be integers')
    return { arr, p, q }
}

const EXAMPLES = [
    { label: 'LeetCode 1', arrInput: '[6,2,8,0,4,7,9,null,null,3,5]', p: 2, q: 8 },
    { label: 'LeetCode 2', arrInput: '[6,2,8,0,4,7,9,null,null,3,5]', p: 2, q: 4 },
    { label: 'Simple', arrInput: '[4,2,6,1,3,5,7]', p: 1, q: 3 },
    { label: 'Deep', arrInput: '[4,2,6,1,3,5,7]', p: 1, q: 7 },
]

export default function LCABSTVisualizer() {
    const [arrInput, setArrInput] = useState('[6,2,8,0,4,7,9,null,null,3,5]')
    const [pInput, setPInput] = useState('2')
    const [qInput, setQInput] = useState('8')
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const { arr, p, q, inputError } = useMemo(() => {
        try {
            const { arr, p, q } = parseInputs(arrInput, pInput, qInput)
            return { arr, p, q, inputError: '' }
        } catch (e) {
            return { arr: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 2, q: 8, inputError: e.message || 'Invalid input' }
        }
    }, [arrInput, pInput, qInput])

    const steps = useMemo(() => generateSteps(arr, p, q), [arr, p, q])
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useCallback((ex) => {
        setArrInput(ex.arrInput)
        setPInput(String(ex.p))
        setQInput(String(ex.q))
        handleReset()
    }, [handleReset])

    const positions = step?.positions ?? new Map()
    const edges = step?.edges ?? []
    const allNodes = step?.allNodes ?? []

    return (
        <div className="lca-shell">
            <div className="lca-top">
                <section className="lca-panel main">
                    <header className="lca-head">
                        <span>BST LCA — Walk Toward Split</span>
                        {inputError && <span className="lca-error">{inputError}</span>}
                    </header>
                    <div className="lca-body">
                        <div className="lca-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="lca-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <div className="lca-inputs">
                            <input className="lca-input wide" value={arrInput} onChange={(e) => { setArrInput(e.target.value); handleReset() }} placeholder="tree array" />
                            <div className="lca-pq">
                                <label>p=<input className="lca-input small" value={pInput} onChange={(e) => { setPInput(e.target.value); handleReset() }} /></label>
                                <label>q=<input className="lca-input small" value={qInput} onChange={(e) => { setQInput(e.target.value); handleReset() }} /></label>
                            </div>
                        </div>
                        <div className="lca-canvas" style={{ width: CANVAS_W, height: CANVAS_H }}>
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
                                const isVisited = step?.visitedIds?.has(node.id)
                                const isLCA = step?.lcaId === node.id && step?.lcaId !== -1
                                const isP = node.val === step?.pVal
                                const isQ = node.val === step?.qVal
                                return (
                                    <motion.div
                                        key={node.id}
                                        className={`lca-node ${isActive ? 'active' : ''} ${isVisited && !isActive ? 'visited' : ''} ${isLCA ? 'lca' : ''} ${isP ? 'p-node' : ''} ${isQ ? 'q-node' : ''}`}
                                        style={{ left: pos.x - NODE_R, top: pos.y - NODE_R }}
                                        animate={isActive ? { scale: 1.2 } : { scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    >
                                        {node.val}
                                        {isP && <span className="lca-tag p-tag">p</span>}
                                        {isQ && <span className="lca-tag q-tag">q</span>}
                                        {isLCA && <span className="lca-tag lca-tag-badge">LCA</span>}
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                <section className="lca-panel side">
                    <header className="lca-head"><span>Search State</span></header>
                    <div className="lca-body">
                        <div className="lca-targets">
                            <div className="lca-target p">
                                <span className="lca-label">p</span>
                                <strong>{step?.pVal ?? p}</strong>
                            </div>
                            <div className="lca-target q">
                                <span className="lca-label">q</span>
                                <strong>{step?.qVal ?? q}</strong>
                            </div>
                        </div>
                        <div className="lca-phase">
                            {step?.phase === 'go-left' && <span className="lca-dir">← going left</span>}
                            {step?.phase === 'go-right' && <span className="lca-dir">going right →</span>}
                            {step?.phase === 'found' && <span className="lca-found">Split found!</span>}
                        </div>
                        <div className={`lca-result ${step?.phase === 'done' ? 'ok' : ''}`}>
                            {step?.phase === 'done' && step?.lcaId !== -1
                                ? `LCA = ${allNodes.find((n) => n.id === step.lcaId)?.val}`
                                : 'Searching…'}
                        </div>
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className={`lca-status ${step?.phase === 'done' ? 'ok' : ''}`}>{step?.message || 'Press Play to begin.'}</div>
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
