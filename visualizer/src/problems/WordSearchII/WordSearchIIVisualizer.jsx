import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./WordSearchIIVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def findWords(board, words):" },
    { line: 2, text: "    trie = build_trie(words)" },
    { line: 3, text: "    result = set()" },
    { line: 4, text: "    def dfs(node, r, c, path):" },
    { line: 5, text: "        ch = board[r][c]" },
    { line: 6, text: "        if ch not in node: return" },
    { line: 7, text: "        node = node[ch]" },
    { line: 8, text: "        if '$' in node: result.add(path+ch)" },
    { line: 9, text: "        board[r][c] = '#'  # visited" },
    { line: 10, text: "        for dr,dc in DIRS:" },
    { line: 11, text: "            if in_bounds(r+dr,c+dc) and board[r+dr][c+dc]!='#':" },
    { line: 12, text: "                dfs(node, r+dr, c+dc, path+ch)" },
    { line: 13, text: "        board[r][c] = ch  # restore" },
    { line: 14, text: "    for r,c in all_cells: dfs(root, r, c, '')" },
];

const EXAMPLES = [
    {
        label: "Ex 1",
        board: [["o", "a", "a", "n"], ["e", "t", "a", "e"], ["i", "h", "k", "r"], ["i", "f", "l", "v"]],
        words: ["oath", "pea", "eat", "rain"],
    },
    {
        label: "Ex 2",
        board: [["a", "b"], ["c", "d"]],
        words: ["abdc", "abcd", "ab"],
    },
];

function buildTrie(words) {
    const root = {};
    for (const w of words) {
        let node = root;
        for (const ch of w) { node[ch] = node[ch] || {}; node = node[ch]; }
        node["$"] = true;
    }
    return root;
}

function generateSteps(board, words) {
    const rows = board.length, cols = board[0].length;
    const steps = [];
    const result = new Set();
    const grid = board.map(r => [...r]);
    const trie = buildTrie(words);
    const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    steps.push({ activeLine: 2, grid: grid.map(r => [...r]), path: "", r: -1, c: -1, found: [...result], phase: "init", message: `Built trie for [${words.join(", ")}]` });

    function dfs(node, r, c, path) {
        const ch = grid[r][c];
        if (!node[ch]) return;
        node = node[ch];
        const newPath = path + ch;
        const isWord = "$" in node;
        steps.push({
            activeLine: isWord ? 8 : 7,
            grid: grid.map(r => [...r]), path: newPath, r, c, found: [...result],
            phase: isWord ? "found-word" : "visit",
            message: isWord ? `Found word "${newPath}"!` : `Visit [${r},${c}]='${ch}', path="${newPath}"`,
        });
        if (isWord) result.add(newPath);
        grid[r][c] = "#";
        for (const [dr, dc] of DIRS) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] !== "#") {
                dfs(node, nr, nc, newPath);
            }
        }
        grid[r][c] = ch;
        steps.push({
            activeLine: 13,
            grid: grid.map(r => [...r]), path: newPath, r, c, found: [...result],
            phase: "restore",
            message: `Restore [${r},${c}]='${ch}', backtrack from "${newPath}"`,
        });
    }

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            steps.push({ activeLine: 14, grid: grid.map(r => [...r]), path: "", r, c, found: [...result], phase: "start-cell", message: `Start DFS from [${r},${c}]='${board[r][c]}'` });
            dfs(trie, r, c, "");
        }
    }

    steps.push({ activeLine: 3, grid: grid.map(r => [...r]), path: "", r: -1, c: -1, found: [...result], phase: "done", done: true, message: `Found: [${[...result].join(", ")}]` });
    return steps;
}

const CELL_SIZE = 38;

export default function WordSearchIIVisualizer() {
    const [ex, setEx] = useState(EXAMPLES[0]);
    const steps = useMemo(() => generateSteps(ex.board, ex.words), [ex]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

    const grid = step?.grid ?? ex.board;
    const activeR = step?.r ?? -1;
    const activeC = step?.c ?? -1;
    const path = step?.path ?? "";
    const found = step?.found ?? [];
    const phase = step?.phase ?? "init";
    const rows = grid.length, cols = grid[0].length;

    return (
        <div className="ws2-shell">
            <div className="ws2-examples">
                {EXAMPLES.map(e => (
                    <button key={e.label} className={`ws2-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
                        {e.label}
                    </button>
                ))}
            </div>

            <div className="ws2-panel">
                <div className="ws2-panel-label">Words to find</div>
                <div className="ws2-words">
                    {ex.words.map((w, i) => (
                        <span key={i} className={`ws2-word ${found.includes(w) ? "found-word" : ""}`}>{w}</span>
                    ))}
                </div>
            </div>

            <div className="ws2-panel">
                <div className="ws2-panel-label">Board</div>
                <div className="ws2-grid" style={{ gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)` }}>
                    {grid.map((row, r) =>
                        row.map((ch, c) => {
                            const isActive = r === activeR && c === activeC;
                            const isVisited = ch === "#";
                            return (
                                <motion.div key={`${r}-${c}`}
                                    className={`ws2-cell ${isActive ? `active-${phase.split("-")[0]}` : ""} ${isVisited ? "visited" : ""}`}
                                    animate={{ scale: isActive ? 1.18 : 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                                    {isVisited ? "·" : ch}
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="ws2-row">
                <div className="ws2-panel ws2-half">
                    <div className="ws2-panel-label">Current path</div>
                    <div className="ws2-path">{path || "—"}</div>
                </div>
                <div className="ws2-panel ws2-half">
                    <div className="ws2-panel-label">Found words</div>
                    <div className="ws2-found-list">
                        {found.map((w, i) => <span key={i} className="ws2-found">{w}</span>)}
                        {found.length === 0 && <span className="ws2-empty">none yet</span>}
                    </div>
                </div>
            </div>

            <div className="ws2-trackers">
                <div className="ws2-tracker">
                    <span className="ws2-tracker-label">Cell</span>
                    <span className="ws2-tracker-val">{activeR < 0 ? "—" : `[${activeR},${activeC}]`}</span>
                </div>
                <div className="ws2-tracker">
                    <span className="ws2-tracker-label">Phase</span>
                    <span className={`ws2-tracker-val ws2-phase ${phase.split("-")[0]}`}>{phase.replace("-", " ")}</span>
                </div>
                <div className="ws2-tracker">
                    <span className="ws2-tracker-label">Found</span>
                    <span className="ws2-tracker-val ws2-cnt">{found.length}/{ex.words.length}</span>
                </div>
            </div>

            {step?.done && <div className="ws2-result">✓ Found: [{found.join(", ")}]</div>}

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="ws2-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={e => setSpeed(Number(e.target.value))}
            />
        </div>
    );
}
