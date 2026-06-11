import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { useCodeVisualConnectivity } from "../../hooks/useCodeVisualConnectivity";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./SingleNumberVisualizer.css";

const SOLUTION_CODE = [
  { line: 1, text: "def singleNumber(nums):" },
  { line: 2, text: "    result = 0" },
  { line: 3, text: "    for n in nums:" },
  { line: 4, text: "        result ^= n" },
  { line: 5, text: "    return result" },
];

const EXAMPLES = [
  { label: "Ex 1", nums: [2, 2, 1] },
  { label: "Ex 2", nums: [4, 1, 2, 1, 2] },
  { label: "Ex 3", nums: [3, 3, 7, 7, 5] },
];

function toBin(n, bits = 4) {
  return (n >>> 0).toString(2).padStart(bits, "0");
}

function generateSteps(nums) {
  const steps = [];
  let result = 0;
  steps.push({ activeLine: 2, result, cur: -1, message: "Init result = 0" });
  for (let i = 0; i < nums.length; i++) {
    const prev = result;
    result ^= nums[i];
    steps.push({
      activeLine: 4, result, prev, cur: i,
      message: `result(${toBin(prev)}) XOR ${nums[i]}(${toBin(nums[i])}) = ${result}(${toBin(result)})`,
    });
  }
  steps.push({ activeLine: 5, result, cur: -1, done: true, message: `Return ${result} — the single number` });
  return steps;
}

export default function SingleNumberVisualizer() {
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
  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

  const bits = 4;
  const resultBits = toBin(step?.result ?? 0, bits);

  return (
    <div className="sn-shell">
      <div className="sn-examples">
        {EXAMPLES.map(e => (
          <button key={e.label} className={`sn-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>{e.label}</button>
        ))}
      </div>

      {/* Array */}
      <div className="sn-panel">
        <div className="sn-panel-label">Input Array</div>
        <div className="sn-arr">
          {ex.nums.map((v, i) => {
            const isCur = step?.cur === i;
            return (
              <div key={i} className="sn-cell-col">
                <motion.div className={`sn-cell ${isCur ? "cur" : ""}`}
                  animate={{ scale: isCur ? 1.15 : 1, y: isCur ? -4 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                  {v}
                </motion.div>
                <div className="sn-bin">{toBin(v, bits)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* XOR visualization */}
      <div className="sn-panel">
        <div className="sn-panel-label">XOR accumulator (result)</div>
        <div className="sn-xor-row">
          {step?.cur >= 0 && (
            <>
              <div className="sn-xor-operand">
                <div className="sn-xor-label">prev</div>
                <div className="sn-bits-row">
                  {toBin(step.prev ?? 0, bits).split("").map((b, i) => (
                    <div key={i} className={`sn-bit ${b === "1" ? "one" : "zero"}`}>{b}</div>
                  ))}
                </div>
                <div className="sn-dec">{step.prev ?? 0}</div>
              </div>
              <div className="sn-xor-sym">XOR</div>
              <div className="sn-xor-operand">
                <div className="sn-xor-label">n={ex.nums[step.cur]}</div>
                <div className="sn-bits-row">
                  {toBin(ex.nums[step.cur], bits).split("").map((b, i) => (
                    <div key={i} className={`sn-bit cur ${b === "1" ? "one" : "zero"}`}>{b}</div>
                  ))}
                </div>
                <div className="sn-dec">{ex.nums[step.cur]}</div>
              </div>
              <div className="sn-xor-sym">=</div>
            </>
          )}
          <div className="sn-xor-operand result">
            <div className="sn-xor-label">result</div>
            <div className="sn-bits-row">
              {resultBits.split("").map((b, i) => (
                <motion.div key={i} className={`sn-bit result ${b === "1" ? "one" : "zero"}`}
                  animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                  {b}
                </motion.div>
              ))}
            </div>
            <motion.div key={step?.result} className="sn-dec result"
              initial={{ scale: 1.3, color: "#cba6f7" }} animate={{ scale: 1, color: "#cdd6f4" }}>
              {step?.result ?? 0}
            </motion.div>
          </div>
        </div>
      </div>

      {step?.done && (
        <div className="sn-result">✓ Single number = {step.result}</div>
      )}

      <CodeTracePanel
        step={step}
        codeLines={SOLUTION_CODE}
        highlightedLines={connectivity.highlightedLines}
        onLineSelect={connectivity.handleLineSelect}
        onActiveLineDomChange={setActiveLineDom}
      />
      <div className="sn-status">{step?.message ?? "Press Play to begin."}</div>
      <PlaybackControls
        isPlaying={isPlaying} isDone={isDone} speed={speed}
        onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
        prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
        onSpeedChange={e => setSpeed(Number(e.target.value))}
        showPatternOverlay={showPatternOverlay}
        onShowPatternOverlayChange={setShowPatternOverlay}
        patternOverlayLabel="Show pattern overlay"
        showPatternOverlayToggle
      />
      {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
    </div>
  );
}
