import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./FindPeakElementVisualizer.css";

const SOLUTION_CODE = [
  { line: 1, text: "def findPeakElement(nums):" },
  { line: 2, text: "    lo, hi = 0, len(nums) - 1" },
  { line: 3, text: "    while lo < hi:" },
  { line: 4, text: "        mid = (lo + hi) // 2" },
  { line: 5, text: "        if nums[mid] < nums[mid + 1]:" },
  { line: 6, text: "            lo = mid + 1  # peak is to the right" },
  { line: 7, text: "        else:" },
  { line: 8, text: "            hi = mid     # peak is here or to the left" },
  { line: 9, text: "    return lo" },
];

const EXAMPLES = [
  { label: "Ex 1", nums: [1, 2, 3, 1] },
  { label: "Ex 2", nums: [1, 2, 1, 3, 5, 6, 4] },
  { label: "Ex 3", nums: [3, 1, 2] },
];

function generateSteps(nums) {
  const steps = [];
  let lo = 0, hi = nums.length - 1;
  steps.push({ activeLine: 2, lo, hi, mid: -1, message: `Init lo=0, hi=${hi}` });

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps.push({ activeLine: 4, lo, hi, mid, message: `mid = (${lo}+${hi})//2 = ${mid}` });
    steps.push({ activeLine: 5, lo, hi, mid, message: `nums[${mid}]=${nums[mid]} vs nums[${mid + 1}]=${nums[mid + 1]}` });
    if (nums[mid] < nums[mid + 1]) {
      lo = mid + 1;
      steps.push({ activeLine: 6, lo, hi, mid, message: `nums[mid] < nums[mid+1] → peak right → lo=${lo}` });
    } else {
      hi = mid;
      steps.push({ activeLine: 8, lo, hi, mid, message: `nums[mid] >= nums[mid+1] → peak here or left → hi=${hi}` });
    }
  }
  steps.push({ activeLine: 9, lo, hi, mid: lo, result: lo, message: `lo==hi==${lo} → peak at index ${lo} (value ${nums[lo]})` });
  return steps;
}

const BAR_MAX_H = 120;

export default function FindPeakElementVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.nums), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
  const maxVal = Math.max(...ex.nums);
  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

  return (
    <div className="fp-shell">
      <div className="fp-examples">
        {EXAMPLES.map((e) => (
          <button key={e.label} className={`fp-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>{e.label}</button>
        ))}
      </div>

      {/* Bar chart */}
      <div className="fp-panel">
        <div className="fp-panel-label">Array (bars)</div>
        <div className="fp-bars">
          {ex.nums.map((v, i) => {
            const h = Math.round((v / maxVal) * BAR_MAX_H);
            const isLo = step?.lo === i;
            const isHi = step?.hi === i;
            const isMid = step?.mid === i;
            const isResult = step?.result === i;
            const inRange = step != null && i >= (step.lo ?? 0) && i <= (step.hi ?? ex.nums.length - 1);
            let cls = "fp-bar";
            if (isResult) cls += " result";
            else if (isMid) cls += " mid";
            else if (!inRange) cls += " out";
            return (
              <div key={i} className="fp-bar-col">
                <motion.div className={cls} style={{ height: h }}
                  animate={{ opacity: inRange || isResult ? 1 : 0.3 }}
                  transition={{ duration: 0.3 }} />
                <div className="fp-bar-val">{v}</div>
                <div className="fp-bar-idx">{i}</div>
                <div className="fp-bar-ptrs">
                  {isLo && <span className="fp-ptr lo">lo</span>}
                  {isMid && <span className="fp-ptr mid">mid</span>}
                  {isHi && <span className="fp-ptr hi">hi</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pointers */}
      <div className="fp-trackers">
        {[
          { label: "lo", val: step?.lo ?? 0, cls: "lo" },
          { label: "mid", val: step?.mid === -1 ? "-" : (step?.mid ?? "-"), cls: "mid" },
          { label: "hi", val: step?.hi ?? ex.nums.length - 1, cls: "hi" },
        ].map(({ label, val, cls }) => (
          <div key={label} className={`fp-tracker ${cls}`}>
            <span className="fp-tracker-label">{label}</span>
            <motion.span key={String(val)} className="fp-tracker-val" initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>{val}</motion.span>
          </div>
        ))}
      </div>

      {step?.result != null && (
        <div className="fp-result">✓ Peak at index {step.result} (value {ex.nums[step.result]})</div>
      )}

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
      <div className="fp-status">{step?.message ?? "Press Play to begin."}</div>
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
