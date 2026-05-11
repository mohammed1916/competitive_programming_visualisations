import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./NumberOf1BitsVisualizer.css";

const SOLUTION_CODE = [
  { line: 1, text: "def hammingWeight(n):" },
  { line: 2, text: "    count = 0" },
  { line: 3, text: "    while n != 0:" },
  { line: 4, text: "        count += n & 1  # check LSB" },
  { line: 5, text: "        n >>= 1        # shift right" },
  { line: 6, text: "    return count" },
];

const EXAMPLES = [
  { label: "Ex 1", n: 0b00000000000000000000000000001011, desc: "11 (0b1011)" },
  { label: "Ex 2", n: 0b00000000000000000000000010000000, desc: "128 (0b10000000)" },
  { label: "Ex 3", n: 0b11111111111111111111111111111101, desc: "4294967293 (0b1111…1101)" },
];

function toBin32(n) {
  return (n >>> 0).toString(2).padStart(32, "0");
}

function generateSteps(nIn) {
  const steps = [];
  let n = nIn >>> 0;
  let count = 0;
  steps.push({ activeLine: 2, n, count, lsb: null, shift: false, message: `Init: n = ${toBin32(n)}, count = 0` });
  while (n !== 0) {
    const lsb = n & 1;
    steps.push({ activeLine: 4, n, count, lsb, shift: false, message: `LSB = ${n} & 1 = ${lsb} → count + ${lsb} = ${count + lsb}` });
    count += lsb;
    steps.push({ activeLine: 5, n, count, lsb, shift: true, message: `Shift right: n = ${toBin32(n)} >> 1 = ${toBin32(n >>> 1)}` });
    n = n >>> 1;
    steps.push({ activeLine: 3, n, count, lsb: null, shift: false, message: `n = ${toBin32(n)}, count = ${count}` });
  }
  steps.push({ activeLine: 6, n, count, lsb: null, shift: false, done: true, message: `Result: ${count} set bit(s)` });
  return steps;
}

export default function NumberOf1BitsVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.n), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

  const displayN = step?.n ?? (ex.n >>> 0);
  const count = step?.count ?? 0;
  const lsb = step?.lsb;
  const bin = toBin32(displayN);

  return (
    <div className="nb-shell">
      <div className="nb-examples">
        {EXAMPLES.map(e => (
          <button key={e.label} className={`nb-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
            {e.label}: {e.desc}
          </button>
        ))}
      </div>

      <div className="nb-panel">
        <div className="nb-panel-label">32-bit Binary Representation</div>
        <div className="nb-bits">
          {bin.split("").map((bit, idx) => {
            const isLSB = idx === 31;
            const isOne = bit === "1";
            return (
              <motion.div
                key={idx}
                className={`nb-bit ${isOne ? "one" : "zero"} ${isLSB && lsb !== null ? "lsb" : ""}`}
                animate={{ scale: isLSB && lsb !== null ? 1.2 : 1, y: isLSB && lsb !== null ? -4 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                {bit}
              </motion.div>
            );
          })}
        </div>
        <div className="nb-bit-labels">
          <span>31</span>
          <span>0</span>
        </div>
      </div>

      <div className="nb-trackers">
        <div className="nb-tracker">
          <span className="nb-tracker-label">count</span>
          <motion.span key={count} className="nb-tracker-val" initial={{ scale: 1.4, color: "#a6e3a1" }} animate={{ scale: 1, color: "#cdd6f4" }} transition={{ duration: 0.3 }}>
            {count}
          </motion.span>
        </div>
        <div className="nb-tracker">
          <span className="nb-tracker-label">LSB (n &amp; 1)</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={lsb === null ? "none" : lsb}
              className={`nb-tracker-val ${lsb === 1 ? "lsb-one" : ""}`}
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              {lsb === null ? "—" : lsb}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {step?.done && (
        <div className="nb-result">✓ Hamming weight = {count}</div>
      )}

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      <div className="nb-status">{step?.message ?? "Press Play to begin."}</div>
      <PlaybackControls
        isPlaying={isPlaying} isDone={isDone} speed={speed}
        onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
        prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
        onSpeedChange={e => setSpeed(Number(e.target.value))}
      />
    </div>
  );
}
