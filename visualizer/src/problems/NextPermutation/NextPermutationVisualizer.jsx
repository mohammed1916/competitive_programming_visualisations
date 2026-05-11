import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./NextPermutationVisualizer.css";

const SOLUTION_CODE = [
  { line: 1, text: "def nextPermutation(nums):" },
  { line: 2, text: "    i = len(nums) - 2" },
  { line: 3, text: "    while i >= 0 and nums[i] >= nums[i+1]:" },
  { line: 4, text: "        i -= 1" },
  { line: 5, text: "    if i >= 0:" },
  { line: 6, text: "        j = len(nums) - 1" },
  { line: 7, text: "        while nums[j] <= nums[i]:" },
  { line: 8, text: "            j -= 1" },
  { line: 9, text: "        nums[i], nums[j] = nums[j], nums[i]" },
  { line: 10, text: "    nums[i+1:] = reversed(nums[i+1:])" },
  { line: 11, text: "    return nums" },
];

const EXAMPLES = [
  { label: "[1,2,3]", nums: [1, 2, 3] },
  { label: "[3,2,1]", nums: [3, 2, 1] },
  { label: "[1,1,5]", nums: [1, 1, 5] },
  { label: "[1,3,2,4,3]", nums: [1, 3, 2, 4, 3] },
];

function generateSteps(input) {
  const nums = [...input];
  const steps = [];
  const n = nums.length;

  let i = n - 2;
  steps.push({ activeLine: 2, nums: [...nums], i, j: -1, pivotI: -1, swapJ: -1, reverseStart: -1, phase: "find-pivot", message: `Start: find rightmost i where nums[i] < nums[i+1]. i=${i}` });

  while (i >= 0 && nums[i] >= nums[i + 1]) {
    steps.push({ activeLine: 3, nums: [...nums], i, j: -1, pivotI: -1, swapJ: -1, reverseStart: -1, phase: "find-pivot", message: `nums[${i}]=${nums[i]} >= nums[${i+1}]=${nums[i+1]} → decrement i` });
    i--;
  }

  if (i < 0) {
    // Entirely descending – just reverse
    nums.reverse();
    steps.push({ activeLine: 10, nums: [...nums], i: -1, j: -1, pivotI: -1, swapJ: -1, reverseStart: 0, phase: "reverse", message: `No pivot found (fully descending). Reverse entire array → [${nums.join(",")}]` });
    steps.push({ activeLine: 11, nums: [...nums], i: -1, j: -1, pivotI: -1, swapJ: -1, reverseStart: -1, phase: "done", message: `Done: [${nums.join(",")}]` });
    return steps;
  }

  steps.push({ activeLine: 5, nums: [...nums], i, j: -1, pivotI: i, swapJ: -1, reverseStart: -1, phase: "found-pivot", message: `Pivot found: i=${i}, nums[${i}]=${nums[i]}` });

  // Find j: rightmost nums[j] > nums[i]
  let j = n - 1;
  while (nums[j] <= nums[i]) j--;
  steps.push({ activeLine: 8, nums: [...nums], i, j, pivotI: i, swapJ: j, reverseStart: -1, phase: "found-swap", message: `Swap target: j=${j}, nums[${j}]=${nums[j]} > nums[${i}]=${nums[i]}` });

  // Swap
  [nums[i], nums[j]] = [nums[j], nums[i]];
  steps.push({ activeLine: 9, nums: [...nums], i, j, pivotI: i, swapJ: j, reverseStart: -1, phase: "swapped", message: `Swapped nums[${i}] and nums[${j}] → [${nums.join(",")}]` });

  // Reverse suffix
  let lo = i + 1, hi = n - 1;
  while (lo < hi) { [nums[lo], nums[hi]] = [nums[hi], nums[lo]]; lo++; hi--; }
  steps.push({ activeLine: 10, nums: [...nums], i, j, pivotI: i, swapJ: -1, reverseStart: i + 1, phase: "reversed", message: `Reverse suffix from index ${i+1} → [${nums.join(",")}]` });
  steps.push({ activeLine: 11, nums: [...nums], i: -1, j: -1, pivotI: -1, swapJ: -1, reverseStart: -1, phase: "done", message: `Done: [${nums.join(",")}]` });
  return steps;
}

function cellClass(idx, step) {
  if (!step) return "";
  if (step.pivotI === idx) return "pivot";
  if (step.swapJ === idx) return "swap";
  if (step.reverseStart >= 0 && idx >= step.reverseStart) return "reversed";
  return "";
}

export default function NextPermutationVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.nums), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

  return (
    <div className="np-shell">
      <div className="np-examples">
        {EXAMPLES.map((e) => (
          <button key={e.label} className={`np-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>{e.label}</button>
        ))}
      </div>

      <div className="np-panel">
        <div className="np-panel-label">Array</div>
        <div className="np-array-row">
          <AnimatePresence mode="popLayout">
            {(step?.nums ?? ex.nums).map((val, idx) => (
              <motion.div key={idx} layout className={`np-cell ${cellClass(idx, step)}`}
                animate={{ y: 0 }} transition={{ type: "spring", stiffness: 350, damping: 22 }}>
                {val}
                <div className="np-idx">{idx}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="np-legend">
          <span className="np-leg pivot">■ pivot (i)</span>
          <span className="np-leg swap">■ swap target (j)</span>
          <span className="np-leg reversed">■ reversed suffix</span>
        </div>
      </div>

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      <div className="np-status">{step?.message ?? "Press Play to begin."}</div>
      <PlaybackControls
        isPlaying={isPlaying} isDone={isDone} speed={speed}
        onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
        prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
        onSpeedChange={(e) => setSpeed(Number(e.target.value))}
      />
    </div>
  );
}
