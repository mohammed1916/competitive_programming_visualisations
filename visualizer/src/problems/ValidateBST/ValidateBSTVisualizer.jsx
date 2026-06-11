import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import { buildTree, computeLayout, collectNodes, buildEdges, parseTreeInput } from '../../components/treeUtils'
import './ValidateBSTVisualizer.css'

const CANVAS_W = 520
const CANVAS_H = 320
const NODE_R = 22

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def isValidBST(self, root):' },
    { line: 3, text: '        def valid(node, lo, hi):' },
    { line: 4, text: '            if not node: return True' },
    { line: 5, text: '            if node.val <= lo or node.val >= hi:' },
    { line: 6, text: '                return False' },
    { line: 7, text: '            return (valid(node.left,  lo, node.val)' },
    { line: 8, text: '                and valid(node.right, node.val, hi))' },
    { line: 9, text: '        return valid(root, -inf, inf)' },
]

function generateSteps(arr) {
    const root = buildTree(arr)
    const positions = computeLayout(root, CANVAS_W, 80)
    const edges = buildEdges(root)
    const allNodes = collectNodes(root)
    const steps = []

    if (!root) {
        return [{ phase: 'done', activeLine: 4, activeId: -1, validIds: new Set(), invalidIds: new Set(), result: true, positions, edges, allNodes, message: 'Empty tree → valid BST' }]
    }

    const validIds = new Set()
    const invalidIds = new Set()
    let result = true

    function dfs(node, lo, hi) {
        if (!node) return true

        const loStr = lo === -Infinity ? '-∞' : lo
        const hiStr = hi === Infinity ? '+∞' : hi

        steps.push({
            phase: 'check', activeLine: 5,
            activeId: node.id,
            validIds: new Set(validIds), invalidIds: new Set(invalidIds),
            lo, hi, result,
            positions, edges, allNodes,
            message: `Check node ${node.val}: must be in (${loStr}, ${hiStr})`,
        })

        if (node.val <= lo || node.val >= hi) {
            invalidIds.add(node.id)
            result = false
            steps.push({
                phase: 'invalid', activeLine: 6,
                activeId: node.id,
                validIds: new Set(validIds), invalidIds: new Set(invalidIds),
                lo, hi, result,
                positions, edges, allNodes,
                message: `INVALID: ${node.val} not in (${loStr}, ${hiStr}) → return false`,
            })
            return false
        }

        steps.push({
            phase: 'recurse-left', activeLine: 7,
            activeId: node.id,
            validIds: new Set(validIds), invalidIds: new Set(invalidIds),
            lo, hi, result,
            positions, edges, allNodes,
            message: `${node.val} OK. Recurse left with bounds (${loStr}, ${node.val})`,
        })

        const leftOk = dfs(node.left, lo, node.val)

        steps.push({
            phase: 'recurse-right', activeLine: 8,
            activeId: node.id,
            validIds: new Set(validIds), invalidIds: new Set(invalidIds),
            lo, hi, result,
            positions, edges, allNodes,
            message: `Recurse right with bounds (${node.val}, ${hiStr})`,
        })

        const rightOk = dfs(node.right, node.val, hi)

        if (leftOk && rightOk) {
            validIds.add(node.id)
        }
        return leftOk && rightOk
    }

    result = dfs(root, -Infinity, Infinity)

    steps.push({
        phase: 'done', activeLine: 9,
        activeId: -1,
        validIds: new Set(validIds), invalidIds: new Set(invalidIds),
        lo: -Infinity, hi: Infinity, result,
        positions, edges, allNodes,
        message: `Result: ${result ? '✓ Valid BST' : '✗ Not a valid BST'}`,
    })

    return steps
}

const EXAMPLES = [
    { label: 'Valid', arr: [5, 3, 7, 1, 4, 6, 8] },
    { label: 'Invalid', arr: [5, 1, 4, null, null, 3, 6] },
    { label: 'LeetCode', arr: [2, 1, 3] },
    { label: 'Tricky', arr: [10, 5, 15, null, null, 6, 20] },
]

export default function ValidateBSTVisualizer() {
    const [arrInput, setArrInput] = useState('[5,3,7,1,4,6,8]')
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const { arr, inputError } = useMemo(() => {
        try {
            return { arr: parseTreeInput(arrInput), inputError: '' }
        } catch (e) {
            return { arr: [5, 3, 7, 1, 4, 6, 8], inputError: e.message || 'Invalid input' }
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
        <div className="vbst-shell">
            <div className="vbst-top">
                <section className="vbst-panel main">
                    <header className="vbst-head">
                        <span>DFS with (lo, hi) bounds</span>
                        {inputError && <span className="vbst-error">{inputError}</span>}
                    </header>
                    <div className="vbst-body">
                        <div className="vbst-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="vbst-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <input className="vbst-input" value={arrInput} onChange={(e) => { setArrInput(e.target.value); handleReset() }} />
                        <div className="vbst-canvas" style={{ width: CANVAS_W, height: CANVAS_H }}>
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
                                const isValid = step?.validIds?.has(node.id)
                                const isInvalid = step?.invalidIds?.has(node.id)
                                return (
                                    <motion.div
                                        key={node.id}
                                        className={`vbst-node ${isActive ? 'active' : ''} ${isValid ? 'valid' : ''} ${isInvalid ? 'invalid' : ''}`}
                                        style={{ left: pos.x - NODE_R, top: pos.y - NODE_R }}
                                        animate={isActive ? { scale: 1.2 } : { scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    >
                                        {node.val}
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                <section className="vbst-panel side">
                    <header className="vbst-head"><span>Bounds</span></header>
                    <div className="vbst-body">
                        <div className="vbst-bounds">
                            <div className="vbst-bound-row">
                                <span className="vbst-label">lo</span>
                                <strong className="vbst-lo">{step?.lo === -Infinity ? '-∞' : step?.lo ?? '—'}</strong>
                            </div>
                            <div className="vbst-bound-row">
                                <span className="vbst-label">hi</span>
                                <strong className="vbst-hi">{step?.hi === Infinity ? '+∞' : step?.hi ?? '—'}</strong>
                            </div>
                            <div className="vbst-bound-row">
                                <span className="vbst-label">node</span>
                                <strong className="vbst-node-val">
                                    {step?.activeId != null && step.activeId !== -1
                                        ? allNodes.find((n) => n.id === step.activeId)?.val ?? '—'
                                        : '—'}
                                </strong>
                            </div>
                        </div>
                        <div className="vbst-legend">
                            <div className="vbst-legend-item"><div className="vbst-dot active" />Checking</div>
                            <div className="vbst-legend-item"><div className="vbst-dot valid" />Valid subtree</div>
                            <div className="vbst-legend-item"><div className="vbst-dot invalid" />Violation</div>
                        </div>
                        <div className={`vbst-result ${step?.phase === 'done' ? (step.result ? 'ok' : 'fail') : ''}`}>
                            {step?.phase === 'done'
                                ? (step.result ? '✓ Valid BST' : '✗ Not a Valid BST')
                                : 'Checking…'}
                        </div>
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className={`vbst-status ${step?.phase === 'done' ? (step?.result ? 'ok' : 'fail') : ''}`}>
                {step?.message || 'Press Play to begin.'}
            </div>
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
