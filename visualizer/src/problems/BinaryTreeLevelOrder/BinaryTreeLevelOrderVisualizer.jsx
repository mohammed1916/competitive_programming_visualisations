import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import { buildTree, computeLayout, collectNodes, buildEdges, parseTreeInput } from '../../components/treeUtils'
import { TreeCanvas3D } from '../../components/viz3d'
import './BinaryTreeLevelOrderVisualizer.css'

const CANVAS_W = 520
const CANVAS_H = 320
const NODE_R = 22

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def levelOrder(self, root):' },
    { line: 3, text: '        if not root: return []' },
    { line: 4, text: '        res, queue = [], deque([root])' },
    { line: 5, text: '        while queue:' },
    { line: 6, text: '            level = []' },
    { line: 7, text: '            for _ in range(len(queue)):' },
    { line: 8, text: '                node = queue.popleft()' },
    { line: 9, text: '                level.append(node.val)' },
    { line: 10, text: '                if node.left:  queue.append(node.left)' },
    { line: 11, text: '                if node.right: queue.append(node.right)' },
    { line: 12, text: '            res.append(level)' },
    { line: 13, text: '        return res' },
]

function generateSteps(arr) {
    const root = buildTree(arr)
    const positions = computeLayout(root, CANVAS_W, 80)
    const edges = buildEdges(root)
    const allNodes = collectNodes(root)
    const steps = []

    if (!root) {
        return [{ phase: 'done', activeLine: 3, activeIds: new Set(), visitedIds: new Set(), queueIds: new Set(), levels: [], positions, edges, allNodes, message: 'Empty tree → return []' }]
    }

    const visitedIds = new Set()
    const levels = []

    steps.push({ phase: 'init', activeLine: 4, activeIds: new Set(), visitedIds: new Set(visitedIds), queueIds: new Set([root.id]), levels: [...levels], positions, edges, allNodes, message: 'Init queue with root.' })

    let queue = [root]

    while (queue.length) {
        const levelSize = queue.length
        const levelVals = []
        const levelIds = queue.map((n) => n.id)

        steps.push({
            phase: 'level-start', activeLine: 6,
            activeIds: new Set(levelIds), visitedIds: new Set(visitedIds),
            queueIds: new Set(queue.map((n) => n.id)),
            levels: [...levels],
            positions, edges, allNodes,
            message: `Start new level with ${levelSize} node(s): [${queue.map((n) => n.val).join(', ')}]`,
        })

        const nextQueue = []

        for (let i = 0; i < levelSize; i++) {
            const node = queue[i]
            visitedIds.add(node.id)
            levelVals.push(node.val)

            if (node.left) nextQueue.push(node.left)
            if (node.right) nextQueue.push(node.right)

            steps.push({
                phase: 'visit', activeLine: 9,
                activeIds: new Set([node.id]),
                visitedIds: new Set(visitedIds),
                queueIds: new Set(nextQueue.map((n) => n.id)),
                levels: [...levels],
                positions, edges, allNodes,
                message: `Visit node ${node.val}. Add value to current level.`,
            })
        }

        levels.push([...levelVals])

        steps.push({
            phase: 'level-done', activeLine: 12,
            activeIds: new Set(),
            visitedIds: new Set(visitedIds),
            queueIds: new Set(nextQueue.map((n) => n.id)),
            levels: [...levels],
            positions, edges, allNodes,
            message: `Level complete: [${levelVals.join(', ')}]. Result so far: ${JSON.stringify(levels)}`,
        })

        queue = nextQueue
    }

    steps.push({
        phase: 'done', activeLine: 13,
        activeIds: new Set(), visitedIds: new Set(visitedIds), queueIds: new Set(),
        levels: [...levels], positions, edges, allNodes,
        message: `BFS complete. Result: ${JSON.stringify(levels)}`,
    })

    return steps
}

const EXAMPLES = [
    { label: 'LeetCode', arr: [3, 9, 20, null, null, 15, 7] },
    { label: 'Full', arr: [1, 2, 3, 4, 5, 6, 7] },
    { label: 'Skewed', arr: [1, 2, null, 3, null, 4] },
    { label: 'Single', arr: [1] },
]

export default function BinaryTreeLevelOrderVisualizer() {
    const [arrInput, setArrInput] = useState('[3,9,20,null,null,15,7]')
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const { arr, inputError } = useMemo(() => {
        try {
            return { arr: parseTreeInput(arrInput), inputError: '' }
        } catch (e) {
            return { arr: [3, 9, 20, null, null, 15, 7], inputError: e.message || 'Invalid input' }
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

    // Color level bands
    const LEVEL_COLORS = ['#89b4fa', '#a6e3a1', '#f9e2af', '#cba6f7', '#f38ba8', '#89dceb']

    return (
        <div className="btlo-shell">
            <div className="btlo-top">
                <section className="btlo-panel main">
                    <header className="btlo-head">
                        <span>BFS Level-by-Level</span>
                        {inputError && <span className="btlo-error">{inputError}</span>}
                    </header>
                    <div className="btlo-body">
                        <div className="btlo-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="btlo-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <input className="btlo-input" value={arrInput} onChange={(e) => { setArrInput(e.target.value); handleReset() }} />
                        <div className="btlo-canvas" style={{ width: CANVAS_W, height: CANVAS_H }}>
                            <TreeCanvas3D
                                positions={positions}
                                edges={edges}
                                allNodes={allNodes}
                                activeIds={step?.activeIds ?? new Set()}
                                visitedIds={step?.visitedIds ?? new Set()}
                                queueIds={step?.queueIds ?? new Set()}
                                canvasWidth={CANVAS_W}
                                canvasHeight={CANVAS_H}
                                nodeRadius={NODE_R}
                            />
                        </div>
                    </div>
                </section>

                <section className="btlo-panel side">
                    <header className="btlo-head"><span>Result</span></header>
                    <div className="btlo-body">
                        <div className="btlo-queue-label">Queue: [{[...(step?.queueIds ?? [])].join(', ')}]</div>
                        <div className="btlo-levels">
                            {(step?.levels ?? []).map((level, i) => (
                                <div key={i} className="btlo-level-row" style={{ borderLeftColor: LEVEL_COLORS[i % LEVEL_COLORS.length] }}>
                                    <span className="btlo-level-idx">L{i}</span>
                                    <span className="btlo-level-vals">[{level.join(', ')}]</span>
                                </div>
                            ))}
                            {(step?.levels?.length === 0) && <div className="btlo-empty">No levels yet</div>}
                        </div>
                        <div className={`btlo-result ${step?.phase === 'done' ? 'ok' : ''}`}>
                            {step?.phase === 'done' ? `${step.levels.length} levels` : 'Running BFS…'}
                        </div>
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className={`btlo-status ${step?.phase === 'done' ? 'ok' : ''}`}>{step?.message || 'Press Play to begin.'}</div>
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
