import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import FloatingPanel from "../../components/shared/FloatingPanel";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { useAutoScroll } from "../../hooks/useAutoScroll";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import DockableWorkspace from "../../components/shared/DockableWorkspace";
import "./PartitionEqualSubsetVisualizer.css";

const SOLUTION_CODE = [
  { line: 1, text: "def canPartition(nums):" },
  { line: 2, text: "    total = sum(nums)" },
  { line: 3, text: "    if total % 2 != 0: return False" },
  { line: 4, text: "    target = total // 2" },
  { line: 5, text: "    dp = {0}  # achievable sums" },
  { line: 6, text: "    for num in nums:" },
  { line: 7, text: "        dp = dp | {s + num for s in dp}" },
  { line: 8, text: "        if target in dp: return True" },
  { line: 9, text: "    return target in dp" },
];

const EXAMPLES = [
  { label: "[1,5,11,5]", nums: [1, 5, 11, 5] },
  { label: "[1,2,3,5]", nums: [1, 2, 3, 5] },
  { label: "[3,3,3,4,5]", nums: [3, 3, 3, 4, 5] },
  { label: "[1,1]", nums: [1, 1] },
];

function generateSteps(nums) {
  const steps = [];
  const total = nums.reduce((a, b) => a + b, 0);

  steps.push({ activeLine: 2, dp: new Set([0]), curNum: null, numIdx: -1, target: null, result: null, message: `total = ${total}` });

  if (total % 2 !== 0) {
    steps.push({ activeLine: 3, dp: new Set([0]), curNum: null, numIdx: -1, target: null, result: false, message: `total=${total} is odd → return false` });
    return steps;
  }

  const target = total / 2;
  steps.push({ activeLine: 4, dp: new Set([0]), curNum: null, numIdx: -1, target, result: null, message: `target = ${total}/2 = ${target}` });
  steps.push({ activeLine: 5, dp: new Set([0]), curNum: null, numIdx: -1, target, result: null, message: `Init dp = {0}` });

  let dp = new Set([0]);
  for (let ni = 0; ni < nums.length; ni++) {
    const num = nums[ni];
    const newDp = new Set(dp);
    for (const s of dp) newDp.add(s + num);
    dp = newDp;
    const found = dp.has(target);
    steps.push({
      activeLine: found ? 8 : 7, dp: new Set(dp), curNum: num, numIdx: ni, target, result: found ? true : null,
      message: `num=${num}: dp now has ${dp.size} sums. target ${target} in dp? ${found}`,
    });
    if (found) return steps;
  }

  const finalResult = dp.has(target);
  steps.push({ activeLine: 9, dp: new Set(dp), curNum: null, numIdx: -1, target, result: finalResult, message: `Done. target ${target} in dp? ${finalResult}` });
  return steps;
}

export default function PartitionEqualSubsetVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.nums), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
  const [autoScrollCode, setAutoScrollCode] = useAutoScroll();
  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

  const total = ex.nums.reduce((a, b) => a + b, 0);
  const target = step?.target ?? (total % 2 === 0 ? total / 2 : null);
  const dpArr = step ? [...step.dp].sort((a, b) => a - b) : [0];
  const maxSum = target != null ? target + 2 : Math.max(...ex.nums) + 1;

  // Create dockable panels
  const dockPanels = [
    {
      id: "input",
      title: "Input",
      content: (
        <div className="pes-panel-body">
          <div className="pes-examples">
            {EXAMPLES.map((e) => (
              <button
                key={e.label}
                className={`pes-chip ${ex.label === e.label ? "active" : ""}`}
                onClick={() => applyEx(e)}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "viz",
      title: "Visualization",
      content: (
        <div className="pes-panel-body">
          {/* Input nums */}
          <div className="pes-panel">
            <div className="pes-panel-label">nums (target = {target ?? "?"})</div>
            <div className="pes-array-row">
              {ex.nums.map((val, idx) => (
                <motion.div
                  key={idx}
                  className={`pes-cell ${step?.numIdx === idx ? "cur" : ""}`}
                  animate={{ scale: step?.numIdx === idx ? 1.2 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                >
                  {val}
                </motion.div>
              ))}
            </div>
          </div>

          {/* DP set visualized as tiles 0..target */}
          <div className="pes-panel">
            <div className="pes-panel-label">Reachable sums (dp set)</div>
            <div className="pes-dp-row">
              {Array.from({ length: maxSum }, (_, s) => {
                const inDp = step?.dp?.has(s);
                const isTarget = s === target;
                const isNew = inDp && step?.curNum != null && s >= (step.curNum ?? 0);
                return (
                  <motion.div
                    key={s}
                    className={`pes-sum ${inDp ? "in" : "out"} ${isTarget ? "target" : ""}`}
                    animate={{ scale: inDp ? 1 : 0.85 }}
                    transition={{ type: "spring", stiffness: 350, damping: 22 }}
                  >
                    {s}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {step?.result != null && (
            <div className={`pes-result ${step.result ? "true" : "false"}`}>
              {step.result ? "✓ Can partition!" : "✗ Cannot partition."}
            </div>
          )}

          <div className="pes-status">{step?.message ?? "Press Play to begin."}</div>
        </div>
      ),
    },
    {
      id: "code",
      title: "Code Trace",
      content: (
        <CodeTracePanel
          step={step}
          codeLines={SOLUTION_CODE}
          onActiveLineDomChange={setActiveLineDom}
          autoScroll={autoScrollCode}
        />
      ),
    },
  ];

  return (
    <div className="pes-shell">
      <DockableWorkspace
        title="Partition Equal Subset Sum Workspace"
        panels={dockPanels}
        initialLayout={{
          rows: [
            ["input", "viz"],
            ["code", "code"],
          ],
          minimized: [],
        }}
      />

      <FloatingPanel title="Playback Controls">
        <PlaybackControls
          onReset={handleReset}
          onPrev={stepBack}
          onPlayToggle={togglePlay}
          onNext={stepForward}
          resetDisabled={steps.length === 0}
          prevDisabled={stepIndex <= 0}
          nextDisabled={steps.length === 0 || isDone}
          isPlaying={isPlaying}
          isDone={isDone}
          speed={speed}
          onSpeedChange={(event) => setSpeed(Number(event.target.value))}
          speedIndicator={`${speed}ms`}
          autoScroll={autoScrollCode}
          onAutoScrollChange={setAutoScrollCode}
          autoScrollLabel="Auto-scroll code"
          showAutoScroll
          showPatternOverlay={showPatternOverlay}
          onShowPatternOverlayChange={setShowPatternOverlay}
          patternOverlayLabel="Show pattern overlay"
          showPatternOverlayToggle
        />
      </FloatingPanel>

      {showPatternOverlay && step && (
        <PatternOverlay step={step} activeLineDom={activeLineDom} />
      )}
    </div>
  );
}
