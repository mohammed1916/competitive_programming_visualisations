import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./PascalsTriangleVisualizer.css";

const SOLUTION_CODE = [
  { line: 1, text: "def generate(numRows):" },
  { line: 2, text: "    triangle = [[1]]" },
  { line: 3, text: "    for i in range(1, numRows):" },
  { line: 4, text: "        prev = triangle[i - 1]" },
  { line: 5, text: "        row = [1]" },
  { line: 6, text: "        for j in range(1, i):" },
  { line: 7, text: "            row.append(prev[j-1] + prev[j])" },
  { line: 8, text: "        row.append(1)" },
  { line: 9, text: "        triangle.append(row)" },
  { line: 10, text: "    return triangle" },
];

const EXAMPLES = [
  { label: "5 rows", numRows: 5 },
  { label: "6 rows", numRows: 6 },
  { label: "7 rows", numRows: 7 },
];

function generateSteps(numRows) {
  const steps = [];
  const triangle = [[1]];
  steps.push({ activeLine: 2, triangle: [[1]], curRow: 0, curJ: -1, message: "Init triangle = [[1]]" });

  for (let i = 1; i < numRows; i++) {
    const prev = triangle[i - 1];
    steps.push({ activeLine: 4, triangle: triangle.map(r => [...r]), curRow: i, curJ: -1, message: `Row ${i}: prev = [${prev.join(", ")}]` });
    const row = [1];
    steps.push({ activeLine: 5, triangle: triangle.map(r => [...r]), curRow: i, curJ: -1, building: [...row], message: `Start row ${i} with [1]` });
    for (let j = 1; j < i; j++) {
      const sum = prev[j - 1] + prev[j];
      row.push(sum);
      steps.push({
        activeLine: 7, triangle: triangle.map(r => [...r]), curRow: i, curJ: j,
        building: [...row], prevJ: [j - 1, j], sum,
        message: `prev[${j - 1}](${prev[j - 1]}) + prev[${j}](${prev[j]}) = ${sum}`,
      });
    }
    row.push(1);
    steps.push({ activeLine: 8, triangle: triangle.map(r => [...r]), curRow: i, curJ: -1, building: [...row], message: `Append 1 → row = [${row.join(", ")}]` });
    triangle.push(row);
    steps.push({ activeLine: 9, triangle: triangle.map(r => [...r]), curRow: i, curJ: -1, message: `triangle[${i}] = [${row.join(", ")}]` });
  }
  steps.push({ activeLine: 10, triangle: triangle.map(r => [...r]), curRow: -1, curJ: -1, done: true, message: `Return ${numRows}-row Pascal's Triangle` });
  return steps;
}

export default function PascalsTriangleVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.numRows), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

  const triangle = step?.triangle ?? [[1]];
  const curRow = step?.curRow ?? -1;
  const building = step?.building ?? null;

  return (
    <div className="pt-shell">
      <div className="pt-examples">
        {EXAMPLES.map(e => (
          <button key={e.label} className={`pt-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>{e.label}</button>
        ))}
      </div>

      <div className="pt-panel">
        <div className="pt-panel-label">Pascal's Triangle</div>
        <div className="pt-triangle">
          {triangle.map((row, ri) => (
            <div key={ri} className="pt-row">
              {row.map((v, ci) => {
                const isPrev = ri === curRow - 1 && step?.prevJ && (ci === step.prevJ[0] || ci === step.prevJ[1]);
                return (
                  <motion.div key={`${ri}-${ci}`}
                    className={`pt-cell ${ri === curRow ? "cur-row" : ""} ${isPrev ? "prev" : ""}`}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22, delay: ci * 0.03 }}>
                    {v}
                  </motion.div>
                );
              })}
            </div>
          ))}
          {/* Building row preview */}
          {building && curRow === triangle.length && (
            <div className="pt-row building">
              {building.map((v, ci) => (
                <motion.div key={`b-${ci}`} className="pt-cell building"
                  initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                  {v}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {step?.sum != null && (
        <div className="pt-sum-expr">
          {step.prevJ[0] !== undefined && `prev[${step.prevJ[0]}] + prev[${step.prevJ[1]}] = ${step.sum}`}
        </div>
      )}

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
      <div className="pt-status">{step?.message ?? "Press Play to begin."}</div>
      <PlaybackControls
        isPlaying={isPlaying} isDone={isDone} speed={speed}
        onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
        prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
        onSpeedChange={e => setSpeed(Number(e.target.value))}
        showPatternOverlay={showPatternOverlay}
        onShowPatternOverlayChange={setShowPatternOverlay}
        patternOverlayLabel="Show pattern overlay"
        showPatternOverlayToggle
      />
      {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
    </div>
  );
}
