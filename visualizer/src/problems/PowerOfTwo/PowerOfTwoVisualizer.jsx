import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./PowerOfTwoVisualizer.css";

const SOLUTION_CODE = [
  { line: 1, text: "def isPowerOfTwo(n: int) -> bool:" },
  { line: 2, text: "    if n <= 0:" },
  { line: 3, text: "        return False" },
  { line: 4, text: "    # n & (n-1) clears the lowest set bit" },
  { line: 5, text: "    # Power of two has exactly one set bit" },
  { line: 6, text: "    return (n & (n - 1)) == 0" },
];

const EXAMPLES = [
  { label: "n=1",   n: 1,   desc: "2⁰ = 1" },
  { label: "n=16",  n: 16,  desc: "2⁴ = 16" },
  { label: "n=3",   n: 3,   desc: "Not power" },
  { label: "n=100", n: 100, desc: "Not power" },
];

function toBin(n, bits = 8) {
  if (n < 0) return "N/A";
  return (n >>> 0).toString(2).padStart(bits, "0");
}

function numBits(n) {
  if (n <= 0) return 8;
  return Math.max(8, Math.ceil(Math.log2(n + 1)) + 1);
}

/**
 * Steps:
 * 1. Show n, check n <= 0
 * 2. Show n-1
 * 3. Show n & (n-1) bit by bit
 * 4. Show result
 */
function generateSteps(input) {
  const n = input;
  const steps = [];
  const bits = numBits(n);

  // Step 1: check n <= 0
  steps.push({
    activeLine: 2,
    phase: "check",
    n,
    nMinus1: null,
    andResult: null,
    andBits: null,
    highlightBit: null,
    result: null,
    message: `Check: is n = ${n} <= 0?`,
  });

  if (n <= 0) {
    steps.push({
      activeLine: 3,
      phase: "early-false",
      n,
      nMinus1: null,
      andResult: null,
      andBits: null,
      highlightBit: null,
      result: false,
      message: `n = ${n} <= 0, return False immediately.`,
    });
    return steps;
  }

  // Step 2: compute n-1, display both
  const nMinus1 = n - 1;
  steps.push({
    activeLine: 6,
    phase: "show-nminus1",
    n,
    nMinus1,
    andResult: null,
    andBits: null,
    highlightBit: null,
    result: null,
    message: `Compute n - 1 = ${n} - 1 = ${nMinus1}. Binary: ${toBin(nMinus1, bits)}`,
  });

  // Step 3: show AND operation bit by bit
  const nBin = toBin(n, bits);
  const nM1Bin = toBin(nMinus1, bits);
  const andVal = (n & nMinus1) >>> 0;
  const andBin = toBin(andVal, bits);

  for (let i = 0; i < bits; i++) {
    const a = parseInt(nBin[i], 10);
    const b = parseInt(nM1Bin[i], 10);
    const r = a & b;
    const currentAndBits = andBin.split("").map((ch, idx) => (idx > i ? null : parseInt(ch, 10)));
    steps.push({
      activeLine: 6,
      phase: "and-bit",
      n,
      nMinus1,
      andResult: null,
      andBits: currentAndBits,
      highlightBit: i,
      result: null,
      message: `Bit ${bits - 1 - i}: ${a} & ${b} = ${r}`,
    });
  }

  // Step 4: final result
  const isPow = andVal === 0;
  steps.push({
    activeLine: 6,
    phase: "result",
    n,
    nMinus1,
    andResult: andVal,
    andBits: andBin.split("").map(Number),
    highlightBit: null,
    result: isPow,
    message: isPow
      ? `n & (n-1) = ${andVal} == 0 → True! ${n} is a power of two.`
      : `n & (n-1) = ${andVal} ≠ 0 → False. ${n} is NOT a power of two.`,
  });

  return steps;
}

function BitRow({ label, value, bits, highlightBit, accentClass }) {
  const bin = value === null ? null : toBin(value, bits);
  return (
    <div className="pt-bit-row">
      <span className="pt-bit-row-label">{label}</span>
      <div className="pt-bits">
        {bin
          ? bin.split("").map((ch, i) => (
              <motion.div
                key={i}
                className={`pt-bit ${ch === "1" ? "one" : "zero"} ${i === highlightBit ? "highlight" : ""} ${accentClass || ""}`}
                animate={
                  i === highlightBit
                    ? { scale: 1.25, y: -4 }
                    : { scale: 1, y: 0 }
                }
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                {ch}
              </motion.div>
            ))
          : Array.from({ length: bits }, (_, i) => (
              <div key={i} className="pt-bit zero empty">?</div>
            ))}
      </div>
      <span className="pt-bit-row-val">
        {value === null ? "?" : value}
      </span>
    </div>
  );
}

function AndRow({ andBits, highlightBit, bits }) {
  return (
    <div className="pt-bit-row pt-and-row">
      <span className="pt-bit-row-label">AND</span>
      <div className="pt-bits">
        {Array.from({ length: bits }, (_, i) => {
          const val = andBits ? andBits[i] : null;
          return (
            <motion.div
              key={i}
              className={`pt-bit ${val === 1 ? "one and-one" : val === 0 ? "zero and-zero" : "zero empty"} ${i === highlightBit ? "highlight" : ""}`}
              animate={
                i === highlightBit
                  ? { scale: 1.25, y: -4 }
                  : { scale: 1, y: 0 }
              }
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              {val === null ? "?" : val}
            </motion.div>
          );
        })}
      </div>
      <span className="pt-bit-row-val">
        {andBits ? andBits.filter(b => b !== null).join("") : ""}
      </span>
    </div>
  );
}

export default function PowerOfTwoVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.n), [ex]);
  const {
    stepIndex, stepForward, stepBack, togglePlay,
    handleReset, isPlaying, speed, setSpeed, isDone,
  } = usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

  const n = step?.n ?? ex.n;
  const nMinus1 = step?.nMinus1 ?? null;
  const andBits = step?.andBits ?? null;
  const highlightBit = step?.highlightBit ?? null;
  const result = step?.result ?? null;
  const phase = step?.phase ?? null;
  const bits = numBits(n);

  const showNMinus1 = phase === "show-nminus1" || phase === "and-bit" || phase === "result";
  const showAnd = phase === "and-bit" || phase === "result";

  return (
    <div className="pt-shell">
      {/* Example selector */}
      <div className="pt-examples">
        {EXAMPLES.map(e => (
          <button
            key={e.label}
            className={`pt-chip ${ex.label === e.label ? "active" : ""}`}
            onClick={() => applyEx(e)}
          >
            {e.label} <span className="pt-chip-desc">{e.desc}</span>
          </button>
        ))}
      </div>

      {/* Insight card */}
      <div className="pt-insight">
        <span className="pt-insight-icon">💡</span>
        <span>
          A power of two has exactly <strong>one set bit</strong>.
          Subtracting 1 flips that bit and all lower bits.
          So <code>n &amp; (n‑1)</code> equals <code>0</code> iff <em>n</em> is a power of two.
        </span>
      </div>

      {/* Binary visualization */}
      <div className="pt-panel">
        <div className="pt-panel-label">Bit-by-bit AND operation</div>

        <BitRow
          label={`n = ${n}`}
          value={n}
          bits={bits}
          highlightBit={highlightBit}
          accentClass="n-row"
        />

        <AnimatePresence>
          {showNMinus1 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <BitRow
                label={`n‑1 = ${nMinus1}`}
                value={nMinus1}
                bits={bits}
                highlightBit={highlightBit}
                accentClass="nm1-row"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAnd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="pt-divider" />
              <AndRow andBits={andBits} highlightBit={highlightBit} bits={bits} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-bit-index-row">
          {Array.from({ length: bits }, (_, i) => (
            <span key={i} className={`pt-bit-idx ${i === highlightBit ? "active" : ""}`}>
              {bits - 1 - i}
            </span>
          ))}
        </div>
      </div>

      {/* Tracker row */}
      <div className="pt-trackers">
        <div className="pt-tracker">
          <span className="pt-tracker-label">n</span>
          <motion.span
            key={n}
            className="pt-tracker-val"
            initial={{ scale: 1.3, color: "#89b4fa" }}
            animate={{ scale: 1, color: "#cdd6f4" }}
            transition={{ duration: 0.3 }}
          >
            {n}
          </motion.span>
        </div>
        <div className="pt-tracker">
          <span className="pt-tracker-label">n &amp; (n‑1)</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={step?.andResult ?? "none"}
              className={`pt-tracker-val ${step?.andResult === 0 && phase === "result" ? "val-green" : step?.andResult > 0 && phase === "result" ? "val-red" : ""}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {step?.andResult !== null && step?.andResult !== undefined && phase === "result"
                ? step.andResult
                : "—"}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="pt-tracker">
          <span className="pt-tracker-label">result</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={result === null ? "none" : String(result)}
              className={`pt-tracker-val ${result === true ? "val-green" : result === false ? "val-red" : ""}`}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
            >
              {result === null ? "—" : result ? "True" : "False"}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Result banner */}
      <AnimatePresence>
        {result !== null && phase === "result" && (
          <motion.div
            className={`pt-result-banner ${result ? "true" : "false"}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {result
              ? `✓ ${n} = 2^${Math.round(Math.log2(n))} — Power of Two!`
              : `✗ ${n} is NOT a power of two`}
          </motion.div>
        )}
        {result === false && phase === "early-false" && (
          <motion.div
            className="pt-result-banner false"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            ✗ n ≤ 0 — immediately False
          </motion.div>
        )}
      </AnimatePresence>

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      <div className="pt-status">{step?.message ?? "Press Play or Step to begin."}</div>
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
        onSpeedChange={e => setSpeed(Number(e.target.value))}
      />
    </div>
  );
}
