import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./BasicCalculatorVisualizer.css";

const SOLUTION_CODE = [
  { line: 1,  text: "def calculate(s):" },
  { line: 2,  text: "    stack, result, num, sign = [], 0, 0, 1" },
  { line: 3,  text: "    for ch in s:" },
  { line: 4,  text: "        if ch.isdigit():" },
  { line: 5,  text: "            num = num * 10 + int(ch)" },
  { line: 6,  text: "        elif ch in '+-':" },
  { line: 7,  text: "            result += sign * num" },
  { line: 8,  text: "            num = 0; sign = 1 if ch=='+' else -1" },
  { line: 9,  text: "        elif ch == '(':" },
  { line: 10, text: "            stack.append(result); stack.append(sign)" },
  { line: 11, text: "            result = 0; sign = 1" },
  { line: 12, text: "        elif ch == ')':" },
  { line: 13, text: "            result += sign * num; num = 0" },
  { line: 14, text: "            result *= stack.pop()  # sign" },
  { line: 15, text: "            result += stack.pop()  # prev result" },
  { line: 16, text: "    return result + sign * num" },
];

const EXAMPLES = [
  { label: "1+1", s: "1 + 1" },
  { label: "2-1+2", s: " 2-1 + 2 " },
  { label: "Nested", s: "(1+(4+5+2)-3)+(6+8)" },
];

function generateSteps(s) {
  const steps = [];
  const chars = s.split("");
  let stack = [], result = 0, num = 0, sign = 1;

  steps.push({ activeLine: 2, stack: [], result: 0, num: 0, sign: 1, charIdx: -1, phase: "init", message: "Init: result=0, num=0, sign=+1, stack=[]" });

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === " ") continue;

    if (/\d/.test(ch)) {
      num = num * 10 + parseInt(ch);
      steps.push({ activeLine: 5, stack: [...stack], result, num, sign, charIdx: i, phase: "digit", message: `Digit '${ch}' → num=${num}` });
    } else if (ch === "+" || ch === "-") {
      result += sign * num;
      num = 0;
      sign = ch === "+" ? 1 : -1;
      steps.push({ activeLine: 8, stack: [...stack], result, num, sign, charIdx: i, phase: "op", message: `'${ch}' → result=${result}, sign=${sign > 0 ? "+1" : "-1"}` });
    } else if (ch === "(") {
      stack.push(result);
      stack.push(sign);
      result = 0; sign = 1;
      steps.push({ activeLine: 10, stack: [...stack], result, num, sign, charIdx: i, phase: "open", message: `'(' → push result/sign, reset. stack=[${stack.join(",")}]` });
    } else if (ch === ")") {
      result += sign * num;
      num = 0;
      const prevSign = stack.pop();
      const prevResult = stack.pop();
      result = prevResult + prevSign * result;
      steps.push({ activeLine: 15, stack: [...stack], result, num, sign, charIdx: i, phase: "close", message: `')' → pop sign/result → result=${result}` });
    }
  }

  result += sign * num;
  steps.push({ activeLine: 16, stack: [], result, num, sign, charIdx: -1, phase: "done", done: true, message: `Final: result + sign*num = ${result}` });
  return steps;
}

export default function BasicCalculatorVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.s), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

  const stack = step?.stack ?? [];
  const result = step?.result ?? 0;
  const num = step?.num ?? 0;
  const sign = step?.sign ?? 1;
  const charIdx = step?.charIdx ?? -1;
  const phase = step?.phase ?? "init";
  const chars = ex.s.split("");

  return (
    <div className="bc-shell">
      <div className="bc-examples">
        {EXAMPLES.map(e => (
          <button key={e.label} className={`bc-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
            {e.label}
          </button>
        ))}
      </div>

      <div className="bc-panel">
        <div className="bc-panel-label">Expression</div>
        <div className="bc-expr">
          {chars.map((ch, i) => (
            <motion.span
              key={i}
              className={`bc-char ${i === charIdx ? "active-char" : ""} ${ch === "(" || ch === ")" ? "paren" : ""} ${ch === "+" || ch === "-" ? "op" : ""} ${/\d/.test(ch) ? "digit" : ""}`}
              animate={{ scale: i === charIdx ? 1.3 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              {ch}
            </motion.span>
          ))}
        </div>
      </div>

      <div className="bc-row">
        <div className="bc-panel bc-half">
          <div className="bc-panel-label">Stack</div>
          <div className="bc-stack">
            <AnimatePresence>
              {[...stack].reverse().map((v, i) => (
                <motion.div key={stack.length - 1 - i} className="bc-stack-item"
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  {v}
                </motion.div>
              ))}
            </AnimatePresence>
            {stack.length === 0 && <span className="bc-empty">empty</span>}
          </div>
        </div>
        <div className="bc-panel bc-half">
          <div className="bc-panel-label">State</div>
          <div className="bc-state">
            <div className="bc-state-row"><span className="bc-state-label">result</span><motion.span key={result} className="bc-state-val bc-result" initial={{ scale: 1.2 }} animate={{ scale: 1 }}>{result}</motion.span></div>
            <div className="bc-state-row"><span className="bc-state-label">num</span><span className="bc-state-val">{num}</span></div>
            <div className="bc-state-row"><span className="bc-state-label">sign</span><span className={`bc-state-val bc-sign ${sign > 0 ? "pos" : "neg"}`}>{sign > 0 ? "+1" : "−1"}</span></div>
            <div className="bc-state-row"><span className="bc-state-label">phase</span><span className={`bc-state-val bc-phase ${phase}`}>{phase}</span></div>
          </div>
        </div>
      </div>

      {step?.done && <div className="bc-result-box">✓ Result = {result}</div>}

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      <div className="bc-status">{step?.message ?? "Press Play to begin."}</div>
      <PlaybackControls
        isPlaying={isPlaying} isDone={isDone} speed={speed}
        onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
        prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
        onSpeedChange={e => setSpeed(Number(e.target.value))}
      />
    </div>
  );
}
