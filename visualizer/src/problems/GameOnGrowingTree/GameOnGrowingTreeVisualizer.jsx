import { useCallback, useMemo, useState } from 'react'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './GameOnGrowingTreeVisualizer.css'

const MAX_TREE_NODES_TO_RENDER = 120

const SOLUTION_CODE = [
    { line: 1, text: 'N = q' },
    { line: 2, text: 'P = [0] + [v[i] - 1 for i in range(N)]' },
    { line: 3, text: 'if N == 1: print(1); return' },
    { line: 4, text: '' },
    { line: 5, text: 'def sol(m):' },
    { line: 6, text: '    DP1, DP2, DP3 = [0]*m, [0]*m, [0]*m' },
    { line: 7, text: '    for x in range(m-1, 0, -1): update parent with DP2[x] + 1' },
    { line: 8, text: '    for x in range(1, m): reroot contribution from parent into x' },
    { line: 9, text: '    return max(DP2) + 1' },
    { line: 10, text: '' },
    { line: 11, text: 'Z = [0,1,1,2] + [0]*N' },
    { line: 12, text: 'Z[N+2] = 17; stack = [(3, N+2)]' },
    { line: 13, text: 'while stack:' },
    { line: 14, text: '    l, r = stack.pop(); m = (l + r) // 2; c = sol(m); Z[m] = c' },
    { line: 15, text: '    fill equal segments or split intervals recursively' },
    { line: 16, text: 'print(Z[2:N+2])' },
]

const EXAMPLES = [
    {
        label: 'Sample',
        q: '9',
        parents: '1 1 3 3 1 2 1 2 8',
    },
    {
        label: 'Chain',
        q: '8',
        parents: '1 2 3 4 5 6 7 8',
    },
    {
        label: 'Star',
        q: '8',
        parents: '1 1 1 1 1 1 1 1',
    },
]

function updateTop3(dp1, dp2, dp3, idx, val) {
    if (val > dp1[idx]) {
        dp3[idx] = dp2[idx]
        dp2[idx] = dp1[idx]
        dp1[idx] = val
        return
    }
    if (val > dp2[idx]) {
        dp3[idx] = dp2[idx]
        dp2[idx] = val
        return
    }
    if (val > dp3[idx]) {
        dp3[idx] = val
    }
}

function scoreForPrefix(parentZeroBased, m) {
    const dp1 = new Array(m).fill(0)
    const dp2 = new Array(m).fill(0)
    const dp3 = new Array(m).fill(0)

    for (let x = m - 1; x >= 1; x -= 1) {
        const p = parentZeroBased[x]
        const d = dp2[x] + 1
        updateTop3(dp1, dp2, dp3, p, d)
    }

    for (let x = 1; x < m; x += 1) {
        const p = parentZeroBased[x]
        const d = dp2[p] <= dp2[x] + 1 ? dp3[p] + 1 : dp2[p] + 1
        updateTop3(dp1, dp2, dp3, x, d)
    }

    let best = 0
    for (let i = 0; i < m; i += 1) {
        if (dp2[i] > best) best = dp2[i]
    }
    return best + 1
}

function solveAndBuildSteps(q, parentInput) {
    const raw = parentInput
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((x) => Number(x))

    if (!Number.isInteger(q) || q < 1 || q > 200000) {
        throw new Error('q must be an integer in [1, 200000].')
    }
    if (raw.length !== q) {
        throw new Error(`Expected ${q} parent values but got ${raw.length}.`)
    }

    const parentZeroBased = [0]
    for (let i = 0; i < q; i += 1) {
        const v = raw[i]
        if (!Number.isInteger(v) || v < 1 || v > i + 1) {
            throw new Error(`Invalid parent v_${i + 1} = ${v}. Must satisfy 1 <= v_i <= i.`)
        }
        parentZeroBased.push(v - 1)
    }

    const steps = []
    if (q === 1) {
        const answers = [1]
        steps.push({
            activeLine: 3,
            message: 'Only one query, answer is 1.',
            l: null,
            r: null,
            m: null,
            c: null,
            stackSize: 0,
            answers,
        })
        return { answers, steps }
    }

    const z = new Array(q + 4).fill(0)
    z[1] = 1
    z[2] = 1
    z[3] = 2
    z[q + 2] = 17

    const stack = [[3, q + 2]]

    steps.push({
        activeLine: 12,
        message: 'Initialize sentinel boundaries and start interval stack.',
        l: 3,
        r: q + 2,
        m: null,
        c: null,
        stackSize: stack.length,
        answers: z.slice(2, q + 2),
    })

    const capture = (activeLine, message, l, r, m, c) => {
        steps.push({
            activeLine,
            message,
            l,
            r,
            m,
            c,
            stackSize: stack.length,
            answers: z.slice(2, q + 2),
        })
    }

    while (stack.length > 0) {
        const [l, r] = stack.pop()
        const m = (l + r) >> 1

        capture(14, `Pop interval [${l}, ${r}], evaluate midpoint m=${m}.`, l, r, m, null)

        const c = scoreForPrefix(parentZeroBased, m)
        z[m] = c
        capture(14, `Computed sol(${m}) = ${c}.`, l, r, m, c)

        if (z[l] === z[m]) {
            for (let i = l + 1; i < m; i += 1) z[i] = c
            capture(15, `Left side flattened because Z[l] == Z[m] == ${c}.`, l, r, m, c)
        } else if (l + 1 < m) {
            stack.push([l, m])
            capture(15, `Left side split, push [${l}, ${m}].`, l, r, m, c)
        }

        if (z[m] === z[r]) {
            for (let i = m + 1; i < r; i += 1) z[i] = c
            capture(15, `Right side flattened because Z[m] == Z[r] == ${c}.`, l, r, m, c)
        } else if (m + 1 < r) {
            stack.push([m, r])
            capture(15, `Right side split, push [${m}, ${r}].`, l, r, m, c)
        }
    }

    const answers = z.slice(2, q + 2)
    capture(16, 'All intervals resolved. Final answers ready.', null, null, null, null)

    return { answers, steps }
}

function buildTreeData(parentZeroBased, m) {
    const renderCount = Math.min(m, MAX_TREE_NODES_TO_RENDER)
    const adj = Array.from({ length: renderCount }, () => [])

    for (let node = 1; node < renderCount; node += 1) {
        const p = parentZeroBased[node]
        if (p >= renderCount) continue
        adj[p].push(node)
        adj[node].push(p)
    }

    const parent = new Array(renderCount).fill(-1)
    const depth = new Array(renderCount).fill(0)
    const levels = []
    const queue = [0]
    parent[0] = 0

    for (let qi = 0; qi < queue.length; qi += 1) {
        const u = queue[qi]
        const d = depth[u]
        if (!levels[d]) levels[d] = []
        levels[d].push(u)

        for (const v of adj[u]) {
            if (parent[v] !== -1) continue
            parent[v] = u
            depth[v] = d + 1
            queue.push(v)
        }
    }

    const positions = new Map()
    levels.forEach((nodes, levelIdx) => {
        const y = 44 + levelIdx * 74
        const count = nodes.length
        const width = Math.max(1, count)
        nodes.forEach((node, idx) => {
            const x = ((idx + 1) * 1000) / (width + 1)
            positions.set(node, { x, y })
        })
    })

    const edges = []
    for (let node = 1; node < renderCount; node += 1) {
        const p = parent[node]
        if (p > -1 && p !== node) edges.push({ from: p, to: node })
    }

    return {
        renderCount,
        adj,
        depth,
        positions,
        edges,
        truncated: m > renderCount,
    }
}

function pickBobNode(adj, states, chip) {
    let best = -1
    let bestScore = -1

    for (let node = 0; node < states.length; node += 1) {
        if (states[node] !== 'white') continue
        let whiteDeg = 0
        for (const v of adj[node]) {
            if (states[v] === 'white') whiteDeg += 1
        }

        const score = whiteDeg * 1000 - Math.abs(node - chip)
        if (score > bestScore) {
            bestScore = score
            best = node
        }
    }

    return best
}

function pickAliceMove(adj, states, chip) {
    let best = -1
    let bestScore = -1

    for (const next of adj[chip]) {
        if (states[next] !== 'white') continue

        let onward = 0
        for (const v of adj[next]) {
            if (states[v] === 'white') onward += 1
        }

        const score = onward * 1000 - next
        if (score > bestScore) {
            bestScore = score
            best = next
        }
    }

    return best
}

function simulateTreeGame(treeData) {
    const { renderCount, adj } = treeData
    const states = new Array(renderCount).fill('white')
    const chipPath = []

    let start = 0
    let startDegree = -1
    for (let node = 0; node < renderCount; node += 1) {
        const deg = adj[node].length
        if (deg > startDegree) {
            startDegree = deg
            start = node
        }
    }

    states[start] = 'red'
    chipPath.push(start)
    let chip = start

    while (true) {
        const bob = pickBobNode(adj, states, chip)
        if (bob !== -1) states[bob] = 'blue'

        const next = pickAliceMove(adj, states, chip)
        if (next === -1) break

        states[next] = 'red'
        chip = next
        chipPath.push(chip)
    }

    const blockedEdges = new Set()
    for (const v of adj[chip]) {
        if (states[v] !== 'white') {
            const a = Math.min(chip, v)
            const b = Math.max(chip, v)
            blockedEdges.add(`${a}-${b}`)
        }
    }

    return {
        states,
        chip,
        chipPath,
        blockedEdges,
    }
}

export default function GameOnGrowingTreeVisualizer() {
    const [qInput, setQInput] = useState('9')
    const [parentsInput, setParentsInput] = useState('1 1 3 3 1 2 1 2 8')

    const { answers, steps, inputError } = useMemo(() => {
        try {
            const q = Number(qInput.trim())
            const result = solveAndBuildSteps(q, parentsInput)
            return { answers: result.answers, steps: result.steps, inputError: '' }
        } catch (error) {
            return {
                answers: [],
                steps: [],
                inputError: error?.message || 'Invalid input',
            }
        }
    }, [qInput, parentsInput])

    const {
        stepIndex,
        stepForward,
        stepBack,
        togglePlay,
        handleReset,
        isPlaying,
        speed,
        setSpeed,
        isDone,
    } = usePlaybackState(steps.length, 650)

    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const currentTree = useMemo(() => {
        if (!step?.m) return null
        const m = Number(step.m)
        if (!Number.isInteger(m) || m < 1 || m > answers.length + 1) return null

        const raw = parentsInput
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map((x) => Number(x))

        if (raw.length === 0) return null

        const parentZeroBased = [0]
        for (let i = 0; i < raw.length; i += 1) {
            parentZeroBased.push(raw[i] - 1)
        }

        const treeData = buildTreeData(parentZeroBased, m)
        const game = simulateTreeGame(treeData)
        return { ...treeData, ...game, m }
    }, [answers.length, parentsInput, step?.m])

    const onApplyExample = useCallback((example) => {
        setQInput(example.q)
        setParentsInput(example.parents)
        handleReset()
    }, [handleReset])

    return (
        <div className="gogt-shell">
            <div className="gogt-top">
                <section className="gogt-panel">
                    <header className="gogt-panel-head">
                        <span>Input</span>
                        {inputError && <span className="gogt-error">{inputError}</span>}
                    </header>

                    <div className="gogt-panel-body">
                        <div className="gogt-examples">
                            {EXAMPLES.map((example) => (
                                <button
                                    key={example.label}
                                    className="gogt-example-btn"
                                    onClick={() => onApplyExample(example)}
                                >
                                    {example.label}
                                </button>
                            ))}
                        </div>

                        <label className="gogt-field">
                            <span>q</span>
                            <input
                                value={qInput}
                                onChange={(event) => {
                                    setQInput(event.target.value)
                                    handleReset()
                                }}
                                className="gogt-input"
                                placeholder="Number of queries"
                            />
                        </label>

                        <label className="gogt-field">
                            <span>parents (v1..vq)</span>
                            <textarea
                                value={parentsInput}
                                onChange={(event) => {
                                    setParentsInput(event.target.value)
                                    handleReset()
                                }}
                                className="gogt-textarea"
                                rows={4}
                                placeholder="Space separated parent list"
                            />
                        </label>

                        <div className="gogt-output-wrap">
                            <div className="gogt-output-label">Final output</div>
                            <div className="gogt-output mono">
                                {answers.length ? answers.join(' ') : 'No output yet'}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="gogt-panel">
                    <header className="gogt-panel-head">
                        <span>Interval Compression Playback</span>
                        <span className="gogt-chip">
                            Step {stepIndex >= 0 ? stepIndex + 1 : 0}/{steps.length}
                        </span>
                    </header>

                    <div className="gogt-panel-body">
                        <PlaybackControls
                            className="gogt-controls"
                            buttonsGroupClassName="gogt-controls-buttons"
                            onReset={handleReset}
                            onPrev={stepBack}
                            onPlayToggle={togglePlay}
                            onNext={stepForward}
                            resetDisabled={stepIndex < 0}
                            prevDisabled={stepIndex < 0}
                            nextDisabled={isDone || steps.length === 0}
                            isPlaying={isPlaying}
                            isDone={isDone}
                            speed={speed}
                            speedRangeValue={1500 - speed}
                            onSpeedChange={(event) => setSpeed(1500 - Number(event.target.value))}
                            speedMin={120}
                            speedMax={1420}
                            speedStep={20}
                            speedLabel="Playback"
                            speedIndicator={`${((1600 - speed) / 300).toFixed(1)}x`}
                        />

                        <div className="gogt-status">
                            {step?.message || 'Press Play or Next to start.'}
                        </div>

                        <div className="gogt-metrics">
                            <div className="gogt-metric">
                                <span>interval</span>
                                <strong>{step?.l != null && step?.r != null ? `[${step.l}, ${step.r}]` : '-'}</strong>
                            </div>
                            <div className="gogt-metric">
                                <span>midpoint m</span>
                                <strong>{step?.m ?? '-'}</strong>
                            </div>
                            <div className="gogt-metric">
                                <span>score c</span>
                                <strong>{step?.c ?? '-'}</strong>
                            </div>
                            <div className="gogt-metric">
                                <span>stack size</span>
                                <strong>{step?.stackSize ?? 0}</strong>
                            </div>
                        </div>

                        <div className="gogt-output-wrap">
                            <div className="gogt-output-label">Partial answers at this step</div>
                            <div className="gogt-output mono">
                                {step?.answers ? step.answers.join(' ') : 'No step yet'}
                            </div>
                        </div>
                    </div>
                </section>

                <CodeTracePanel
                    step={step}
                    codeLines={SOLUTION_CODE}
                    title="Simplified Solution Trace"
                    subtitle={
                        step
                            ? `Active line ${step.activeLine}: ${step.message}`
                            : 'Trace your simplified Codeforces solution line-by-line.'
                    }
                />

                <section className="gogt-panel gogt-tree-panel">
                    <header className="gogt-panel-head">
                        <span>Tree State Preview</span>
                        <span className="gogt-chip">
                            {currentTree?.m ? `prefix m=${currentTree.m}` : 'waiting'}
                        </span>
                    </header>

                    <div className="gogt-panel-body">
                        <div className="gogt-tree-note">
                            Red: Alice path, Blue: Bob blocks, Gray edge: blocked move from current chip.
                        </div>

                        <div className="gogt-tree-canvas">
                            {currentTree ? (
                                <svg viewBox="0 0 1000 620" className="gogt-svg" role="img" aria-label="Game tree preview">
                                    {currentTree.edges.map((edge) => {
                                        const from = currentTree.positions.get(edge.from)
                                        const to = currentTree.positions.get(edge.to)
                                        if (!from || !to) return null

                                        const edgeKey = `${Math.min(edge.from, edge.to)}-${Math.max(edge.from, edge.to)}`
                                        const isBlocked = currentTree.blockedEdges.has(edgeKey)
                                        const inPath = currentTree.chipPath.some((node, idx) => {
                                            if (idx === 0) return false
                                            const a = currentTree.chipPath[idx - 1]
                                            const b = node
                                            return (
                                                Math.min(a, b) === Math.min(edge.from, edge.to)
                                                && Math.max(a, b) === Math.max(edge.from, edge.to)
                                            )
                                        })

                                        return (
                                            <line
                                                key={`${edge.from}-${edge.to}`}
                                                x1={from.x}
                                                y1={from.y}
                                                x2={to.x}
                                                y2={to.y}
                                                className={`gogt-edge ${isBlocked ? 'blocked' : inPath ? 'path' : ''}`}
                                            />
                                        )
                                    })}

                                    {Array.from({ length: currentTree.renderCount }, (_, node) => {
                                        const pos = currentTree.positions.get(node)
                                        if (!pos) return null

                                        const state = currentTree.states[node]
                                        const isChip = currentTree.chip === node

                                        return (
                                            <g key={node} transform={`translate(${pos.x}, ${pos.y})`}>
                                                <circle className={`gogt-node ${state} ${isChip ? 'chip' : ''}`} r="16" />
                                                <text className="gogt-node-label" textAnchor="middle" dy="5">{node + 1}</text>
                                            </g>
                                        )
                                    })}
                                </svg>
                            ) : (
                                <div className="gogt-tree-empty">Press Play or Next to render the tree for current midpoint.</div>
                            )}
                        </div>

                        {currentTree?.truncated ? (
                            <div className="gogt-tree-truncated">
                                Rendering first {MAX_TREE_NODES_TO_RENDER} nodes only for clarity.
                            </div>
                        ) : null}
                    </div>
                </section>
            </div>
        </div>
    )
}
