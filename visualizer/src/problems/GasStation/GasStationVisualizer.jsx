import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./GasStationVisualizer.css";

const SOLUTION_CODE = [
  { line: 1, text: "def canCompleteCircuit(gas, cost):" },
  { line: 2, text: "    total, tank, start = 0, 0, 0" },
  { line: 3, text: "    for i in range(len(gas)):" },
  { line: 4, text: "        diff = gas[i] - cost[i]" },
  { line: 5, text: "        total += diff" },
  { line: 6, text: "        tank += diff" },
  { line: 7, text: "        if tank < 0:" },
  { line: 8, text: "            start = i + 1" },
  { line: 9, text: "            tank = 0" },
  { line: 10, text: "    return start if total >= 0 else -1" },
];

const EXAMPLES = [
  { label: "Ex 1", gas: [1, 2, 3, 4, 5], cost: [3, 4, 5, 1, 2] },
  { label: "Ex 2", gas: [2, 3, 4], cost: [3, 4, 3] },
  { label: "Ex 3", gas: [5, 1, 2, 3, 4], cost: [4, 4, 1, 5, 1] },
];

function generateSteps(gas, cost) {
  const steps = [];
  let total = 0, tank = 0, start = 0;
  steps.push({ activeLine: 2, i: -1, total, tank, start, message: "Init total=0, tank=0, start=0" });

  for (let i = 0; i < gas.length; i++) {
    const diff = gas[i] - cost[i];
    steps.push({ activeLine: 4, i, total, tank, start, diff, message: `i=${i}: diff = gas[${i}](${gas[i]}) - cost[${i}](${cost[i]}) = ${diff}` });
    total += diff;
    tank += diff;
    steps.push({ activeLine: 6, i, total, tank, start, diff, message: `total=${total}, tank=${tank}` });
    if (tank < 0) {
      start = i + 1;
      tank = 0;
      steps.push({ activeLine: 8, i, total, tank, start, diff, message: `tank<0 → reset start=${start}, tank=0` });
    }
  }
  const result = total >= 0 ? start : -1;
  steps.push({ activeLine: 10, i: -1, total, tank, start, result, message: total >= 0 ? `total(${total}) >= 0 → return start=${start}` : `total(${total}) < 0 → return -1 (impossible)` });
  return steps;
}

export default function GasStationVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.gas, ex.cost), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
  const n = ex.gas.length;
  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

  return (
    <div className="gs-shell">
      <div className="gs-examples">
        {EXAMPLES.map((e) => (
          <button key={e.label} className={`gs-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>{e.label}</button>
        ))}
      </div>

      {/* Circular stations */}
      <div className="gs-panel">
        <div className="gs-panel-label">Stations (gas / cost)</div>
        <div className="gs-stations">
          {ex.gas.map((g, i) => {
            const isCur = step?.i === i;
            const isStart = step?.start === i;
            return (
              <motion.div key={i} className={`gs-station ${isCur ? "cur" : ""} ${isStart ? "start" : ""}`}
                animate={{ scale: isCur ? 1.15 : 1, y: isCur ? -4 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                <div className="gs-idx">#{i}</div>
                <div className="gs-gas">⛽{g}</div>
                <div className="gs-cost">🏎️{ex.cost[i]}</div>
                <div className={`gs-diff ${g - ex.cost[i] >= 0 ? "pos" : "neg"}`}>{g - ex.cost[i] >= 0 ? "+" : ""}{g - ex.cost[i]}</div>
                {isStart && <div className="gs-start-flag">start</div>}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Trackers */}
      <div className="gs-trackers">
        {[
          { label: "total", val: step?.total ?? 0 },
          { label: "tank", val: step?.tank ?? 0 },
          { label: "start", val: step?.start ?? 0 },
        ].map(({ label, val }) => (
          <div key={label} className="gs-tracker">
            <span className="gs-tracker-label">{label}</span>
            <motion.span key={val} className="gs-tracker-val" initial={{ scale: 1.3, color: "#fab387" }} animate={{ scale: 1, color: "#cdd6f4" }} transition={{ duration: 0.3 }}>{val}</motion.span>
          </div>
        ))}
      </div>

      {step?.result != null && (
        <div className={`gs-result ${step.result >= 0 ? "ok" : "fail"}`}>
          {step.result >= 0 ? `✓ Start at station ${step.result}` : "✗ Cannot complete circuit (return -1)"}
        </div>
      )}

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
      <div className="gs-status">{step?.message ?? "Press Play to begin."}</div>
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
