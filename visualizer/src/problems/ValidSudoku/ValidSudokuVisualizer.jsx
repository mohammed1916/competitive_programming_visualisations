import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./ValidSudokuVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def isValidSudoku(board):" },
    { line: 2, text: "    rows = [set() for _ in range(9)]" },
    { line: 3, text: "    cols = [set() for _ in range(9)]" },
    { line: 4, text: "    boxes = [set() for _ in range(9)]" },
    { line: 5, text: "    for r in range(9):" },
    { line: 6, text: "        for c in range(9):" },
    { line: 7, text: "            v = board[r][c]" },
    { line: 8, text: "            if v == '.': continue" },
    { line: 9, text: "            b = (r//3)*3 + c//3" },
    { line: 10, text: "            if v in rows[r] or v in cols[c] or v in boxes[b]:" },
    { line: 11, text: "                return False" },
    { line: 12, text: "            rows[r].add(v); cols[c].add(v); boxes[b].add(v)" },
    { line: 13, text: "    return True" },
];

const EXAMPLES = {
    valid: {
        label: "Valid",
        board: [
            ["5", "3", ".", ".", "7", ".", ".", ".", "."],
            ["6", ".", ".", "1", "9", "5", ".", ".", "."],
            [".", "9", "8", ".", ".", ".", ".", "6", "."],
            ["8", ".", ".", ".", "6", ".", ".", ".", "3"],
            ["4", ".", ".", "8", ".", "3", ".", ".", "1"],
            ["7", ".", ".", ".", "2", ".", ".", ".", "6"],
            [".", "6", ".", ".", ".", ".", "2", "8", "."],
            [".", ".", ".", "4", "1", "9", ".", ".", "5"],
            [".", ".", ".", ".", "8", ".", ".", "7", "9"],
        ],
    },
    invalid: {
        label: "Invalid (dup col)",
        board: [
            ["8", "3", ".", ".", "7", ".", ".", ".", "."],
            ["6", ".", ".", "1", "9", "5", ".", ".", "."],
            [".", "9", "8", ".", ".", ".", ".", "6", "."],
            ["8", ".", ".", ".", "6", ".", ".", ".", "3"],
            ["4", ".", ".", "8", ".", "3", ".", ".", "1"],
            ["7", ".", ".", ".", "2", ".", ".", ".", "6"],
            [".", "6", ".", ".", ".", ".", "2", "8", "."],
            [".", ".", ".", "4", "1", "9", ".", ".", "5"],
            [".", ".", ".", ".", "8", ".", ".", "7", "9"],
        ],
    },
};

function generateSteps(board) {
    const steps = [];
    const rows = Array.from({ length: 9 }, () => new Set());
    const cols = Array.from({ length: 9 }, () => new Set());
    const boxes = Array.from({ length: 9 }, () => new Set());
    const conflictCells = new Set(); // "r,c"

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const v = board[r][c];
            steps.push({
                activeLine: 7,
                curR: r, curC: c,
                conflictCells: new Set(conflictCells),
                result: null,
                message: `Check cell (${r},${c}) = "${v}"`,
            });
            if (v === ".") {
                steps.push({
                    activeLine: 8,
                    curR: r, curC: c,
                    conflictCells: new Set(conflictCells),
                    result: null,
                    message: `Cell (${r},${c}) is empty — skip.`,
                });
                continue;
            }
            const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
            if (rows[r].has(v) || cols[c].has(v) || boxes[b].has(v)) {
                conflictCells.add(`${r},${c}`);
                steps.push({
                    activeLine: 11,
                    curR: r, curC: c,
                    conflictCells: new Set(conflictCells),
                    result: false,
                    message: `Duplicate "${v}" at (${r},${c})! Board is INVALID.`,
                });
                return steps;
            }
            rows[r].add(v);
            cols[c].add(v);
            boxes[b].add(v);
            steps.push({
                activeLine: 12,
                curR: r, curC: c,
                conflictCells: new Set(conflictCells),
                result: null,
                message: `"${v}" at (${r},${c}) is unique in row, col, box. Added.`,
            });
        }
    }
    steps.push({
        activeLine: 13,
        curR: -1, curC: -1,
        conflictCells: new Set(),
        result: true,
        message: "All cells valid — board is VALID!",
    });
    return steps;
}

export default function ValidSudokuVisualizer() {
    const [exKey, setExKey] = useState("valid");
    const board = EXAMPLES[exKey].board;

    const steps = useMemo(() => generateSteps(board), [board]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);

    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

    const step = stepIndex >= 0 ? steps[stepIndex] : null;

    const applyExample = useCallback((key) => { setExKey(key); handleReset(); }, [handleReset]);

    return (
        <div className="vs-shell">
            <div className="vs-controls-row">
                {Object.entries(EXAMPLES).map(([key, ex]) => (
                    <button key={key} className={`vs-chip ${exKey === key ? "active" : ""}`} onClick={() => applyExample(key)}>
                        {ex.label}
                    </button>
                ))}
            </div>

            <div className="vs-panel">
                <div className="vs-panel-label">Board</div>
                <div className="vs-grid">
                    {board.map((row, r) =>
                        row.map((cell, c) => {
                            const isCur = step?.curR === r && step?.curC === c;
                            const isConflict = step?.conflictCells?.has(`${r},${c}`);
                            const boxR = Math.floor(r / 3);
                            const boxC = Math.floor(c / 3);
                            const boxShade = (boxR + boxC) % 2 === 0 ? "even" : "odd";
                            return (
                                <motion.div
                                    key={`${r}-${c}`}
                                    className={`vs-cell ${isCur ? "current" : ""} ${isConflict ? "conflict" : ""} box-${boxShade}`}
                                    animate={{ scale: isCur ? 1.18 : 1, backgroundColor: isConflict ? "#3d0000" : isCur ? "#1a2a3a" : undefined }}
                                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                                    style={{
                                        borderRight: (c + 1) % 3 === 0 && c !== 8 ? "2px solid #585b70" : undefined,
                                        borderBottom: (r + 1) % 3 === 0 && r !== 8 ? "2px solid #585b70" : undefined,
                                    }}
                                >
                                    {cell !== "." ? cell : ""}
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>

            {step?.result != null && (
                <AnimatePresence>
                    <motion.div
                        className={`vs-result ${step.result ? "valid" : "invalid"}`}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {step.result ? "✓ Valid Sudoku" : "✗ Invalid Sudoku"}
                    </motion.div>
                </AnimatePresence>
            )}

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className="vs-status">{step?.message ?? "Press Play to begin."}</div>
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
    );
}
