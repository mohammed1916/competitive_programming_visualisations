import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { useCodeVisualConnectivity } from "../../hooks/useCodeVisualConnectivity";
import "./ContainsDuplicateVisualizer.css";

const SOLUTION_CODE = [
  { line: 1, text: "def containsDuplicate(nums):" },
  { line: 2, text: "    seen = set()" },
  { line: 3, text: "    for n in nums:" },
  { line: 4, text: "        if n in seen:" },
  { line: 5, text: "            return True" },
  { line: 6, text: "        seen.add(n)" },
  { line: 7, text: "    return False" },
];

const EXAMPLES = [
  { label: "Has Dup", nums: [1, 2, 3, 1] },
  { label: "No Dup",  nums: [1, 2, 3, 4] },
  { label: "Multi",   nums: [1, 1, 1, 3, 3, 4, 3, 2, 4, 2] },
];

function generateSteps(nums) {
  const steps = [];
  const seen = new Set();
  steps.push({ activeLine: 2, cur: -1, seen: new Set(), message: "Init seen = empty set" });
  for (let i = 0; i < nums.length; i++) {
    const n = nums[i];
    steps.push({ activeLine: 4, cur: i, seen: new Set(seen), message: `Check: is ${n} in seen?` });
    if (seen.has(n)) {
      steps.push({ activeLine: 5, cur: i, seen: new Set(seen), result: true, message: `${n} found in seen → return True` });
      return steps;
    }
    seen.add(n);
    steps.push({ activeLine: 6, cur: i, seen: new Set(seen), message: `${n} not in seen → add to seen` });
  }
  steps.push({ activeLine: 7, cur: -1, seen: new Set(seen), result: false, message: "No duplicates found → return False" });
  return steps;
}

export default function ContainsDuplicateVisualizer() {
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

  return (
    <div className="cd-shell">
      <div className="cd-examples">
        {EXAMPLES.map(e => (
          <button key={e.label} className={`cd-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>{e.label}</button>
        ))}
      </div>

      {/* Array */}
      <div className="cd-panel">
        <div className="cd-panel-label">Input Array</div>
        <div className="cd-arr">
          {ex.nums.map((v, i) => {
            const isCur = step?.cur === i;
            const isDup = isCur && step?.result === true;
            const inSeen = step?.seen?.has(v) && !isCur;
            return (
              <div key={i} className="cd-cell-col">
                <motion.div className={`cd-cell ${isCur ? (isDup ? "dup" : "cur") : inSeen ? "seen" : ""}`}
                  animate={{ scale: isCur ? 1.15 : 1, y: isCur ? -4 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                  {v}
                </motion.div>
                <div className="cd-idx">{i}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seen set */}
      <div className="cd-panel">
        <div className="cd-panel-label">Seen set</div>
        <div className="cd-seen">
          <AnimatePresence mode="popLayout">
            {[...(step?.seen ?? [])].map(v => (
              <motion.div key={v} className={`cd-seen-item ${step?.result === true && step?.cur >= 0 && ex.nums[step.cur] === v ? "dup" : ""}`}
                initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                {v}
              </motion.div>
            ))}
          </AnimatePresence>
          {(step?.seen?.size ?? 0) === 0 && <span className="cd-empty">empty</span>}
        </div>
      </div>

      {step?.result != null && (
        <div className={`cd-result ${step.result ? "dup" : "none"}`}>
          {step.result ? "✓ Duplicate found → true" : "✗ No duplicates → false"}
        </div>
      )}

      <CodeTracePanel
        step={step}
        codeLines={SOLUTION_CODE}
        highlightedLines={connectivity.highlightedLines}
        onLineSelect={connectivity.handleLineSelect}
      />
      <div className="cd-status">{step?.message ?? "Press Play to begin."}</div>
      <PlaybackControls
        isPlaying={isPlaying} isDone={isDone} speed={speed}
        onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
        prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
        onSpeedChange={e => setSpeed(Number(e.target.value))}
      />
    </div>
  );
}
