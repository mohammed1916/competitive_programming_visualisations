import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./LongestIncreasingPathVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def longestIncreasingPath(matrix):" },
    { line: 2, text: "    memo = {}" },
    { line: 3, text: "    def dfs(r, c):" },
    { line: 4, text: "        if (r, c) in memo: return memo[(r, c)]" },
    { line: 5, text: "        best = 1" },
    { line: 6, text: "        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:" },
    { line: 7, text: "            nr, nc = r+dr, c+dc" },
    { line: 8, text: "            if in_bounds(nr,nc) and matrix[nr][nc] > matrix[r][c]:" },
    { line: 9, text: "                best = max(best, 1 + dfs(nr, nc))" },
    { line: 10, text: "        memo[(r,c)] = best; return best" },
    { line: 11, text: "    return max(dfs(r,c) for r,c in all_cells)" },
];

const EXAMPLES = [
    { label: "Ex 1", matrix: [[9, 9, 4], [6, 6, 8], [2, 1, 1]] },
    { label: "Ex 2", matrix: [[3, 4, 5], [3, 2, 6], [2, 2, 1]] },
    { label: "Ex 3", matrix: [[1, 2], [4, 3]] },
];

function generateSteps(matrix) {
    const steps = [];
    const rows = matrix.length;
    const cols = matrix[0].length;
    const memo = {};
    const dpGrid = Array.from({ length: rows }, () => Array(cols).fill(0));
    let globalBest = 0;
    let bestCell = [0, 0];

    steps.push({ activeLine: 2, dpGrid: dpGrid.map(r => [...r]), activeCell: null, visiting: null, globalBest, message: "Init memo. Will DFS from every cell." });

    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const callStack = []; // track visit order for display

    function dfs(r, c) {
        const key = `${r},${c}`;
        if (memo[key] !== undefined) return memo[key];

        callStack.push([r, c]);
        steps.push({
            activeLine: 5, dpGrid: dpGrid.map(row => [...row]),
            activeCell: [r, c], visiting: [...callStack.map(x => [...x])], globalBest,
            message: `dfs(${r},${c}): val=${matrix[r][c]}, best=1`,
        });

        let best = 1;
        for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            if (matrix[nr][nc] > matrix[r][c]) {
                steps.push({
                    activeLine: 8, dpGrid: dpGrid.map(row => [...row]),
                    activeCell: [r, c], neighbor: [nr, nc], visiting: [...callStack.map(x => [...x])], globalBest,
                    message: `  (${r},${c})→(${nr},${nc}): ${matrix[nr][nc]} > ${matrix[r][c]}, recurse`,
                });
                const sub = dfs(nr, nc);
                if (1 + sub > best) {
                    best = 1 + sub;
                    steps.push({
                        activeLine: 9, dpGrid: dpGrid.map(row => [...row]),
                        activeCell: [r, c], visiting: [...callStack.map(x => [...x])], globalBest,
                        message: `  best updated to ${best} via (${nr},${nc})`,
                    });
                }
            }
        }

        memo[key] = best;
        dpGrid[r][c] = best;
        if (best > globalBest) {
            globalBest = best;
            bestCell = [r, c];
        }
        callStack.pop();

        steps.push({
            activeLine: 10, dpGrid: dpGrid.map(row => [...row]),
            activeCell: [r, c], visiting: [...callStack.map(x => [...x])], globalBest,
            message: `memo[(${r},${c})] = ${best}. Global best = ${globalBest}`,
        });

        return best;
    }

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            dfs(r, c);
        }
    }

    steps.push({
        activeLine: 11, dpGrid: dpGrid.map(row => [...row]),
        activeCell: bestCell, visiting: [], globalBest, done: true,
        message: `Longest Increasing Path = ${globalBest}`,
    });

    return steps;
}

export default function LongestIncreasingPathVisualizer() {
    const [ex, setEx] = useState(EXAMPLES[0]);
    const steps = useMemo(() => generateSteps(ex.matrix), [ex]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

    const matrix = ex.matrix;
    const dpGrid = step?.dpGrid ?? matrix.map(r => r.map(() => 0));
    const activeCell = step?.activeCell ?? null;
    const neighbor = step?.neighbor ?? null;
    const visiting = step?.visiting ?? [];
    const globalBest = step?.globalBest ?? 0;
    const visitSet = new Set(visiting.map(([r, c]) => `${r},${c}`));

    const maxDP = Math.max(...dpGrid.flat(), 1);

    return (
        <div className="lip-shell">
            <div className="lip-examples">
                {EXAMPLES.map(e => (
                    <button key={e.label} className={`lip-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
                        {e.label}: {e.matrix.length}×{e.matrix[0].length}
                    </button>
                ))}
            </div>

            <div className="lip-grids">
                <div className="lip-panel">
                    <div className="lip-panel-label">Input Matrix</div>
                    <div className="lip-grid" style={{ gridTemplateColumns: `repeat(${matrix[0].length}, 1fr)` }}>
                        {matrix.map((row, r) => row.map((v, c) => {
                            const isActive = activeCell && activeCell[0] === r && activeCell[1] === c;
                            const isNeighbor = neighbor && neighbor[0] === r && neighbor[1] === c;
                            const inStack = visitSet.has(`${r},${c}`);
                            return (
                                <motion.div
                                    key={`${r}-${c}`}
                                    className={`lip-cell ${isActive ? "active" : ""} ${isNeighbor ? "neighbor" : ""} ${inStack && !isActive ? "in-stack" : ""}`}
                                    animate={{ scale: isActive ? 1.18 : isNeighbor ? 1.1 : 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                >
                                    {v}
                                </motion.div>
                            );
                        }))}
                    </div>
                </div>

                <div className="lip-panel">
                    <div className="lip-panel-label">Memo / DP (path length)</div>
                    <div className="lip-grid" style={{ gridTemplateColumns: `repeat(${matrix[0].length}, 1fr)` }}>
                        {dpGrid.map((row, r) => row.map((v, c) => {
                            const isActive = activeCell && activeCell[0] === r && activeCell[1] === c;
                            const isBest = step?.done && v === globalBest;
                            const intensity = v > 0 ? v / maxDP : 0;
                            return (
                                <motion.div
                                    key={`dp-${r}-${c}`}
                                    className={`lip-cell dp-cell ${isActive ? "active" : ""} ${isBest ? "best" : ""}`}
                                    style={{ '--intensity': intensity }}
                                    animate={{ scale: isActive ? 1.15 : 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                >
                                    {v === 0 ? "?" : v}
                                </motion.div>
                            );
                        }))}
                    </div>
                </div>
            </div>

            <div className="lip-trackers">
                <div className="lip-tracker">
                    <span className="lip-tracker-label">Global Best</span>
                    <motion.span key={globalBest} className="lip-tracker-val lip-best" initial={{ scale: 1.4 }} animate={{ scale: 1 }}>
                        {globalBest}
                    </motion.span>
                </div>
                <div className="lip-tracker">
                    <span className="lip-tracker-label">Active cell</span>
                    <span className="lip-tracker-val lip-small">{activeCell ? `(${activeCell[0]},${activeCell[1]})` : "—"}</span>
                </div>
                <div className="lip-tracker">
                    <span className="lip-tracker-label">Stack depth</span>
                    <span className="lip-tracker-val">{visiting.length}</span>
                </div>
            </div>

            {step?.done && <div className="lip-result">✓ Longest Increasing Path = {globalBest}</div>}

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="lip-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={e => setSpeed(Number(e.target.value))}
            />
        </div>
    );
}
