import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./CloneGraphVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def cloneGraph(node):" },
    { line: 2, text: "    if not node: return None" },
    { line: 3, text: "    visited = {}  # original -> clone" },
    { line: 4, text: "    queue = deque([node])" },
    { line: 5, text: "    visited[node.val] = Node(node.val)" },
    { line: 6, text: "    while queue:" },
    { line: 7, text: "        cur = queue.popleft()" },
    { line: 8, text: "        for nbr in cur.neighbors:" },
    { line: 9, text: "            if nbr.val not in visited:" },
    { line: 10, text: "                visited[nbr.val] = Node(nbr.val)" },
    { line: 11, text: "                queue.append(nbr)" },
    { line: 12, text: "            visited[cur.val].neighbors.append(visited[nbr.val])" },
    { line: 13, text: "    return visited[node.val]" },
];

// Fixed graph examples as adjacency lists (1-indexed nodes)
const EXAMPLES = {
    ex1: {
        label: "4-node cycle",
        adj: { 1: [2, 4], 2: [1, 3], 3: [2, 4], 4: [1, 3] },
        positions: { 1: [60, 20], 2: [160, 20], 3: [160, 110], 4: [60, 110] },
    },
    ex2: {
        label: "Star graph",
        adj: { 1: [2, 3, 4], 2: [1], 3: [1], 4: [1] },
        positions: { 1: [110, 70], 2: [40, 20], 3: [180, 20], 4: [110, 140] },
    },
};

function generateSteps(adj, start = 1) {
    const steps = [];
    const visited = {}; // node val -> true
    const queue = [start];
    visited[start] = true;

    steps.push({ activeLine: 5, visited: { ...visited }, curNode: start, curNbr: null, cloneEdges: {}, message: `Create clone of node ${start}. Add to queue.` });

    const cloneEdges = {}; // "u-v" set

    while (queue.length > 0) {
        const cur = queue.shift();
        steps.push({ activeLine: 7, visited: { ...visited }, curNode: cur, curNbr: null, cloneEdges: { ...cloneEdges }, message: `Dequeue node ${cur}. Process its neighbors.` });

        for (const nbr of (adj[cur] || [])) {
            if (!visited[nbr]) {
                visited[nbr] = true;
                queue.push(nbr);
                steps.push({ activeLine: 10, visited: { ...visited }, curNode: cur, curNbr: nbr, cloneEdges: { ...cloneEdges }, message: `Neighbor ${nbr} not visited — create clone of ${nbr}, enqueue.` });
            }
            cloneEdges[`${Math.min(cur, nbr)}-${Math.max(cur, nbr)}`] = true;
            steps.push({ activeLine: 12, visited: { ...visited }, curNode: cur, curNbr: nbr, cloneEdges: { ...cloneEdges }, message: `Add edge ${cur}↔${nbr} to clone graph.` });
        }
    }
    steps.push({ activeLine: 13, visited: { ...visited }, curNode: -1, curNbr: null, cloneEdges: { ...cloneEdges }, message: `BFS done. All ${Object.keys(visited).length} nodes cloned!` });
    return steps;
}

const NODE_R = 22;
const SVG_W = 220, SVG_H = 170;

function GraphSVG({ adj, positions, visited, curNode, curNbr, cloneEdges, isClone }) {
    const nodes = Object.keys(positions).map(Number);
    const edges = [];
    const seen = new Set();
    for (const u of nodes) {
        for (const v of (adj[u] || [])) {
            const key = `${Math.min(u, v)}-${Math.max(u, v)}`;
            if (!seen.has(key)) { seen.add(key); edges.push([u, v, key]); }
        }
    }
    return (
        <svg width={SVG_W} height={SVG_H} className="cg-svg">
            {edges.map(([u, v, key]) => {
                const [x1, y1] = positions[u];
                const [x2, y2] = positions[v];
                const active = isClone ? cloneEdges?.[key] : true;
                return (
                    <line key={key} x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke={active ? (isClone ? "#a6e3a1" : "#45475a") : "#2a2a3a"}
                        strokeWidth={active ? 2 : 1} strokeDasharray={active ? "none" : "4 3"} />
                );
            })}
            {nodes.map((n) => {
                const [cx, cy] = positions[n];
                const isCur = curNode === n;
                const isNbr = curNbr === n;
                const isVis = isClone ? visited?.[n] : true;
                let stroke = "#45475a", fill = "#313244", textColor = "#a6adc8";
                if (isClone) {
                    if (!isVis) { fill = "#1e1e2e"; stroke = "#313244"; textColor = "#45475a"; }
                    else if (isCur) { fill = "#0d2a1a"; stroke = "#a6e3a1"; textColor = "#a6e3a1"; }
                    else if (isNbr) { fill = "#1a0d2a"; stroke = "#cba6f7"; textColor = "#cba6f7"; }
                    else { fill = "#002010"; stroke = "#a6e3a1"; textColor = "#a6e3a1"; }
                } else {
                    if (isCur) { fill = "#0d1a2a"; stroke = "#89b4fa"; textColor = "#89b4fa"; }
                    else if (isNbr) { fill = "#1a0d2a"; stroke = "#cba6f7"; textColor = "#cba6f7"; }
                }
                return (
                    <g key={n}>
                        <circle cx={cx} cy={cy} r={NODE_R} fill={fill} stroke={stroke} strokeWidth={2} />
                        <text x={cx} y={cy} dominantBaseline="middle" textAnchor="middle" fill={textColor} fontSize={15} fontWeight="bold">{n}</text>
                    </g>
                );
            })}
        </svg>
    );
}

export default function CloneGraphVisualizer() {
    const [exKey, setExKey] = useState("ex1");
    const ex = EXAMPLES[exKey];
    const steps = useMemo(() => generateSteps(ex.adj), [ex]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const applyEx = useCallback((k) => { setExKey(k); handleReset(); }, [handleReset]);

    return (
        <div className="cg-shell">
            <div className="cg-examples">
                {Object.entries(EXAMPLES).map(([k, e]) => (
                    <button key={k} className={`cg-chip ${exKey === k ? "active" : ""}`} onClick={() => applyEx(k)}>{e.label}</button>
                ))}
            </div>

            <div className="cg-graphs-row">
                <div className="cg-panel">
                    <div className="cg-panel-label">Original</div>
                    <GraphSVG adj={ex.adj} positions={ex.positions}
                        visited={step?.visited} curNode={step?.curNode} curNbr={step?.curNbr}
                        cloneEdges={step?.cloneEdges} isClone={false} />
                </div>
                <div className="cg-arrow">→</div>
                <div className="cg-panel">
                    <div className="cg-panel-label">Clone (building)</div>
                    <GraphSVG adj={ex.adj} positions={ex.positions}
                        visited={step?.visited} curNode={step?.curNode} curNbr={step?.curNbr}
                        cloneEdges={step?.cloneEdges} isClone={true} />
                </div>
            </div>

            {/* visited map */}
            <div className="cg-panel">
                <div className="cg-panel-label">Visited / cloned nodes</div>
                <div className="cg-visited-row">
                    {Object.keys(ex.adj).map(Number).map((n) => (
                        <div key={n} className={`cg-vis-badge ${step?.visited?.[n] ? "done" : "pending"}`}>{n}</div>
                    ))}
                </div>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="cg-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
            />
        </div>
    );
}
