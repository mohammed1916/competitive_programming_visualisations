import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { buildTree, computeLayout, collectNodes, buildEdges } from '../../components/treeUtils'
import './SubtreeVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'def isSubtree(root, subRoot):' },
    { line: 2, text: '    if not root: return not subRoot' },
    { line: 3, text: '    if isSameTree(root, subRoot): return True' },
    { line: 4, text: '    return (isSubtree(root.left, subRoot) or' },
    { line: 5, text: '            isSubtree(root.right, subRoot))' },
    { line: 6, text: '' },
    { line: 7, text: 'def isSameTree(p, q):' },
    { line: 8, text: '    if not p and not q: return True' },
    { line: 9, text: '    if not p or not q: return False' },
    { line: 10, text: '    if p.val != q.val: return False' },
    { line: 11, text: '    return (isSameTree(p.left, q.left) and' },
    { line: 12, text: '            isSameTree(p.right, q.right))' },
]

function isSameTree(p, q) {
    if (!p && !q) return true
    if (!p || !q) return false
    if (p.val !== q.val) return false
    return isSameTree(p.left, q.left) && isSameTree(p.right, q.right)
}

function generateSteps(rootArr, subArr) {
    const root = buildTree(rootArr)
    const sub = buildTree(subArr)
    const steps = []

    function dfs(node) {
        if (!node) return false

        steps.push({
            phase: 'check', activeLine: 3,
            checkingId: node.id, result: null,
            message: `Check if subtree rooted at node ${node.val} matches subRoot`,
        })

        const same = isSameTree(node, sub)
        steps.push({
            phase: same ? 'match' : 'nomatch', activeLine: same ? 3 : 4,
            checkingId: node.id, result: same,
            message: same
                ? `Match found at node ${node.val}! Trees are the same.`
                : `No match at node ${node.val}. Recurse into children.`,
        })

        if (same) return true

        return dfs(node.left) || dfs(node.right)
    }

    steps.push({ phase: 'init', activeLine: 1, checkingId: null, result: null, message: 'Start isSubtree check' })

    const found = root ? dfs(root) : false

    steps.push({
        phase: 'done', activeLine: found ? 3 : 5,
        checkingId: null, result: found,
        message: found ? 'Result: true — subRoot is a subtree of root' : 'Result: false — subRoot is NOT a subtree of root',
    })

    return steps
}

const EXAMPLES = [
    { label: 'Example 1', root: [3, 4, 5, 1, 2], sub: [4, 1, 2] },
    { label: 'Example 2', root: [3, 4, 5, 1, 2, null, null, null, null, 0], sub: [4, 1, 2] },
    { label: 'Same root', root: [1, 2, 3], sub: [1, 2, 3] },
]

function parseArr(str) {
    try {
        const parsed = JSON.parse(str)
        if (!Array.isArray(parsed)) throw new Error('Must be array')
        return { arr: parsed, err: '' }
    } catch (e) {
        return { arr: [], err: e.message }
    }
}

function TreeViz({ root, checkingId, matchId, foundId, label, accent }) {
    if (!root) return <div className="sot-empty">{label}: empty</div>
    const W = 360, LH = 64
    const layout = computeLayout(root, W, LH)
    const nodes = collectNodes(root)
    const edges = buildEdges(root)
    const totalH = (Math.max(...nodes.map((n) => n.depth), 0) + 1) * LH + 20

    return (
        <div className="sot-tree-wrap">
            <div className="sot-tree-label">{label}</div>
            <div className="sot-tree-canvas" style={{ width: W, height: totalH, position: 'relative' }}>
                <svg style={{ position: 'absolute', inset: 0, overflow: 'visible' }} width={W} height={totalH}>
                    {edges.map((e) => {
                        const pn = layout.get(e.from); const cn = layout.get(e.to)
                        if (!pn || !cn) return null
                        return <line key={`${e.from}-${e.to}`} x1={pn.x} y1={pn.y} x2={cn.x} y2={cn.y} stroke="#45475a" strokeWidth={2} />
                    })}
                </svg>
                {nodes.map((nd) => {
                    const pos = layout.get(nd.id)
                    if (!pos) return null
                    const isChecking = nd.id === checkingId
                    const isMatch = foundId != null && nd.id === foundId
                    return (
                        <motion.div key={nd.id}
                            className={`sot-node ${isChecking ? 'checking' : ''} ${isMatch ? 'match' : ''}`}
                            style={{ left: pos.x - 22, top: pos.y - 22, borderColor: accent }}
                            animate={{ scale: isChecking ? 1.18 : 1, borderColor: isMatch ? '#a6e3a1' : isChecking ? '#f9e2af' : accent }}
                            transition={{ type: 'spring', stiffness: 400, damping: 22 }}>
                            {nd.val}
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

export default function SubtreeVisualizer() {
    const [rootInput, setRootInput] = useState('[3,4,5,1,2]')
    const [subInput, setSubInput] = useState('[4,1,2]')

    const { arr: rootArr, err: rootErr } = useMemo(() => parseArr(rootInput), [rootInput])
    const { arr: subArr, err: subErr } = useMemo(() => parseArr(subInput), [subInput])

    const root = useMemo(() => buildTree(rootArr), [rootArr])
    const sub = useMemo(() => buildTree(subArr), [subArr])

    const steps = useMemo(() => generateSteps(rootArr, subArr), [rootArr, subArr])
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useCallback((ex) => {
        setRootInput(JSON.stringify(ex.root))
        setSubInput(JSON.stringify(ex.sub))
        handleReset()
    }, [handleReset])

    const matchId = step?.result === true ? step?.checkingId : null

    return (
        <div className="sot-shell">
            <div className="sot-controls-row">
                <div className="sot-examples">
                    {EXAMPLES.map((ex) => (
                        <button key={ex.label} className="sot-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                    ))}
                </div>
                <div className="sot-inputs">
                    <label>Root tree: <input className="sot-input" value={rootInput} onChange={(e) => { setRootInput(e.target.value); handleReset() }} /></label>
                    <label>Sub tree: <input className="sot-input" value={subInput} onChange={(e) => { setSubInput(e.target.value); handleReset() }} /></label>
                </div>
                {(rootErr || subErr) && <span className="sot-error">{rootErr || subErr}</span>}
            </div>

            <div className="sot-trees-row">
                <TreeViz root={root} checkingId={step?.checkingId} matchId={matchId} foundId={matchId} label="Root" accent="#89b4fa" />
                <div className="sot-vs">vs</div>
                <TreeViz root={sub} checkingId={null} matchId={null} foundId={null} label="SubRoot" accent="#a6e3a1" />
            </div>

            {step?.result === true && <div className="sot-result match">✓ Subtree found!</div>}
            {step?.phase === 'done' && step?.result === false && <div className="sot-result no-match">✗ Not a subtree</div>}

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="sot-status">{step?.message || 'Press Play to begin.'}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
            />
        </div>
    )
}
