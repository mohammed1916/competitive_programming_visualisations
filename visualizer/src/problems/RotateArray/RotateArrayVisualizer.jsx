import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./RotateArrayVisualizer.css";

const SOLUTION_CODE = [
  { line: 1, text: "def rotate(nums, k):" },
  { line: 2, text: "    k %= len(nums)" },
  { line: 3, text: "    def rev(l, r):" },
  { line: 4, text: "        while l < r:" },
  { line: 5, text: "            nums[l], nums[r] = nums[r], nums[l]" },
  { line: 6, text: "            l += 1; r -= 1" },
  { line: 7, text: "    rev(0, len(nums)-1)   # reverse all" },
  { line: 8, text: "    rev(0, k-1)           # reverse first k" },
  { line: 9, text: "    rev(k, len(nums)-1)   # reverse rest" },
];

const EXAMPLES = [
  { label: "[1,2,3,4,5,6,7], k=3", nums: [1, 2, 3, 4, 5, 6, 7], k: 3 },
  { label: "[-1,-100,3,99], k=2", nums: [-1, -100, 3, 99], k: 2 },
  { label: "[1,2,3,4,5], k=1", nums: [1, 2, 3, 4, 5], k: 1 },
];

function generateSteps(inputNums, inputK) {
  const steps = [];
  const nums = [...inputNums];
  const n = nums.length;
  const k = ((inputK % n) + n) % n;

  steps.push({ activeLine: 2, nums: [...nums], lo: -1, hi: -1, phase: "start", phaseLabel: "", message: `k = ${inputK} % ${n} = ${k}` });

  function revSteps(lo0, hi0, label) {
    let lo = lo0, hi = hi0;
    steps.push({ activeLine: label === "all" ? 7 : label === "first" ? 8 : 9, nums: [...nums], lo, hi, phase: label, phaseLabel: label, message: `Reverse ${label} [${lo}..${hi}]` });
    while (lo < hi) {
      [nums[lo], nums[hi]] = [nums[hi], nums[lo]];
      steps.push({ activeLine: 5, nums: [...nums], lo, hi, phase: label, phaseLabel: label, message: `Swap nums[${lo}]↔nums[${hi}] → [${nums.join(",")}]` });
      lo++; hi--;
    }
  }

  revSteps(0, n - 1, "all");
  revSteps(0, k - 1, "first");
  revSteps(k, n - 1, "rest");

  steps.push({ activeLine: 9, nums: [...nums], lo: -1, hi: -1, phase: "done", phaseLabel: "", message: `Done! [${nums.join(",")}]` });
  return steps;
}

function cellClass(idx, step) {
  if (!step || step.lo < 0) return "";
  if (idx === step.lo || idx === step.hi) return "swap";
  if (idx >= step.lo && idx <= step.hi) {
    if (step.phase === "all") return "phase-all";
    if (step.phase === "first") return "phase-first";
    if (step.phase === "rest") return "phase-rest";
  }
  return "";
}

export default function RotateArrayVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.nums, ex.k), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

  return (
    <div className="ra-shell">
      <div className="ra-examples">
        {EXAMPLES.map((e) => (
          <button key={e.label} className={`ra-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>{e.label}</button>
        ))}
      </div>

      <div className="ra-panel">
        <div className="ra-panel-label">Array (k={ex.k})</div>
        <div className="ra-array-row">
          {(step?.nums ?? ex.nums).map((val, idx) => (
            <motion.div key={idx} layout className={`ra-cell ${cellClass(idx, step)}`}
              animate={{ scale: (idx === step?.lo || idx === step?.hi) ? 1.2 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}>
              {val}
              <div className="ra-idx">{idx}</div>
            </motion.div>
          ))}
        </div>
        <div className="ra-legend">
          <span className="ra-leg all">■ reverse all</span>
          <span className="ra-leg first">■ reverse first k</span>
          <span className="ra-leg rest">■ reverse rest</span>
          <span className="ra-leg swap">■ swap pair</span>
        </div>
      </div>

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
      <div className="ra-status">{step?.message ?? "Press Play to begin."}</div>
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
