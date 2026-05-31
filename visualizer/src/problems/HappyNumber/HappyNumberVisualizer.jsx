import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { useCodeVisualConnectivity } from "../../hooks/useCodeVisualConnectivity";
import "./HappyNumberVisualizer.css";

const SOLUTION_CODE = [
  { line: 1, text: "def isHappy(n):" },
  { line: 2, text: "    seen = set()" },
  { line: 3, text: "    while n != 1:" },
  { line: 4, text: "        if n in seen: return False" },
  { line: 5, text: "        seen.add(n)" },
  { line: 6, text: "        n = sum(d**2 for d in digits(n))" },
  { line: 7, text: "    return True" },
];

const EXAMPLES = [
  { label: "19 (Happy)", n: 19 },
  { label: "7 (Happy)", n: 7 },
  { label: "2 (Sad)", n: 2 },
  { label: "4 (Sad)", n: 4 },
];

function sumOfSquaredDigits(n) {
  return String(n).split("").reduce((acc, d) => acc + Number(d) ** 2, 0);
}

function generateSteps(n) {
  const steps = [];
  const seen = new Set();
  let cur = n;
  steps.push({ activeLine: 2, cur, seen: new Set(seen), chain: [cur], message: `Start with n=${cur}` });

  const chain = [cur];
  while (cur !== 1) {
    if (seen.has(cur)) {
      steps.push({ activeLine: 4, cur, seen: new Set(seen), chain: [...chain], result: false, message: `${cur} seen before → cycle detected → return False` });
      return steps;
    }
    seen.add(cur);
    const digits = String(cur).split("").map(Number);
    const sq = digits.map(d => `${d}²=${d * d}`).join(" + ");
    const next = sumOfSquaredDigits(cur);
    chain.push(next);
    steps.push({ activeLine: 6, cur, seen: new Set(seen), chain: [...chain], squaredExpr: sq, next, message: `${sq} = ${next}` });
    cur = next;
    if (chain.length > 20) break; // safety
  }
  if (cur === 1) {
    steps.push({ activeLine: 7, cur, seen: new Set(seen), chain: [...chain], result: true, message: `n=1 → it's a Happy Number! Return True` });
  }
  return steps;
}

export default function HappyNumberVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(
    () =>
      generateSteps(ex.n).map((current) => ({
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

  const chain = step?.chain ?? [ex.n];

  return (
    <div className="hn-shell">
      <div className="hn-examples">
        {EXAMPLES.map(e => (
          <button key={e.label} className={`hn-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>{e.label}</button>
        ))}
      </div>

      {/* Chain */}
      <div className="hn-panel">
        <div className="hn-panel-label">Transformation chain</div>
        <div className="hn-chain">
          <AnimatePresence mode="popLayout">
            {chain.map((v, i) => {
              const isCur = i === chain.length - 1;
              const isSeen = step?.seen?.has(v) && !isCur;
              const isOne = v === 1;
              return (
                <motion.div key={`${i}-${v}`} className="hn-chain-item"
                  initial={{ opacity: 0, scale: 0.5, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                  <div className={`hn-node ${isCur ? "cur" : ""} ${isOne ? "one" : ""} ${isSeen && isCur ? "cycle" : ""}`}>
                    {v}
                  </div>
                  {i < chain.length - 1 && <span className="hn-arrow">→</span>}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Seen set */}
      <div className="hn-panel">
        <div className="hn-panel-label">Seen set</div>
        <div className="hn-seen">
          <AnimatePresence mode="popLayout">
            {[...(step?.seen ?? [])].map(v => (
              <motion.div key={v} className={`hn-seen-item ${step?.cur === v && step?.result === false ? "cycle" : ""}`}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}>
                {v}
              </motion.div>
            ))}
          </AnimatePresence>
          {(step?.seen?.size ?? 0) === 0 && <span className="hn-empty">empty</span>}
        </div>
      </div>

      {step?.squaredExpr && (
        <div className="hn-expr">{step.cur} → {step.squaredExpr} = {step.next}</div>
      )}

      {step?.result != null && (
        <div className={`hn-result ${step.result ? "happy" : "sad"}`}>
          {step.result ? `✓ ${ex.n} is a Happy Number` : `✗ ${ex.n} is NOT a Happy Number (cycle detected)`}
        </div>
      )}

      <CodeTracePanel
        step={step}
        codeLines={SOLUTION_CODE}
        highlightedLines={connectivity.highlightedLines}
        onLineSelect={connectivity.handleLineSelect}
      />
      <div className="hn-status">{step?.message ?? "Press Play to begin."}</div>
      <PlaybackControls
        isPlaying={isPlaying} isDone={isDone} speed={speed}
        onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
        prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
        onSpeedChange={e => setSpeed(Number(e.target.value))}
      />
    </div>
  );
}
