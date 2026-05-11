import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./MinSizeSubarraySumVisualizer.css";

const SOLUTION_CODE = [
  { line: 1, text: "def minSubArrayLen(target, nums):" },
  { line: 2, text: "    l, total, res = 0, 0, float('inf')" },
  { line: 3, text: "    for r in range(len(nums)):" },
  { line: 4, text: "        total += nums[r]" },
  { line: 5, text: "        while total >= target:" },
  { line: 6, text: "            res = min(res, r - l + 1)" },
  { line: 7, text: "            total -= nums[l]" },
  { line: 8, text: "            l += 1" },
  { line: 9, text: "    return 0 if res == inf else res" },
];

const EXAMPLES = [
  { label: "Ex 1", target: 7, nums: [2, 3, 1, 2, 4, 3] },
  { label: "Ex 2", target: 4, nums: [1, 4, 4] },
  { label: "Ex 3", target: 11, nums: [1, 1, 1, 1, 1, 1, 1, 1] },
];

function generateSteps(target, nums) {
  const steps = [];
  let l = 0, total = 0, res = Infinity;
  steps.push({ activeLine: 2, l, r: -1, total, res, message: `Init l=0, total=0, res=∞, target=${target}` });

  for (let r = 0; r < nums.length; r++) {
    total += nums[r];
    steps.push({ activeLine: 4, l, r, total, res, message: `r=${r}: total += nums[${r}](${nums[r]}) → total=${total}` });
    while (total >= target) {
      const len = r - l + 1;
      if (len < res) res = len;
      steps.push({ activeLine: 6, l, r, total, res, message: `total(${total}) >= target(${target}) → window[${l}..${r}] len=${len}, res=${res}` });
      total -= nums[l];
      l++;
      steps.push({ activeLine: 8, l, r, total, res, message: `Shrink left: l=${l}, total=${total}` });
    }
  }
  const finalRes = res === Infinity ? 0 : res;
  steps.push({ activeLine: 9, l, r: nums.length - 1, total, res: finalRes, result: finalRes, message: res === Infinity ? `res=∞ → return 0 (no valid subarray)` : `return ${finalRes}` });
  return steps;
}

export default function MinSizeSubarraySumVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.target, ex.nums), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

  return (
    <div className="ms-shell">
      <div className="ms-examples">
        {EXAMPLES.map((e) => (
          <button key={e.label} className={`ms-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>{e.label}</button>
        ))}
      </div>
      <div className="ms-target-row">
        <span className="ms-label">target:</span>
        <span className="ms-target-val">{ex.target}</span>
      </div>

      {/* Array with window */}
      <div className="ms-panel">
        <div className="ms-panel-label">Sliding Window</div>
        <div className="ms-array">
          {ex.nums.map((v, i) => {
            const inWindow = step != null && step.r >= 0 && i >= step.l && i <= step.r;
            const isL = step?.l === i;
            const isR = step?.r === i;
            return (
              <div key={i} className="ms-cell-col">
                <motion.div className={`ms-cell ${inWindow ? "window" : ""} ${isL ? "left" : ""} ${isR ? "right" : ""}`}
                  animate={{ y: inWindow ? -4 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                  {v}
                </motion.div>
                <div className="ms-idx">{i}</div>
                <div className="ms-ptrs">
                  {isL && <span className="ms-ptr l">l</span>}
                  {isR && <span className="ms-ptr r">r</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trackers */}
      <div className="ms-trackers">
        {[
          { label: "l", val: step?.l ?? 0 },
          { label: "r", val: step?.r === -1 ? "-" : (step?.r ?? "-") },
          { label: "total", val: step?.total ?? 0 },
          { label: "res", val: step?.res === Infinity ? "∞" : (step?.res ?? "∞") },
        ].map(({ label, val }) => (
          <div key={label} className="ms-tracker">
            <span className="ms-tracker-label">{label}</span>
            <motion.span key={String(val)} className="ms-tracker-val" initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>{val}</motion.span>
          </div>
        ))}
      </div>

      {step?.result != null && (
        <div className={`ms-result ${step.result > 0 ? "ok" : "fail"}`}>
          {step.result > 0 ? `✓ Minimum length: ${step.result}` : "✗ No valid subarray found (return 0)"}
        </div>
      )}

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      <div className="ms-status">{step?.message ?? "Press Play to begin."}</div>
      <PlaybackControls
        isPlaying={isPlaying} isDone={isDone} speed={speed}
        onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
        prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
        onSpeedChange={(e) => setSpeed(Number(e.target.value))}
      />
    </div>
  );
}
