import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './GameOnGrowingTreeVisualizer.css'

const MAX_TREE_NODES_TO_RENDER = 120

const SOLUTION_CODE = [
    { line: 1, text: 'n = int(input())' },
    { line: 2, text: 'parent = [0] + [x - 1 for x in map(int, input().split())]' },
    { line: 3, text: 'if n == 1: print(1); exit()' },
    { line: 4, text: '' },
    { line: 5, text: 'def solve(size):' },
    { line: 6, text: '    first = [0] * size' },
    { line: 7, text: '    second = [0] * size' },
    { line: 8, text: '    third = [0] * size' },
    { line: 9, text: '    for node in range(size - 1, 0, -1):' },
    { line: 10, text: '        p = parent[node]' },
    { line: 11, text: '        depth = second[node] + 1' },
    { line: 12, text: '        if depth > first[p]: first[p], second[p], third[p] = depth, first[p], second[p]' },
    { line: 13, text: '        elif depth > second[p]: second[p], third[p] = depth, second[p]' },
    { line: 14, text: '        elif depth > third[p]: third[p] = depth' },
    { line: 15, text: '    for node in range(1, size):' },
    { line: 16, text: '        p = parent[node]' },
    { line: 17, text: '        if second[p] <= second[node] + 1:' },
    { line: 18, text: '            depth = third[p] + 1' },
    { line: 19, text: '        else:' },
    { line: 20, text: '            depth = second[p] + 1' },
    { line: 21, text: '        if depth > first[node]: first[node], second[node], third[node] = depth, first[node], second[node]' },
    { line: 22, text: '        elif depth > second[node]: second[node], third[node] = depth, second[node]' },
    { line: 23, text: '        elif depth > third[node]: third[node] = depth' },
    { line: 24, text: '    return max(second) + 1' },
    { line: 25, text: '' },
    { line: 26, text: 'ans = [0, 1, 1, 2] + [0] * n' },
    { line: 27, text: 'ans[n + 2] = 17' },
    { line: 28, text: 'stack = [(3, n + 2)]' },
    { line: 29, text: 'while stack:' },
    { line: 30, text: '    left, right = stack.pop()' },
    { line: 31, text: '    mid = (left + right) >> 1' },
    { line: 32, text: '    value = solve(mid)' },
    { line: 33, text: '    ans[mid] = value' },
    { line: 34, text: '    if ans[left] == ans[mid]:' },
    { line: 35, text: '        for i in range(left + 1, mid): ans[i] = value' },
    { line: 36, text: '    elif left + 1 < mid:' },
    { line: 37, text: '        stack.append((left, mid))' },
    { line: 38, text: '    if ans[mid] == ans[right]:' },
    { line: 39, text: '        for i in range(mid + 1, right): ans[i] = value' },
    { line: 40, text: '    elif mid + 1 < right:' },
    { line: 41, text: '        stack.append((mid, right))' },
    { line: 42, text: 'print(*ans[2:n + 2])' },
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

function insertTop3(first, second, third, idx, value) {
    if (value > first[idx]) {
        third[idx] = second[idx]
        second[idx] = first[idx]
        first[idx] = value
        return 1
    }
    if (value > second[idx]) {
        third[idx] = second[idx]
        second[idx] = value
        return 2
    }
    if (value > third[idx]) {
        third[idx] = value
        return 3
    }
    return 0
}

function scoreForPrefix(parentZeroBased, size) {
    const first = new Array(size).fill(0)
    const second = new Array(size).fill(0)
    const third = new Array(size).fill(0)

    for (let node = size - 1; node >= 1; node -= 1) {
        const parent = parentZeroBased[node]
        const depth = second[node] + 1
        insertTop3(first, second, third, parent, depth)
    }

    for (let node = 1; node < size; node += 1) {
        const parent = parentZeroBased[node]
        const depth = second[parent] <= second[node] + 1 ? third[parent] + 1 : second[parent] + 1
        insertTop3(first, second, third, node, depth)
    }

    let best = 0
    for (let i = 0; i < size; i += 1) {
        if (second[i] > best) best = second[i]
    }
    return best + 1
}

function createParentParseSteps(raw) {
    const parsed = []
    const steps = []

    raw.forEach((value, idx) => {
        const zeroBased = value - 1
        parsed.push(zeroBased)
        steps.push({
            phase: 'parse-parent',
            activeLine: 2,
            relatedLines: [2],
            message: `Read parent ${value} for node ${idx + 1} and store ${zeroBased}.`,
            parsedParents: [...parsed],
            currentParentIndex: idx,
            currentParentValue: zeroBased,
        })
    })

    return steps
}

function solveWithTrace(parentZeroBased, size, answersSnapshot) {
    const first = new Array(size).fill(0)
    const second = new Array(size).fill(0)
    const third = new Array(size).fill(0)
    const steps = []
    const snapshotLimit = Math.min(size, MAX_TREE_NODES_TO_RENDER)

    const capture = (activeLine, message, relatedLines = [activeLine], focus = null) => {
        steps.push({
            activeLine,
            relatedLines,
            message,
            subproblemSize: size,
            stackSize: 0,
            focus,
            dpSnapshot: {
                first: first.slice(0, snapshotLimit),
                second: second.slice(0, snapshotLimit),
                third: third.slice(0, snapshotLimit),
            },
            answers: answersSnapshot,
        })
    }

    capture(6, `Initialize top-3 arrays for size ${size}.`, [6, 7, 8])

    for (let node = size - 1; node >= 1; node -= 1) {
        const parent = parentZeroBased[node]
        const depth = second[node] + 1
        capture(9, `Bottom-up: node ${node} contributes depth ${depth} to parent ${parent}.`, [9, 10, 11], {
            sourceNode: node,
            targetNode: parent,
            direction: 'up',
            phase: 'bottom-up',
        })

        const which = insertTop3(first, second, third, parent, depth)
        if (which === 1) {
            capture(12, `depth ${depth} becomes first[${parent}] and shifts the previous values right.`, [12, 13, 14], {
                sourceNode: node,
                targetNode: parent,
                direction: 'up',
                phase: 'bottom-up',
            })
        } else if (which === 2) {
            capture(13, `depth ${depth} becomes second[${parent}] and shifts third.`, [13, 14], {
                sourceNode: node,
                targetNode: parent,
                direction: 'up',
                phase: 'bottom-up',
            })
        } else if (which === 3) {
            capture(14, `depth ${depth} becomes third[${parent}].`, [14], {
                sourceNode: node,
                targetNode: parent,
                direction: 'up',
                phase: 'bottom-up',
            })
        }
    }

    for (let node = 1; node < size; node += 1) {
        const parent = parentZeroBased[node]
        const useThird = second[parent] <= second[node] + 1
        const depth = useThird ? third[parent] + 1 : second[parent] + 1
        capture(15, `Top-down: node ${node} receives depth ${depth} from parent ${parent}.`, [15, 16, 17, 18, 19, 20], {
            sourceNode: parent,
            targetNode: node,
            direction: 'down',
            phase: 'top-down',
        })

        const which = insertTop3(first, second, third, node, depth)
        if (which === 1) {
            capture(21, `depth ${depth} becomes first[${node}] and shifts the previous values right.`, [21, 22, 23], {
                sourceNode: parent,
                targetNode: node,
                direction: 'down',
                phase: 'top-down',
            })
        } else if (which === 2) {
            capture(22, `depth ${depth} becomes second[${node}] and shifts third.`, [22, 23], {
                sourceNode: parent,
                targetNode: node,
                direction: 'down',
                phase: 'top-down',
            })
        } else if (which === 3) {
            capture(23, `depth ${depth} becomes third[${node}].`, [23], {
                sourceNode: parent,
                targetNode: node,
                direction: 'down',
                phase: 'top-down',
            })
        }
    }

    const value = Math.max(...second) + 1
    capture(24, `Return max(second) + 1 = ${value}.`, [24])

    return { value, steps }
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

    const steps = createParentParseSteps(raw)
    if (q === 1) {
        const answers = [1]
        steps.push({
            activeLine: 3,
            relatedLines: [3],
            message: 'Only one node, answer is 1.',
            intervalLeft: null,
            intervalRight: null,
            midpoint: null,
            computedValue: null,
            stackSize: 0,
            answers,
        })
        return { answers, steps }
    }

    steps.push({
        activeLine: 2,
        relatedLines: [2],
        message: 'Parent list parsed. Build the tree and continue.',
        phase: 'parse-parent-done',
        parsedParents: parentZeroBased.slice(1),
        currentParentIndex: q - 1,
        currentParentValue: parentZeroBased[q],
    })

    const ans = new Array(q + 4).fill(0)
    ans[1] = 1
    ans[2] = 1
    ans[3] = 2
    ans[q + 2] = 17

    const stack = [[3, q + 2]]

    steps.push({
        activeLine: 26,
        relatedLines: [26, 27, 28],
        message: 'Initialize answer array, sentinel value, and divide-and-conquer stack.',
        intervalLeft: 3,
        intervalRight: q + 2,
        midpoint: null,
        computedValue: null,
        stackSize: stack.length,
        answers: ans.slice(2, q + 2),
    })

    const capture = (activeLine, message, l, r, m, c, relatedLines = [activeLine]) => {
        steps.push({
            activeLine,
            relatedLines,
            message,
            intervalLeft: l,
            intervalRight: r,
            midpoint: m,
            computedValue: c,
            stackSize: stack.length,
            answers: ans.slice(2, q + 2),
        })
    }

    while (stack.length > 0) {
        const [left, right] = stack.pop()
        capture(29, `Pop interval [${left}, ${right}] from the stack.`, left, right, null, null, [29, 30])

        const mid = (left + right) >> 1
        capture(31, `Midpoint is ${mid}.`, left, right, mid, null, [31])

        capture(32, `Run solve(${mid}) and trace its two DP passes.`, left, right, mid, null, [5, 6, 9, 15, 24])
        const solved = solveWithTrace(parentZeroBased, mid, ans.slice(2, q + 2))
        steps.push(...solved.steps)

        ans[mid] = solved.value
        capture(33, `ans[${mid}] = ${solved.value}.`, left, right, mid, solved.value, [33])

        if (ans[left] === ans[mid]) {
            for (let i = left + 1; i < mid; i += 1) ans[i] = solved.value
            capture(34, `Left endpoint matches midpoint, so fill [${left + 1}, ${mid - 1}] with ${solved.value}.`, left, right, mid, solved.value, [34, 35])
        } else if (left + 1 < mid) {
            stack.push([left, mid])
            capture(36, `Left half still needs work, push [${left}, ${mid}].`, left, right, mid, solved.value, [36, 37])
        }

        if (ans[mid] === ans[right]) {
            for (let i = mid + 1; i < right; i += 1) ans[i] = solved.value
            capture(38, `Midpoint matches right endpoint, so fill [${mid + 1}, ${right - 1}] with ${solved.value}.`, left, right, mid, solved.value, [38, 39])
        } else if (mid + 1 < right) {
            stack.push([mid, right])
            capture(40, `Right half still needs work, push [${mid}, ${right}].`, left, right, mid, solved.value, [40, 41])
        }
    }

    capture(42, 'All intervals are resolved. Print the final answers from 2 to n + 1.', null, null, null, null, [42])

    return { answers: ans.slice(2, q + 2), steps }
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
    const [previewSize, setPreviewSize] = useState(null)
    const [parsedParentSnapshot, setParsedParentSnapshot] = useState([])

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

    useEffect(() => {
        if (!step) {
            setPreviewSize(null)
            setParsedParentSnapshot([])
            return
        }

        if (Array.isArray(step.parsedParents) && step.parsedParents.length > 0) {
            setParsedParentSnapshot(step.parsedParents)
        }

        if (step.subproblemSize != null) {
            setPreviewSize(step.subproblemSize)
            return
        }

        if (step.midpoint != null) {
            setPreviewSize(step.midpoint)
        }
    }, [step])

    const currentTree = useMemo(() => {
        const size = previewSize
        if (!Number.isInteger(size) || size < 1 || size > answers.length + 1) return null

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

        const treeData = buildTreeData(parentZeroBased, size)
        const game = simulateTreeGame(treeData)
        return { ...treeData, ...game, size }
    }, [answers.length, parentsInput, previewSize])

    const treeFocus = useMemo(() => {
        if (!currentTree?.positions || !step?.focus) return null

        const { sourceNode, targetNode, direction, phase } = step.focus
        const sourcePosition = currentTree.positions.get(sourceNode)
        const targetPosition = currentTree.positions.get(targetNode)

        if (!sourcePosition || !targetPosition) return null

        return {
            sourceNode,
            targetNode,
            sourcePosition,
            targetPosition,
            direction,
            phase,
        }
    }, [currentTree, step?.focus])

    const dpSnapshot = step?.dpSnapshot ?? null
    const stepKey = stepIndex >= 0 ? `step-${stepIndex}` : 'idle'
    const parentTokens = useMemo(() => parentsInput.trim().split(/\s+/).filter(Boolean), [parentsInput])
    const parsedParentValues = useMemo(() => parentTokens.map((token) => {
        const value = Number(token)
        return Number.isFinite(value) ? value - 1 : null
    }), [parentTokens])
    const parseIndex = step?.currentParentIndex ?? -1
    const parseValue = step?.currentParentValue ?? null
    const isParsingParents = step?.activeLine === 2 && step?.phase === 'parse-parent'
    const hasParsedParents = parsedParentSnapshot.length > 0
    const revealedParentCount = isParsingParents ? parseIndex + 1 : hasParsedParents ? parsedParentSnapshot.length : 0

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

                        <div className="gogt-parent-strip">
                            <div className="gogt-output-label">Parent parsing preview: x → parent</div>
                            <div className="gogt-parent-grid">
                                {parentTokens.map((token, idx) => (
                                    <div
                                        key={`${token}-${idx}`}
                                        className={`gogt-parent-column ${idx < revealedParentCount ? 'accessed' : ''} ${isParsingParents && parseIndex === idx ? 'current' : ''}`}
                                    >
                                        <div className="gogt-parent-column-label">x{idx + 1}</div>
                                        <motion.div
                                            className={`gogt-parent-token ${idx < revealedParentCount ? 'accessed' : ''} ${isParsingParents && parseIndex === idx ? 'current' : ''}`}
                                            animate={{
                                                y: isParsingParents && parseIndex === idx ? -6 : 0,
                                                scale: isParsingParents && parseIndex === idx ? 1.08 : 1,
                                                boxShadow: isParsingParents && parseIndex === idx
                                                    ? '0 0 0 1px rgba(251, 191, 36, 0.42), 0 10px 24px rgba(251, 191, 36, 0.25)'
                                                    : 'none',
                                            }}
                                            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                                        >
                                            <span className="mono">{token}</span>
                                            <small>x</small>
                                        </motion.div>
                                        <div className="gogt-parent-column-label">parent{idx + 1}</div>
                                        <motion.div
                                            key={`parent-${idx}-${revealedParentCount}`}
                                            className={`gogt-parent-cell ${idx < revealedParentCount ? 'accessed' : ''} ${isParsingParents && parseIndex === idx ? 'current' : ''}`}
                                            initial={false}
                                            animate={{
                                                opacity: idx < revealedParentCount ? 1 : 0.32,
                                                y: idx < revealedParentCount ? 0 : 2,
                                                scale: idx < revealedParentCount ? 1 : 0.98,
                                                borderColor: isParsingParents && parseIndex === idx
                                                    ? 'rgba(34, 197, 94, 0.95)'
                                                    : idx < revealedParentCount
                                                        ? 'rgba(34, 197, 94, 0.6)'
                                                        : 'var(--border)',
                                                boxShadow: isParsingParents && parseIndex === idx
                                                    ? '0 0 0 1px rgba(34, 197, 94, 0.36), 0 10px 24px rgba(34, 197, 94, 0.18)'
                                                    : idx < revealedParentCount
                                                        ? '0 0 0 1px rgba(34, 197, 94, 0.14)'
                                                        : 'none',
                                            }}
                                            transition={{ duration: 0.2, ease: 'easeOut' }}
                                        >
                                            <span className="mono">
                                                {idx < revealedParentCount
                                                    ? (isParsingParents && parseIndex === idx
                                                        ? `parent${idx + 1} = x${idx + 1} - 1 = ${parsedParentSnapshot[idx]}`
                                                        : `parent${idx + 1} = ${parsedParentSnapshot[idx]}`)
                                                    : '—'}
                                            </span>
                                        </motion.div>
                                    </div>
                                ))}
                            </div>
                            {hasParsedParents || step?.activeLine === 2 ? (
                                <div className="gogt-parent-note">
                                    {parseIndex >= 0
                                        ? `x${parseIndex + 1} = ${parentTokens[parseIndex] ?? '—'} transitions to parent${parseIndex + 1} = x${parseIndex + 1} - 1 = ${parseValue}.`
                                        : hasParsedParents
                                            ? 'Parent values are now set and will stay visible while the algorithm continues.'
                                            : 'Parsing parent tokens.'}
                                </div>
                            ) : null}
                        </div>

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
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={stepKey}
                                    className="gogt-status-copy"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.22, ease: 'easeOut' }}
                                >
                                    {step?.message || 'Press Play or Next to start.'}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div className="gogt-metrics">
                            <div className="gogt-metric">
                                <span>interval start</span>
                                <strong>{step?.intervalLeft ?? '-'}</strong>
                            </div>
                            <div className="gogt-metric">
                                <span>interval end</span>
                                <strong>{step?.intervalRight ?? '-'}</strong>
                            </div>
                            <div className="gogt-metric">
                                <span>midpoint value</span>
                                <strong>{step?.midpoint ?? '-'}</strong>
                            </div>
                            <div className="gogt-metric">
                                <span>computed value</span>
                                <strong>{step?.computedValue ?? '-'}</strong>
                            </div>
                            <div className="gogt-metric gogt-metric-wide">
                                <span>interval stack size</span>
                                <strong>{step?.stackSize ?? 0}</strong>
                            </div>
                        </div>

                        <div className="gogt-output-wrap">
                            <div className="gogt-output-label">Partial answers at this step</div>
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={stepKey}
                                    className="gogt-output mono"
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.2, ease: 'easeOut' }}
                                >
                                    {step?.answers ? step.answers.join(' ') : 'No step yet'}
                                </motion.div>
                            </AnimatePresence>
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
                            {currentTree?.size ? `prefix size=${currentTree.size}` : 'waiting'}
                        </span>
                    </header>

                    <div className="gogt-panel-body">
                        <div className="gogt-tree-note">
                            Red: Alice path, Blue: Bob blocks, Gray edge: blocked move from current chip. Each node shows its id and depth.
                        </div>

                        <div className="gogt-tree-canvas">
                            {currentTree ? (
                                <motion.svg
                                    key={`${currentTree.size}-${stepKey}`}
                                    viewBox="0 0 1000 620"
                                    className="gogt-svg"
                                    role="img"
                                    aria-label="Game tree preview"
                                    initial={{ opacity: 0, scale: 0.985 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.24, ease: 'easeOut' }}
                                >
                                    <AnimatePresence>
                                        {treeFocus ? (
                                            <motion.line
                                                key={`${treeFocus.sourceNode}-${treeFocus.targetNode}-${treeFocus.phase}`}
                                                x1={treeFocus.sourcePosition.x}
                                                y1={treeFocus.sourcePosition.y}
                                                x2={treeFocus.targetPosition.x}
                                                y2={treeFocus.targetPosition.y}
                                                className={`gogt-transfer-line ${treeFocus.direction}`}
                                                initial={{ opacity: 0, pathLength: 0 }}
                                                animate={{ opacity: 1, pathLength: 1 }}
                                                exit={{ opacity: 0, pathLength: 0 }}
                                                transition={{ duration: 0.42, ease: 'easeOut' }}
                                            />
                                        ) : null}
                                    </AnimatePresence>

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
                                            <motion.line
                                                key={`${edge.from}-${edge.to}`}
                                                x1={from.x}
                                                y1={from.y}
                                                x2={to.x}
                                                y2={to.y}
                                                className={`gogt-edge ${isBlocked ? 'blocked' : inPath ? 'path' : ''}`}
                                                initial={false}
                                                animate={{ opacity: isBlocked || inPath ? 1 : 0.78, strokeWidth: isBlocked || inPath ? 3 : 2 }}
                                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                            />
                                        )
                                    })}

                                    {Array.from({ length: currentTree.renderCount }, (_, node) => {
                                        const pos = currentTree.positions.get(node)
                                        if (!pos) return null

                                        const state = currentTree.states[node]
                                        const isChip = currentTree.chip === node
                                        const nodeDepth = currentTree.depth[node]
                                        const isFocusSource = treeFocus?.sourceNode === node
                                        const isFocusTarget = treeFocus?.targetNode === node

                                        const nodeScale = isChip ? 1.14 : isFocusSource || isFocusTarget ? 1.06 : 1

                                        return (
                                            <g key={node} transform={`translate(${pos.x}, ${pos.y})`}>
                                                <motion.g
                                                    initial={false}
                                                    animate={{ scale: nodeScale }}
                                                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                                                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                                                >
                                                    {isFocusSource || isFocusTarget ? (
                                                        <rect
                                                            x="-21"
                                                            y="-21"
                                                            width="42"
                                                            height="42"
                                                            rx="12"
                                                            className={`gogt-focus-box ${isFocusSource ? 'source' : ''} ${isFocusTarget ? 'target' : ''}`}
                                                        />
                                                    ) : null}
                                                    <motion.circle
                                                        className={`gogt-node ${state} ${isChip ? 'chip' : ''}`}
                                                        r="16"
                                                        initial={false}
                                                        animate={{
                                                            opacity: state === 'white' ? 0.9 : 1,
                                                            r: isChip ? 17.2 : isFocusSource || isFocusTarget ? 16.8 : 16,
                                                        }}
                                                        transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                                                    />
                                                    <text className="gogt-node-label" textAnchor="middle" dy="-1">{node + 1}</text>
                                                    <text className="gogt-node-depth" textAnchor="middle" dy="12">d{nodeDepth}</text>
                                                </motion.g>
                                            </g>
                                        )
                                    })}
                                </motion.svg>
                            ) : (
                                <div className="gogt-tree-empty">Press Play or Next to render the tree for current midpoint.</div>
                            )}
                        </div>

                        {dpSnapshot ? (
                            <div className="gogt-dp-state">
                                <div className="gogt-dp-state-head">DP state for rendered prefix</div>
                                <div className="gogt-dp-grid">
                                    {[
                                        { key: 'first', label: 'first', values: dpSnapshot.first },
                                        { key: 'second', label: 'second', values: dpSnapshot.second },
                                        { key: 'third', label: 'third', values: dpSnapshot.third },
                                    ].map((row) => (
                                        <div key={row.key} className="gogt-dp-row">
                                            <span className="gogt-dp-label">{row.label}</span>
                                            <div className="gogt-dp-values">
                                                {row.values.map((value, node) => (
                                                    <div key={`${row.key}-${node}`} className="gogt-dp-pill">
                                                        <span className="gogt-dp-pill-node">{node + 1}</span>
                                                        <strong>{value}</strong>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

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
