import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./FirstBadVersionVisualizer.css";

const SOLUTION_CODE = [
  { line: 1, text: "def firstBadVersion(n):" },
  { line: 2, text: "    lo, hi = 1, n" },
  { line: 3, text: "    while lo < hi:" },
  { line: 4, text: "        mid = (lo + hi) // 2" },
  { line: 5, text: "        if isBadVersion(mid):" },
  { line: 6, text: "            hi = mid   # bad version, search left half" },
  { line: 7, text: "        else:" },
  { line: 8, text: "            lo = mid + 1  # good version, search right half" },
  { line: 9, text: "    return lo" },
];

const EXAMPLES = [
  { label: "n=5, bad=4", n: 5, bad: 4 },
  { label: "n=10, bad=7", n: 10, bad: 7 },
  { label: "n=1, bad=1", n: 1, bad: 1 },
  { label: "n=8, bad=2", n: 8, bad: 2 },
];

function generateSteps(n, bad) {
  const steps = [];
  let lo = 1, hi = n;
  let apiCalls = 0;

  steps.push({
    activeLine: 2,
    lo,
    hi,
    mid: null,
    apiResult: null,
    apiCalls,
    message: `Initialize lo=1, hi=${n}. We must find the first bad version.`,
  });

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps.push({
      activeLine: 4,
      lo,
      hi,
      mid,
      apiResult: null,
      apiCalls,
      message: `Compute mid = (${lo} + ${hi}) // 2 = ${mid}`,
    });

    const isBad = mid >= bad;
    apiCalls++;
    steps.push({
      activeLine: 5,
      lo,
      hi,
      mid,
      apiResult: isBad,
      apiCalls,
      message: `isBadVersion(${mid}) → ${isBad ? "true (bad!)" : "false (good)"}  [API call #${apiCalls}]`,
    });

    if (isBad) {
      hi = mid;
      steps.push({
        activeLine: 6,
        lo,
        hi,
        mid,
        apiResult: isBad,
        apiCalls,
        message: `mid ${mid} is bad → hi = mid = ${hi}. First bad is at or before ${hi}.`,
      });
    } else {
      lo = mid + 1;
      steps.push({
        activeLine: 8,
        lo,
        hi,
        mid,
        apiResult: isBad,
        apiCalls,
        message: `mid ${mid} is good → lo = mid+1 = ${lo}. First bad is after ${mid}.`,
      });
    }
  }

  steps.push({
    activeLine: 9,
    lo,
    hi,
    mid: lo,
    apiResult: null,
    apiCalls,
    result: lo,
    message: `lo == hi == ${lo}. First bad version is ${lo}. Used ${apiCalls} API call${apiCalls !== 1 ? "s" : ""}.`,
  });

  return steps;
}

export default function FirstBadVersionVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.n, ex.bad), [ex]);
  const {
    stepIndex, stepForward, stepBack, togglePlay, handleReset,
    isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length);
  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

  const step = stepIndex >= 0 ? steps[stepIndex] : null;

  const applyEx = useCallback(
    (e) => { setEx(e); handleReset(); },
    [handleReset]
  );

  const versions = Array.from({ length: ex.n }, (_, i) => i + 1);

  return (
    <div className="fbv-shell">
      {/* Example selector */}
      <div className="fbv-examples">
        {EXAMPLES.map((e) => (
          <button
            key={e.label}
            className={`fbv-chip ${ex.label === e.label ? "active" : ""}`}
            onClick={() => applyEx(e)}
          >
            {e.label}
          </button>
        ))}
      </div>

      {/* Versions row */}
      <div className="fbv-panel">
        <div className="fbv-panel-label">Versions (1 … {ex.n})</div>
        <div className="fbv-versions">
          {versions.map((v) => {
            const isLo = step?.lo === v;
            const isHi = step?.hi === v;
            const isMid = step?.mid === v;
            const isResult = step?.result === v;
            const inRange =
              step != null && v >= (step.lo ?? 1) && v <= (step.hi ?? ex.n);
            const isActuallyBad = v >= ex.bad;

            let cellCls = "fbv-cell";
            if (isResult) cellCls += " result";
            else if (isMid) {
              cellCls += step.apiResult === true ? " mid-bad" : step.apiResult === false ? " mid-good" : " mid";
            } else if (!inRange && step != null) cellCls += " out";
            else if (isActuallyBad && step != null) cellCls += " bad-hint";

            return (
              <div key={v} className="fbv-cell-col">
                <motion.div
                  className={cellCls}
                  animate={{ opacity: (inRange || isResult || step == null) ? 1 : 0.25 }}
                  transition={{ duration: 0.25 }}
                >
                  {v}
                </motion.div>
                <div className="fbv-cell-ptrs">
                  {isLo && <span className="fbv-ptr lo">lo</span>}
                  {isMid && <span className="fbv-ptr mid">mid</span>}
                  {isHi && <span className="fbv-ptr hi">hi</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="fbv-legend">
          <span className="fbv-legend-dot bad" /> Bad version
          <span className="fbv-legend-dot good" /> Good version
          <span className="fbv-legend-dot mid-bad-dot" /> isBadVersion=true
          <span className="fbv-legend-dot mid-good-dot" /> isBadVersion=false
        </div>
      </div>

      {/* Pointer trackers + API counter */}
      <div className="fbv-trackers">
        {[
          { label: "lo", val: step?.lo ?? 1, cls: "lo" },
          { label: "mid", val: step?.mid != null ? step.mid : "-", cls: "mid" },
          { label: "hi", val: step?.hi ?? ex.n, cls: "hi" },
          { label: "API calls", val: step?.apiCalls ?? 0, cls: "api" },
        ].map(({ label, val, cls }) => (
          <div key={label} className={`fbv-tracker ${cls}`}>
            <span className="fbv-tracker-label">{label}</span>
            <motion.span
              key={String(val)}
              className="fbv-tracker-val"
              initial={{ scale: 1.35 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.25 }}
            >
              {val}
            </motion.span>
          </div>
        ))}
      </div>

      {/* Result banner */}
      {step?.result != null && (
        <motion.div
          className="fbv-result"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          First bad version: {step.result} &nbsp;|&nbsp; {step.apiCalls} API call{step.apiCalls !== 1 ? "s" : ""}
        </motion.div>
      )}

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
      <div className="fbv-status">{step?.message ?? "Press Play or Step to begin."}</div>
      <PlaybackControls
        isPlaying={isPlaying}
        isDone={isDone}
        speed={speed}
        onPlayToggle={togglePlay}
        onPrev={stepBack}
        onNext={stepForward}
        onReset={handleReset}
        prevDisabled={stepIndex < 0}
        nextDisabled={isDone}
        resetDisabled={stepIndex < 0}
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
