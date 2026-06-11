import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./CandyVisualizer.css";

const SOLUTION_CODE = [
  { line: 1,  text: "def candy(ratings):" },
  { line: 2,  text: "    n = len(ratings)" },
  { line: 3,  text: "    candies = [1] * n  # each child gets at least 1" },
  { line: 4,  text: "    # Left pass: left neighbor with lower rating gets fewer" },
  { line: 5,  text: "    for i in range(1, n):" },
  { line: 6,  text: "        if ratings[i] > ratings[i-1]:" },
  { line: 7,  text: "            candies[i] = candies[i-1] + 1" },
  { line: 8,  text: "    # Right pass: right neighbor with lower rating gets fewer" },
  { line: 9,  text: "    for i in range(n-2, -1, -1):" },
  { line: 10, text: "        if ratings[i] > ratings[i+1]:" },
  { line: 11, text: "            candies[i] = max(candies[i], candies[i+1] + 1)" },
  { line: 12, text: "    return sum(candies)" },
];

const EXAMPLES = [
  { label: "Ex 1", ratings: [1, 0, 2] },
  { label: "Ex 2", ratings: [1, 2, 2] },
  { label: "Ex 3", ratings: [1, 3, 2, 2, 1] },
  { label: "Ex 4", ratings: [1, 2, 3, 4, 5] },
];

function generateSteps(ratingsIn) {
  const steps = [];
  const ratings = [...ratingsIn];
  const n = ratings.length;
  let candies = Array(n).fill(1);

  steps.push({ activeLine: 3, ratings, candies: [...candies], i: -1, phase: "init", message: `Init all candies = 1. Ratings: [${ratings.join(", ")}]` });

  // Left pass
  for (let i = 1; i < n; i++) {
    steps.push({ activeLine: 6, ratings, candies: [...candies], i, phase: "left", message: `Left pass i=${i}: ratings[${i}]=${ratings[i]} vs ratings[${i-1}]=${ratings[i-1]}` });
    if (ratings[i] > ratings[i - 1]) {
      candies[i] = candies[i - 1] + 1;
      steps.push({ activeLine: 7, ratings, candies: [...candies], i, phase: "left-up", message: `ratings[${i}] > ratings[${i-1}] → candies[${i}] = ${candies[i-1]-1+1}+1 = ${candies[i]}` });
    }
  }

  steps.push({ activeLine: 9, ratings, candies: [...candies], i: -1, phase: "right-start", message: `Left pass done. Now right pass (right→left).` });

  // Right pass
  for (let i = n - 2; i >= 0; i--) {
    steps.push({ activeLine: 10, ratings, candies: [...candies], i, phase: "right", message: `Right pass i=${i}: ratings[${i}]=${ratings[i]} vs ratings[${i+1}]=${ratings[i+1]}` });
    if (ratings[i] > ratings[i + 1]) {
      const prev = candies[i];
      candies[i] = Math.max(candies[i], candies[i + 1] + 1);
      steps.push({ activeLine: 11, ratings, candies: [...candies], i, phase: "right-up", message: `ratings[${i}] > ratings[${i+1}] → candies[${i}] = max(${prev}, ${candies[i+1]+1}-1) = ${candies[i]}` });
    }
  }

  const total = candies.reduce((a, b) => a + b, 0);
  steps.push({ activeLine: 12, ratings, candies: [...candies], i: -1, phase: "done", done: true, total, message: `Total candies = ${total}` });
  return steps;
}

const MAX_CANDY = 6;

export default function CandyVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.ratings), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

  const ratings = step?.ratings ?? ex.ratings;
  const candies = step?.candies ?? Array(ex.ratings.length).fill(1);
  const activeI = step?.i ?? -1;
  const phase = step?.phase ?? "init";

  const maxCandy = Math.max(...candies, 1);

  return (
    <div className="cy-shell">
      <div className="cy-examples">
        {EXAMPLES.map(e => (
          <button key={e.label} className={`cy-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
            {e.label}: [{e.ratings.join(", ")}]
          </button>
        ))}
      </div>

      <div className="cy-panel">
        <div className="cy-panel-label">Candy Bars per Child</div>
        <div className="cy-chart">
          {ratings.map((r, idx) => {
            const c = candies[idx];
            const isActive = idx === activeI;
            const isLeft = phase.startsWith("left") && idx === activeI;
            const isRight = phase.startsWith("right") && idx === activeI;
            return (
              <div key={idx} className="cy-col">
                <div className="cy-bar-wrap">
                  <motion.div
                    className={`cy-bar ${isLeft ? "left-active" : ""} ${isRight ? "right-active" : ""} ${step?.done ? "done-bar" : ""}`}
                    style={{ height: `${Math.max(8, (c / Math.max(maxCandy, 1)) * 80)}px` }}
                    animate={{ height: `${Math.max(8, (c / Math.max(maxCandy, 1)) * 80)}px` }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  >
                    <span className="cy-bar-val">{c}</span>
                  </motion.div>
                </div>
                <div className={`cy-rating ${isActive ? "active-rating" : ""}`}>{r}</div>
                <div className="cy-idx">{idx}</div>
                {isActive && <div className={`cy-ptr ${phase.startsWith("left") ? "left-ptr" : "right-ptr"}`}>i</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="cy-trackers">
        <div className="cy-tracker">
          <span className="cy-tracker-label">Phase</span>
          <span className={`cy-tracker-val cy-phase ${phase.split("-")[0]}`}>{phase.replace("-start", "").replace("-up", " ↑").replace("-", " ")}</span>
        </div>
        <div className="cy-tracker">
          <span className="cy-tracker-label">i</span>
          <span className="cy-tracker-val">{activeI < 0 ? "—" : activeI}</span>
        </div>
        <div className="cy-tracker">
          <span className="cy-tracker-label">Total so far</span>
          <motion.span key={candies.reduce((a, b) => a + b, 0)} className="cy-tracker-val cy-total"
            initial={{ scale: 1.3 }} animate={{ scale: 1 }}>
            {candies.reduce((a, b) => a + b, 0)}
          </motion.span>
        </div>
      </div>

      {step?.done && <div className="cy-result">✓ Minimum candies = {step.total}</div>}

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
      <div className="cy-status">{step?.message ?? "Press Play to begin."}</div>
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
