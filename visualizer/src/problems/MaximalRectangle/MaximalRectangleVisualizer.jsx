import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./MaximalRectangleVisualizer.css";

const SOLUTION_CODE = [
  { line: 1,  text: "def maximalRectangle(matrix):" },
  { line: 2,  text: "    heights = [0] * cols" },
  { line: 3,  text: "    best = 0" },
  { line: 4,  text: "    for row in matrix:" },
  { line: 5,  text: "        for j, cell in enumerate(row):" },
  { line: 6,  text: "            heights[j] = heights[j]+1 if cell=='1' else 0" },
  { line: 7,  text: "        best = max(best, largestInHistogram(heights))" },
  { line: 8,  text: "def largestInHistogram(h):" },
  { line: 9,  text: "    stack, best = [], 0" },
  { line: 10, text: "    for i, ht in enumerate(h + [0]):" },
  { line: 11, text: "        while stack and h[stack[-1]] >= ht:" },
  { line: 12, text: "            height = h[stack.pop()]" },
  { line: 13, text: "            width = i if not stack else i - stack[-1] - 1" },
  { line: 14, text: "            best = max(best, height * width)" },
  { line: 15, text: "        stack.append(i)" },
];

const EXAMPLES = [
  { label: "Ex 1", matrix: [["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]] },
  { label: "Ex 2", matrix: [["0","1"],["1","0"]] },
  { label: "Ex 3", matrix: [["1","1","1","1"],["1","1","1","1"],["0","0","1","0"]] },
];

function generateSteps(matrix) {
  const steps = [];
  const rows = matrix.length;
  const cols = matrix[0].length;
  const heights = Array(cols).fill(0);
  let globalBest = 0;

  steps.push({ activeLine: 2, heights: [...heights], matrix, activeRow: -1, activeCol: -1, stack: [], best: 0, phase: "init", message: "Init heights = all zeros." });

  for (let r = 0; r < rows; r++) {
    // Update heights
    for (let c = 0; c < cols; c++) {
      heights[c] = matrix[r][c] === "1" ? heights[c] + 1 : 0;
    }
    steps.push({
      activeLine: 6, heights: [...heights], matrix, activeRow: r, activeCol: -1, stack: [], best: globalBest, phase: "update",
      message: `Row ${r}: updated heights = [${heights.join(", ")}]`,
    });

    // Histogram largest rectangle
    const h = [...heights, 0];
    const stack = [];
    let rowBest = 0;

    for (let i = 0; i <= cols; i++) {
      steps.push({
        activeLine: 10, heights: [...heights], matrix, activeRow: r, activeCol: i < cols ? i : -1,
        stack: [...stack], best: globalBest, phase: "hist",
        message: `Histogram i=${i}, h=${h[i]}. Stack=[${stack.join(",")}]`,
      });
      while (stack.length > 0 && h[stack[stack.length - 1]] >= h[i]) {
        const top = stack.pop();
        const height = h[top];
        const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
        const area = height * width;
        rowBest = Math.max(rowBest, area);
        globalBest = Math.max(globalBest, area);
        steps.push({
          activeLine: 14, heights: [...heights], matrix, activeRow: r, activeCol: i,
          stack: [...stack], best: globalBest, phase: "pop",
          rectLeft: stack.length === 0 ? 0 : stack[stack.length - 1] + 1,
          rectRight: i - 1, rectHeight: height,
          message: `Pop idx=${top}: h=${height}×w=${width}=${area}. Best=${globalBest}`,
        });
      }
      stack.push(i);
    }
  }

  steps.push({
    activeLine: 7, heights: [...heights], matrix, activeRow: -1, activeCol: -1, stack: [], best: globalBest, phase: "done", done: true,
    message: `Maximal Rectangle = ${globalBest}`,
  });
  return steps;
}

const CELL_SIZE = 36;

export default function MaximalRectangleVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.matrix), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

  const matrix = ex.matrix;
  const rows = matrix.length;
  const cols = matrix[0].length;
  const heights = step?.heights ?? Array(cols).fill(0);
  const activeRow = step?.activeRow ?? -1;
  const activeCol = step?.activeCol ?? -1;
  const stackSet = new Set(step?.stack ?? []);
  const best = step?.best ?? 0;
  const phase = step?.phase ?? "init";
  const rectLeft = step?.rectLeft ?? -1;
  const rectRight = step?.rectRight ?? -1;
  const rectHeight = step?.rectHeight ?? 0;
  const maxH = Math.max(...heights, 1);

  return (
    <div className="mr-shell">
      <div className="mr-examples">
        {EXAMPLES.map(e => (
          <button key={e.label} className={`mr-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
            {e.label}: {e.matrix.length}×{e.matrix[0].length}
          </button>
        ))}
      </div>

      <div className="mr-panel">
        <div className="mr-panel-label">Binary Matrix</div>
        <div className="mr-matrix" style={{ gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)` }}>
          {matrix.map((row, r) => row.map((cell, c) => {
            const isActiveRow = r === activeRow;
            const isRect = phase === "pop" && r >= activeRow - rectHeight + 1 && r <= activeRow && c >= rectLeft && c <= rectRight;
            return (
              <motion.div
                key={`${r}-${c}`}
                className={`mr-cell ${cell === "1" ? "one" : "zero"} ${isActiveRow ? "active-row" : ""} ${isRect ? "rect" : ""}`}
                animate={{ scale: isRect ? 1.08 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                {cell}
              </motion.div>
            );
          }))}
        </div>
      </div>

      <div className="mr-panel">
        <div className="mr-panel-label">Heights (histogram for current row)</div>
        <div className="mr-hist">
          {heights.map((h, idx) => {
            const inStack = stackSet.has(idx);
            const isActive = idx === activeCol;
            return (
              <div key={idx} className="mr-bar-col">
                <div className="mr-bar-wrap">
                  <motion.div
                    className={`mr-bar ${inStack ? "in-stack" : ""} ${isActive ? "active-bar" : ""}`}
                    style={{ height: `${Math.max(4, (h / maxH) * 70)}px` }}
                    animate={{ height: `${Math.max(4, (h / maxH) * 70)}px` }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  >
                    {h > 0 && <span className="mr-bar-val">{h}</span>}
                  </motion.div>
                </div>
                <div className="mr-bar-idx">{idx}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mr-trackers">
        <div className="mr-tracker">
          <span className="mr-tracker-label">Best Area</span>
          <motion.span key={best} className="mr-tracker-val mr-best" initial={{ scale: 1.3 }} animate={{ scale: 1 }}>{best}</motion.span>
        </div>
        <div className="mr-tracker">
          <span className="mr-tracker-label">Row</span>
          <span className="mr-tracker-val">{activeRow < 0 ? "—" : activeRow}</span>
        </div>
        <div className="mr-tracker">
          <span className="mr-tracker-label">Stack</span>
          <span className="mr-tracker-val mr-small">[{(step?.stack ?? []).join(",")}]</span>
        </div>
        <div className="mr-tracker">
          <span className="mr-tracker-label">Phase</span>
          <span className={`mr-tracker-val mr-phase ${phase}`}>{phase}</span>
        </div>
      </div>

      {step?.done && <div className="mr-result">✓ Maximal Rectangle Area = {best}</div>}

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      <div className="mr-status">{step?.message ?? "Press Play to begin."}</div>
      <PlaybackControls
        isPlaying={isPlaying} isDone={isDone} speed={speed}
        onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
        prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
        onSpeedChange={e => setSpeed(Number(e.target.value))}
      />
    </div>
  );
}
