import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import DockableWorkspace from "../../components/shared/DockableWorkspace";
import FloatingPanel from "../../components/shared/FloatingPanel";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import { useAutoScroll } from "../../hooks/useAutoScroll";
import { GraphCanvas3D } from "../../components/viz3d";
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

function VisualizationPanel({ adj, positions, step }) {
    const nodes = useMemo(() => {
        return Object.keys(positions).map((id) => {
            const numId = Number(id);
            return { id: numId, label: String(numId), x: positions[numId][0], y: positions[numId][1] };
        });
    }, [positions]);

    const edges = useMemo(() => {
        const edgeList = [];
        const seen = new Set();
        const nodeIds = Object.keys(positions).map(Number);
        for (const u of nodeIds) {
            for (const v of (adj[u] || [])) {
                const key = `${Math.min(u, v)}-${Math.max(u, v)}`;
                if (!seen.has(key)) { seen.add(key); edgeList.push({ fromId: u, toId: v }); }
            }
        }
        return edgeList;
    }, [adj, positions]);

    const visitedSet = useMemo(() => new Set(Object.keys(step?.visited || {}).map(Number)), [step?.visited]);
    const cloneEdgeSet = useMemo(() => new Set(Object.keys(step?.cloneEdges || {})), [step?.cloneEdges]);

    return (
        <div className="cg-viz-container">
            <div className="cg-graphs-row">
                <div className="cg-panel">
                    <div className="cg-panel-label">Original Graph</div>
                    <GraphCanvas3D
                        nodes={nodes}
                        edges={edges}
                        visitedSet={new Set()}
                        activeNode={step?.curNode ?? null}
                        activeNeighbor={step?.curNbr ?? null}
                        cloneEdgeSet={new Set()}
                        width={SVG_W}
                        height={SVG_H}
                        isClone={false}
                        nodeRadius={NODE_R}
                    />
                </div>
                <div className="cg-arrow">→</div>
                <div className="cg-panel">
                    <div className="cg-panel-label">Clone (Building)</div>
                    <GraphCanvas3D
                        nodes={nodes}
                        edges={edges}
                        visitedSet={visitedSet}
                        activeNode={step?.curNode ?? null}
                        activeNeighbor={step?.curNbr ?? null}
                        cloneEdgeSet={cloneEdgeSet}
                        width={SVG_W}
                        height={SVG_H}
                        isClone={true}
                        nodeRadius={NODE_R}
                    />
                </div>
            </div>

            <div className="cg-panel">
                <div className="cg-panel-label">Visited / Cloned Nodes</div>
                <div className="cg-visited-row">
                    {Object.keys(adj).map(Number).map((n) => (
                        <div key={n} className={`cg-vis-badge ${step?.visited?.[n] ? "done" : "pending"}`}>{n}</div>
                    ))}
                </div>
            </div>

            <div className="cg-status">{step?.message ?? "Press Play to begin."}</div>
        </div>
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
    const [autoScrollCode, setAutoScrollCode] = useAutoScroll();
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

    const dockPanels = [
        {
            id: 'code',
            title: 'Code Trace',
            subtitle: step ? `Active line ${step.activeLine}` : 'Line-by-line solution view.',
            defaultZone: 'left',
            content: (
                <CodeTracePanel
                    step={step}
                    codeLines={SOLUTION_CODE}
                    onActiveLineDomChange={setActiveLineDom}
                    autoScroll={autoScrollCode}
                />
            ),
        },
        {
            id: 'viz',
            title: 'Graph Visualization',
            subtitle: step ? `Step ${stepIndex + 1} of ${steps.length}` : 'Original and clone graphs.',
            defaultZone: 'right',
            content: (
                <VisualizationPanel
                    adj={ex.adj}
                    positions={ex.positions}
                    step={step}
                />
            ),
        },
    ];

    return (
        <div className="cg-shell">
            <section className="cg-hero">
                <div className="cg-hero-copy">
                    <span className="cg-kicker">Graph Traversal • BFS Clone</span>
                    <h2>Visualize how graphs are cloned with BFS.</h2>
                    <p>
                        Watch the original graph alongside the cloned graph as the algorithm
                        processes nodes and builds edges in the copy.
                    </p>
                </div>

                <div className="cg-examples">
                    {Object.entries(EXAMPLES).map(([k, e]) => (
                        <button
                            key={k}
                            className={`cg-chip ${exKey === k ? "active" : ""}`}
                            onClick={() => applyEx(k)}
                        >
                            {e.label}
                        </button>
                    ))}
                </div>
            </section>

            <DockableWorkspace
                title="Clone Graph Workspace"
                panels={dockPanels}
                initialLayout={{
                    rows: [['code', 'viz']],
                    minimized: [],
                }}
            />

            <FloatingPanel title="Playback Controls">
                <PlaybackControls
                    onReset={handleReset}
                    onPrev={stepBack}
                    onPlayToggle={togglePlay}
                    onNext={stepForward}
                    resetDisabled={steps.length === 0}
                    prevDisabled={stepIndex < 0}
                    nextDisabled={isDone}
                    isPlaying={isPlaying}
                    isDone={isDone}
                    speed={speed}
                    onSpeedChange={(event) => setSpeed(Number(event.target.value))}
                    speedIndicator={`${speed}ms`}
                    autoScroll={autoScrollCode}
                    onAutoScrollChange={setAutoScrollCode}
                    autoScrollLabel="Auto-scroll code"
                    showAutoScroll
                    showPatternOverlay={showPatternOverlay}
                    onShowPatternOverlayChange={setShowPatternOverlay}
                    patternOverlayLabel="Show pattern overlay"
                    showPatternOverlayToggle
                />
            </FloatingPanel>

            {showPatternOverlay && step && (
                <PatternOverlay step={step} activeLineDom={activeLineDom} />
            )}
        </div>
    );
}
