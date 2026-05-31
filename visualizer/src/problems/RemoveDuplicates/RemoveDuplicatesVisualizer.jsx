import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { useCodeVisualConnectivity } from "../../hooks/useCodeVisualConnectivity";
import "./RemoveDuplicatesVisualizer.css";

const SOLUTION_CODE = [
  { line: 1, text: "def removeDuplicates(nums):" },
  { line: 2, text: "    k = 1  # slow pointer (next write pos)" },
  { line: 3, text: "    for i in range(1, len(nums)):" },
  { line: 4, text: "        if nums[i] != nums[i - 1]:" },
  { line: 5, text: "            nums[k] = nums[i]" },
  { line: 6, text: "            k += 1" },
  { line: 7, text: "    return k" },
];

const EXAMPLES = [
  { label: "Ex 1", nums: [1, 1, 2] },
  { label: "Ex 2", nums: [0, 0, 1, 1, 1, 2, 2, 3, 3, 4] },
  { label: "Ex 3", nums: [1, 2, 2, 3, 4, 4, 5] },
];

function generateSteps(numsIn) {
  const steps = [];
  const arr = [...numsIn];
  let k = 1;
  steps.push({ activeLine: 2, arr: [...arr], k, i: -1, message: "Init k=1 (write pointer at index 1)" });
  for (let i = 1; i < arr.length; i++) {
    steps.push({ activeLine: 4, arr: [...arr], k, i, message: `i=${i}: nums[${i}]=${arr[i]} vs nums[${i - 1}]=${arr[i - 1]}` });
    if (arr[i] !== arr[i - 1]) {
      arr[k] = arr[i];
      steps.push({ activeLine: 5, arr: [...arr], k, i, message: `New value! Write nums[${i}]=${arr[i]} → nums[${k}]` });
      k++;
      steps.push({ activeLine: 6, arr: [...arr], k, i, message: `k++ → k=${k}` });
    } else {
      steps.push({ activeLine: 3, arr: [...arr], k, i, message: `Duplicate: nums[${i}]=${arr[i]}, skip` });
    }
  }
  steps.push({ activeLine: 7, arr: [...arr], k, i: -1, done: true, message: `return k=${k}. First ${k} elements: [${arr.slice(0, k).join(", ")}]` });
  return steps;
}

export default function RemoveDuplicatesVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(
    () =>
      generateSteps(ex.nums).map((current) => ({
        ...current,
        relatedLines: current.relatedLines ?? (current.activeLine != null ? [current.activeLine] : []),
      })),
    [ex],
  );
  const { stepIndex, setStepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
  const connectivity = useCodeVisualConnectivity({
    steps,
    stepIndex,
    onStepJump: setStepIndex,
  });

  const arr = step?.arr ?? ex.nums;
  const k = step?.k ?? 1;
  const i = step?.i ?? -1;

  return (
    <div className="rd-shell">
      <div className="rd-examples">
        {EXAMPLES.map(e => (
          <button key={e.label} className={`rd-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>{e.label}</button>
        ))}
      </div>

      <div className="rd-panel">
        <div className="rd-panel-label">Array (in-place)</div>
        <div className="rd-arr">
          {arr.map((v, idx) => {
            const isI = idx === i;
            const isK = idx === k;
            const inResult = idx < k;
            return (
              <div key={idx} className="rd-cell-col">
                <motion.div
                  className={`rd-cell ${isI ? "i-cell" : ""} ${isK && !isI ? "k-cell" : ""} ${inResult && !isI && !isK ? "result" : ""}`}
                  animate={{ scale: isI || isK ? 1.12 : 1, y: isI ? -4 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                  {v}
                </motion.div>
                <div className="rd-idx">{idx}</div>
                <div className="rd-ptrs">
                  {isI && <span className="rd-ptr i">i</span>}
                  {isK && <span className="rd-ptr k">k</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="rd-divider-row">
          <div className="rd-divider-label">result zone (0..k-1)</div>
          <div className="rd-divider-bar" style={{ width: `${k * 52}px` }} />
        </div>
      </div>

      {step?.done && (
        <div className="rd-result">✓ k = {k}  →  unique values: [{arr.slice(0, k).join(", ")}]</div>
      )}

      <CodeTracePanel
        step={step}
        codeLines={SOLUTION_CODE}
        highlightedLines={connectivity.highlightedLines}
        onLineSelect={connectivity.handleLineSelect}
      />
      <div className="rd-status">{step?.message ?? "Press Play to begin."}</div>
      <PlaybackControls
        isPlaying={isPlaying} isDone={isDone} speed={speed}
        onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
        prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
        onSpeedChange={e => setSpeed(Number(e.target.value))}
      />
    </div>
  );
}
