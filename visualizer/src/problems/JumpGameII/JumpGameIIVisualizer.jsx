import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import FloatingPanel from "../../components/shared/FloatingPanel";
import PatternOverlay from "../../components/PatternOverlay";
import DockableWorkspace from "../../components/shared/DockableWorkspace";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import { useAutoScroll } from "../../hooks/useAutoScroll";
import "./JumpGameIIVisualizer.css";

const SOLUTION_CODE = [
  { line: 1, text: "def jump(nums):" },
  { line: 2, text: "    jumps = 0; curEnd = 0; farthest = 0" },
  { line: 3, text: "    for i in range(len(nums) - 1):" },
  { line: 4, text: "        farthest = max(farthest, i + nums[i])" },
  { line: 5, text: "        if i == curEnd:" },
  { line: 6, text: "            jumps += 1" },
  { line: 7, text: "            curEnd = farthest" },
  { line: 8, text: "            if curEnd >= len(nums)-1: break" },
  { line: 9, text: "    return jumps" },
];

const EXAMPLES = [
  { label: "[2,3,1,1,4]", nums: [2, 3, 1, 1, 4] },
  { label: "[2,3,0,1,4]", nums: [2, 3, 0, 1, 4] },
  { label: "[1,1,1,1]", nums: [1, 1, 1, 1] },
  { label: "[3,2,1,0,4]", nums: [3, 2, 1, 0, 4] },
];

function generateSteps(nums) {
  const steps = [];
  const n = nums.length;
  let jumps = 0, curEnd = 0, farthest = 0;

  steps.push({ activeLine: 2, i: -1, jumps, curEnd, farthest, message: `Init: jumps=0, curEnd=0, farthest=0` });

  for (let i = 0; i < n - 1; i++) {
    const newFarthest = Math.max(farthest, i + nums[i]);
    farthest = newFarthest;
    steps.push({ activeLine: 4, i, jumps, curEnd, farthest, message: `i=${i}, nums[${i}]=${nums[i]}: farthest=max(${farthest},${i}+${nums[i]})=${farthest}` });

    if (i === curEnd) {
      jumps++;
      curEnd = farthest;
      steps.push({ activeLine: 6, i, jumps, curEnd, farthest, message: `Reached end of jump range (i=${i}=curEnd). jumps=${jumps}, curEnd=${curEnd}` });
      if (curEnd >= n - 1) {
        steps.push({ activeLine: 8, i, jumps, curEnd, farthest, message: `curEnd=${curEnd} >= last index=${n-1}. Break.` });
        break;
      }
    }
  }

  steps.push({ activeLine: 9, i: n - 1, jumps, curEnd, farthest, message: `Done! Minimum jumps = ${jumps}` });
  return steps;
}

const BAR_MAX_H = 80;

// Component for array visualization
function ArrayVisualization({ nums, step, maxVal }) {
  return (
    <div className="jg2-panel">
      <div className="jg2-panel-label">Array — current position / jump range / farthest</div>
      <div className="jg2-array-wrap">
        {nums.map((val, idx) => {
          const isCur = step?.i === idx;
          const inRange = step && idx <= step.curEnd && idx >= 0;
          const isFarthest = step?.farthest === idx;
          const barH = Math.round((val / maxVal) * BAR_MAX_H);
          return (
            <div key={idx} className="jg2-col">
              <div className="jg2-bar-wrap" style={{ height: BAR_MAX_H }}>
                <motion.div
                  className={`jg2-bar ${isCur ? "cur" : inRange ? "range" : ""}`}
                  animate={{ height: barH }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  style={{ height: barH }}
                />
              </div>
              <motion.div
                className={`jg2-cell ${isCur ? "cur" : inRange ? "range" : ""} ${isFarthest ? "farthest" : ""}`}
                animate={{ scale: isCur ? 1.15 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
              >
                {val}
              </motion.div>
              <div className="jg2-idx">{idx}</div>
              {isCur && <div className="jg2-ptr cur-ptr">i</div>}
              {isFarthest && step?.farthest !== step?.curEnd && <div className="jg2-ptr far-ptr">far</div>}
              {step?.curEnd === idx && <div className="jg2-ptr end-ptr">end</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Component for stats display
function StatsDisplay({ step }) {
  return (
    <div className="jg2-stats-row">
      <div className="jg2-stat"><span className="jg2-stat-l">jumps</span><span className="jg2-stat-v jumps">{step?.jumps ?? 0}</span></div>
      <div className="jg2-stat"><span className="jg2-stat-l">curEnd</span><span className="jg2-stat-v curend">{step?.curEnd ?? 0}</span></div>
      <div className="jg2-stat"><span className="jg2-stat-l">farthest</span><span className="jg2-stat-v farthest">{step?.farthest ?? 0}</span></div>
    </div>
  );
}

export default function JumpGameIIVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.nums), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();
  const [autoScrollCode, setAutoScrollCode] = useAutoScroll();

  const maxVal = Math.max(...ex.nums, 1);

  const dockPanels = [
    {
      id: "input",
      title: "Input Playground",
      subtitle: "Select or create test cases",
      defaultZone: "left",
      content: (
        <div className="jg2-panel">
          <div className="jg2-panel-label">Test Cases</div>
          <div className="jg2-examples">
            {EXAMPLES.map((e) => (
              <button
                key={e.label}
                className={`jg2-chip ${ex.label === e.label ? "active" : ""}`}
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
      title: "Array Visualization",
      subtitle: step ? `Step ${stepIndex + 1} of ${steps.length}` : "Press play to visualize",
      defaultZone: "right",
      content: (
        <div>
          <ArrayVisualization nums={ex.nums} step={step} maxVal={maxVal} />
          <StatsDisplay step={step} />
          <div className="jg2-status">{step?.message ?? "Press Play to begin."}</div>
        </div>
      ),
    },
    {
      id: "code",
      title: "Code Trace",
      subtitle: step ? `Active line ${step.activeLine}` : "Line-by-line solution view",
      defaultZone: "full",
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
    <div className="jg2-shell">
      <DockableWorkspace
        title="Jump Game II Workspace"
        panels={dockPanels}
        initialLayout={{
          rows: [
            ["input", "viz"],
            ["code"],
          ],
          minimized: [],
        }}
      />

      <FloatingPanel title="Playback Controls">
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
          autoScroll={autoScrollCode}
          onAutoScrollChange={setAutoScrollCode}
          autoScrollLabel="Auto-scroll code"
          showAutoScroll
        />
      </FloatingPanel>

      {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
    </div>
  );
}
