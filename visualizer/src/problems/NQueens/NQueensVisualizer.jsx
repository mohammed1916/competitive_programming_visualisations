import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./NQueensVisualizer.css";

const SOLUTION_CODE = [
  { line: 1,  text: "def solveNQueens(n):" },
  { line: 2,  text: "    cols, diag1, diag2 = set(), set(), set()" },
  { line: 3,  text: "    board = [['.']*n for _ in range(n)]" },
  { line: 4,  text: "    def backtrack(row):" },
  { line: 5,  text: "        if row == n: solutions.append(board_copy())" },
  { line: 6,  text: "        for col in range(n):" },
  { line: 7,  text: "            if col in cols or (row-col) in diag1 or (row+col) in diag2:" },
  { line: 8,  text: "                continue  # under attack" },
  { line: 9,  text: "            place queen; add to cols/diag1/diag2" },
  { line: 10, text: "            backtrack(row + 1)" },
  { line: 11, text: "            remove queen; remove from cols/diag1/diag2" },
];

const EXAMPLES = [
  { label: "n=4", n: 4 },
  { label: "n=5", n: 5 },
  { label: "n=6", n: 6 },
];

function generateSteps(n) {
  const steps = [];
  const board = Array.from({ length: n }, () => Array(n).fill("."));
  const cols = new Set(), diag1 = new Set(), diag2 = new Set();
  const solutions = [];

  steps.push({
    activeLine: 2, board: board.map(r => [...r]),
    row: 0, col: -1, phase: "init", solutions: 0,
    message: `Start N-Queens for n=${n}. Empty board.`,
  });

  function backtrack(row) {
    if (row === n) {
      solutions.push(board.map(r => [...r]));
      steps.push({
        activeLine: 5, board: board.map(r => [...r]),
        row, col: -1, phase: "solution", solutions: solutions.length,
        message: `✓ Solution #${solutions.length} found!`,
      });
      return;
    }
    for (let col = 0; col < n; col++) {
      steps.push({
        activeLine: 7, board: board.map(r => [...r]),
        row, col, phase: "check", solutions: solutions.length,
        message: `Row ${row}, Col ${col}: check attacks`,
      });
      if (cols.has(col) || diag1.has(row - col) || diag2.has(row + col)) {
        steps.push({
          activeLine: 8, board: board.map(r => [...r]),
          row, col, phase: "skip", solutions: solutions.length,
          message: `(${row},${col}) under attack — skip`,
        });
        continue;
      }
      board[row][col] = "Q";
      cols.add(col); diag1.add(row - col); diag2.add(row + col);
      steps.push({
        activeLine: 9, board: board.map(r => [...r]),
        row, col, phase: "place", solutions: solutions.length,
        message: `Place Queen at (${row},${col})`,
      });
      backtrack(row + 1);
      board[row][col] = ".";
      cols.delete(col); diag1.delete(row - col); diag2.delete(row + col);
      steps.push({
        activeLine: 11, board: board.map(r => [...r]),
        row, col, phase: "remove", solutions: solutions.length,
        message: `Backtrack: remove Queen from (${row},${col})`,
      });
    }
  }

  backtrack(0);
  steps.push({
    activeLine: 1, board: board.map(r => [...r]),
    row: -1, col: -1, phase: "done", solutions: solutions.length, done: true,
    message: `Done! Found ${solutions.length} solution(s) for n=${n}.`,
  });
  return steps;
}

function getAttacked(board, n) {
  const attacked = Array.from({ length: n }, () => Array(n).fill(false));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (board[r][c] === "Q") {
        for (let i = 0; i < n; i++) {
          attacked[r][i] = true;
          attacked[i][c] = true;
        }
        for (let d = 1; d < n; d++) {
          [[r+d,c+d],[r+d,c-d],[r-d,c+d],[r-d,c-d]].forEach(([nr,nc]) => {
            if (nr >= 0 && nr < n && nc >= 0 && nc < n) attacked[nr][nc] = true;
          });
        }
      }
    }
  }
  return attacked;
}

export default function NQueensVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.n), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

  const n = ex.n;
  const board = step?.board ?? Array.from({ length: n }, () => Array(n).fill("."));
  const activeRow = step?.row ?? -1;
  const activeCol = step?.col ?? -1;
  const phase = step?.phase ?? "init";
  const attacked = useMemo(() => getAttacked(board, n), [board, n]);

  return (
    <div className="nq-shell">
      <div className="nq-examples">
        {EXAMPLES.map(e => (
          <button key={e.label} className={`nq-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
            {e.label}
          </button>
        ))}
      </div>

      <div className="nq-panel">
        <div className="nq-panel-label">Board ({n}×{n})</div>
        <div className="nq-board" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
          {board.map((row, r) => row.map((cell, c) => {
            const isActive = r === activeRow && c === activeCol;
            const isQueen = cell === "Q";
            const isAttack = attacked[r][c] && !isQueen;
            const isActiveRow = r === activeRow && !step?.done;
            const isDark = (r + c) % 2 === 1;
            return (
              <motion.div
                key={`${r}-${c}`}
                className={`nq-cell ${isDark ? "dark" : "light"} ${isQueen ? "queen" : ""} ${isActive && phase === "check" ? "checking" : ""} ${isActive && phase === "place" ? "placing" : ""} ${isActive && phase === "skip" ? "skipping" : ""} ${isAttack && isActiveRow ? "attacked" : ""} ${phase === "solution" ? "solution-flash" : ""}`}
                animate={{ scale: isActive && phase === "place" ? 1.15 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                {isQueen ? "♛" : ""}
              </motion.div>
            );
          }))}
        </div>
      </div>

      <div className="nq-trackers">
        <div className="nq-tracker">
          <span className="nq-tracker-label">Row</span>
          <span className="nq-tracker-val">{activeRow < 0 ? "—" : activeRow}</span>
        </div>
        <div className="nq-tracker">
          <span className="nq-tracker-label">Col</span>
          <span className="nq-tracker-val">{activeCol < 0 ? "—" : activeCol}</span>
        </div>
        <div className="nq-tracker">
          <span className="nq-tracker-label">Solutions</span>
          <motion.span key={step?.solutions} className="nq-tracker-val nq-sol" initial={{ scale: 1.4, color: "#a6e3a1" }} animate={{ scale: 1, color: "#cdd6f4" }}>
            {step?.solutions ?? 0}
          </motion.span>
        </div>
        <div className="nq-tracker">
          <span className="nq-tracker-label">Phase</span>
          <span className={`nq-tracker-val nq-phase ${phase}`}>{phase}</span>
        </div>
      </div>

      {step?.done && (
        <div className="nq-result">✓ {step.solutions} solution(s) for {n}-Queens</div>
      )}

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      <div className="nq-status">{step?.message ?? "Press Play to begin."}</div>
      <PlaybackControls
        isPlaying={isPlaying} isDone={isDone} speed={speed}
        onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
        prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
        onSpeedChange={e => setSpeed(Number(e.target.value))}
      />
    </div>
  );
}
