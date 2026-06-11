import { useState, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./PalindromeNumberVisualizer.css";

const SOLUTION_CODE = [
  { line: 1, text: "class Solution:" },
  { line: 2, text: "    def isPalindrome(self, x: int) -> bool:" },
  { line: 3, text: "        if x < 0 or (x % 10 == 0 and x != 0):" },
  { line: 4, text: "            return False" },
  { line: 5, text: "" },
  { line: 6, text: "        rev = 0" },
  { line: 7, text: "        while x > rev:" },
  { line: 8, text: "            rev = rev * 10 + x % 10" },
  { line: 9, text: "            x //= 10" },
  { line: 10, text: "" },
  { line: 11, text: "        return x == rev or x == rev // 10" },
];

const EXAMPLES = [
  { label: "121", value: "121" },
  { label: "-121", value: "-121" },
  { label: "10", value: "10" },
  { label: "0", value: "0" },
  { label: "1221", value: "1221" },
  { label: "12321", value: "12321" },
  { label: "1234321", value: "1234321" },
];

const EDGE_CASES = [
  {
    key: "negative",
    label: "Negative numbers",
    note: "Immediately false, because the minus sign cannot mirror itself.",
  },
  {
    key: "trailing-zero",
    label: "Trailing zero",
    note: "False unless the value is exactly 0. Example: 10 is not a palindrome.",
  },
  { key: "zero", label: "Zero", note: "0 is a palindrome by itself." },
  {
    key: "single",
    label: "Single digit",
    note: "Any single digit is a palindrome.",
  },
  {
    key: "odd",
    label: "Odd length",
    note: "Compare x with rev // 10 to ignore the middle digit.",
  },
  { key: "even", label: "Even length", note: "Compare x directly with rev." },
];

function digitsFrom(value) {
  return String(Math.abs(value)).split("");
}

function stepDigits(value) {
  return digitsFrom(value).map((digit, index) => ({ digit, index }));
}

function generateSteps(num) {
  const steps = [];

  if (!Number.isSafeInteger(num)) {
    steps.push({
      phase: "invalid",
      activeLine: 3,
      x: null,
      rev: 0,
      orig: null,
      result: null,
      message: "Enter a valid whole number in the safe integer range.",
    });
    return steps;
  }

  const orig = num;
  const initialDigits = stepDigits(orig);
  const isNegative = orig < 0;
  const hasTrailingZero = orig !== 0 && orig % 10 === 0;

  steps.push({
    phase: "init",
    activeLine: 3,
    x: orig,
    rev: 0,
    orig,
    iteration: 0,
    digit: null,
    nextX: null,
    nextRev: null,
    xDigits: initialDigits,
    revDigits: ["0"],
    result: null,
    message:
      orig < 0
        ? "Input is negative. Stop before extracting digits."
        : "Start with rev = 0 and process digits from the right.",
  });

  if (isNegative) {
    steps.push({
      phase: "negative",
      activeLine: 4,
      x: orig,
      rev: 0,
      orig,
      iteration: 0,
      digit: null,
      nextX: null,
      nextRev: null,
      xDigits: initialDigits,
      revDigits: ["0"],
      edgeCase: "negative",
      result: false,
      message: "Negative numbers cannot be palindromes.",
    });
    steps.push({
      phase: "done",
      activeLine: 4,
      x: orig,
      rev: 0,
      orig,
      iteration: 0,
      digit: null,
      nextX: null,
      nextRev: null,
      xDigits: initialDigits,
      revDigits: ["0"],
      edgeCase: "negative",
      result: false,
      message: "Return false immediately for a negative number.",
    });
    return steps;
  }

  if (hasTrailingZero) {
    steps.push({
      phase: "trailing-zero",
      activeLine: 3,
      x: orig,
      rev: 0,
      orig,
      iteration: 0,
      digit: null,
      nextX: null,
      nextRev: null,
      xDigits: initialDigits,
      revDigits: ["0"],
      edgeCase: "trailing-zero",
      result: false,
      message:
        "Trailing zero detected. A non-zero number ending in 0 cannot be a palindrome.",
    });
    steps.push({
      phase: "done",
      activeLine: 4,
      x: orig,
      rev: 0,
      orig,
      iteration: 0,
      digit: null,
      nextX: null,
      nextRev: null,
      xDigits: initialDigits,
      revDigits: ["0"],
      edgeCase: "trailing-zero",
      result: false,
      message:
        "Return false because the last digit is 0 and the number is not 0.",
    });
    return steps;
  }

  let x = orig;
  let rev = 0;
  let iteration = 0;

  steps.push({
    phase: "state",
    activeLine: 6,
    x,
    rev,
    orig,
    iteration,
    digit: null,
    nextX: null,
    nextRev: null,
    xDigits: stepDigits(x),
    revDigits: stepDigits(rev),
    result: null,
    message:
      "Initialize rev = 0. Now the loop starts with the rightmost digit of x.",
  });

  if (x === 0) {
    steps.push({
      phase: "compare",
      activeLine: 11,
      x,
      rev,
      orig,
      iteration,
      digit: null,
      nextX: null,
      nextRev: null,
      xDigits: stepDigits(x),
      revDigits: stepDigits(rev),
      result: true,
      compareMode: "zero",
      message: "x is 0, so x equals rev. 0 is a palindrome.",
    });
    steps.push({
      phase: "done",
      activeLine: 11,
      x,
      rev,
      orig,
      iteration,
      digit: null,
      nextX: null,
      nextRev: null,
      xDigits: stepDigits(x),
      revDigits: stepDigits(rev),
      result: true,
      compareMode: "zero",
      message: "Return true.",
    });
    return steps;
  }

  while (x > rev) {
    const currentX = x;
    const currentRev = rev;
    const digit = currentX % 10;
    const nextRev = currentRev * 10 + digit;
    const nextX = Math.floor(currentX / 10);

    steps.push({
      phase: "check",
      activeLine: 7,
      x: currentX,
      rev: currentRev,
      orig,
      iteration,
      digit,
      nextX,
      nextRev,
      xDigits: stepDigits(currentX),
      revDigits: stepDigits(currentRev),
      result: null,
      message: `Iteration ${iteration + 1}: check while x > rev (${currentX} > ${currentRev}).`,
    });

    steps.push({
      phase: "extract",
      activeLine: 8,
      x: currentX,
      rev: currentRev,
      orig,
      iteration,
      digit,
      nextX,
      nextRev,
      xDigits: stepDigits(currentX),
      revDigits: stepDigits(currentRev),
      result: null,
      message: `Extract the rightmost digit: digit = x % 10 = ${currentX} % 10 = ${digit}.`,
    });

    steps.push({
      phase: "build",
      activeLine: 8,
      x: currentX,
      rev: currentRev,
      orig,
      iteration,
      digit,
      nextX,
      nextRev,
      xDigits: stepDigits(currentX),
      revDigits: stepDigits(currentRev),
      previewRevDigits: stepDigits(nextRev),
      result: null,
      message: `Move digit into rev: rev = ${currentRev} * 10 + ${digit} = ${nextRev}.`,
    });

    x = nextX;
    rev = nextRev;
    iteration += 1;

    steps.push({
      phase: "advance",
      activeLine: 9,
      x,
      rev,
      orig,
      iteration,
      digit,
      nextX: null,
      nextRev: null,
      xDigits: stepDigits(x),
      revDigits: stepDigits(rev),
      result: null,
      message: `Drop the extracted digit from x: x = ${x}. Now rev = ${rev}.`,
    });
  }

  const evenMatch = x === rev;
  const oddMatch = x === Math.floor(rev / 10);
  const isPalindrome = evenMatch || oddMatch;

  steps.push({
    phase: "compare",
    activeLine: 11,
    x,
    rev,
    orig,
    iteration,
    digit: null,
    nextX: null,
    nextRev: null,
    xDigits: stepDigits(x),
    revDigits: stepDigits(rev),
    compareMode: evenMatch ? "even" : "odd",
    evenMatch,
    oddMatch,
    result: isPalindrome,
    message: evenMatch
      ? `Even-length compare: x == rev (${x} == ${rev}).`
      : `Odd-length compare: x == rev // 10 (${x} == ${Math.floor(rev / 10)}).`,
  });

  steps.push({
    phase: "done",
    activeLine: 11,
    x,
    rev,
    orig,
    iteration,
    digit: null,
    nextX: null,
    nextRev: null,
    xDigits: stepDigits(x),
    revDigits: stepDigits(rev),
    compareMode: evenMatch ? "even" : "odd",
    evenMatch,
    oddMatch,
    result: isPalindrome,
    message: isPalindrome ? "Return true." : "Return false.",
  });

  return steps;
}

function DigitTape({
  label,
  value,
  digits,
  pointerLabel,
  pointerIndex,
  tone = "neutral",
  note,
}) {
  const isEmpty = !digits || digits.length === 0;
  const sign = value < 0 ? "-" : "";

  return (
    <div className="pn-tape-card pn-panel-surface">
      <div className="pn-tape-head">
        <span>{label}</span>
        <span className={`pn-tape-value ${tone}`}>{note || String(value)}</span>
      </div>

      <div className="pn-tape-meta">
        <span className="pn-meta-key">value</span>
        <span className="pn-meta-val">{String(value)}</span>
      </div>

      <div className={`pn-tape ${isEmpty ? "empty" : ""}`}>
        {sign && <div className="pn-sign">-</div>}
        {isEmpty ? (
          <div className="pn-empty">∅</div>
        ) : (
          digits.map((entry, index) => {
            const active = pointerIndex === index;
            return (
              <motion.div
                key={`${label}-${index}-${entry.digit}`}
                layout
                className={`pn-digit-cell ${active ? "active" : ""}`}
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              >
                {active && pointerLabel && (
                  <div className="pn-pointer">{pointerLabel}</div>
                )}
                <span className="pn-digit-val">{entry.digit}</span>
                <span className="pn-digit-index">{entry.index}</span>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StateCard({ label, value, accent }) {
  return (
    <div className="pn-state-card">
      <div className="pn-state-label">{label}</div>
      <div className={`pn-state-value ${accent || ""}`}>{value}</div>
    </div>
  );
}

export default function PalindromeNumberVisualizer() {
  const [input, setInput] = useState("121");

  const { num, inputError } = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      return { num: NaN, inputError: "Enter an integer." };
    }
    if (!/^[+-]?\d+$/.test(trimmed)) {
      return { num: NaN, inputError: "Only whole numbers are allowed." };
    }
    const parsed = Number(trimmed);
    if (!Number.isSafeInteger(parsed)) {
      return {
        num: NaN,
        inputError: "Use a smaller integer within the safe range.",
      };
    }
    return { num: parsed, inputError: "" };
  }, [input]);

  const steps = useMemo(() => generateSteps(num), [num]);

  const {
    stepIndex,
    stepForward,
    stepBack,
    togglePlay,
    handleReset,
    isPlaying,
    speed,
    setSpeed,
    isDone,
  } = usePlaybackState(steps.length);

  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

  const step = stepIndex >= 0 ? steps[stepIndex] : null;

  const currentEdgeCase = useMemo(() => {
    if (!step) return "single";
    if (step.edgeCase) return step.edgeCase;
    if (step.phase === "compare" || step.phase === "done") {
      if (step.compareMode === "odd") return "odd";
      if (step.compareMode === "even") return "even";
      if (step.compareMode === "zero") return "zero";
    }
    if (step.x !== null && Math.abs(step.x) < 10) return "single";
    return null;
  }, [step]);

  const applyExample = useCallback(
    (value) => {
      setInput(value);
      handleReset();
    },
    [handleReset],
  );

  const activeIteration =
    step?.phase === "advance"
      ? step.iteration
      : Math.max((step?.iteration ?? 0) - 1, 0);

  const history = useMemo(() => {
    const seen = [];
    for (let i = 0; i <= stepIndex; i += 1) {
      const s = steps[i];
      if (s?.phase === "advance") {
        seen.push(s);
      }
    }
    return seen;
  }, [steps, stepIndex]);

  return (
    <div className="pn-shell">
      <div className="pn-top">
        <div className="pn-panel pn-input-panel">
          <div className="pn-panel-head">
            <span>Input & Examples</span>
            {inputError && <span className="pn-error-pill">{inputError}</span>}
          </div>

          <div className="pn-panel-body">
            <div className="pn-example-row">
              {EXAMPLES.map((example) => (
                <button
                  key={example.label}
                  className="pn-example-btn"
                  onClick={() => applyExample(example.value)}
                >
                  {example.label}
                </button>
              ))}
            </div>

            <div className="pn-input-row">
              <span className="pn-input-prefix">x =</span>
              <input
                className="pn-input"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  handleReset();
                }}
                placeholder="121"
                inputMode="numeric"
              />
            </div>

            <div className="pn-state-grid">
              <StateCard
                label="Original"
                value={step?.orig ?? "—"}
                accent="primary"
              />
              <StateCard
                label="Current rev"
                value={step?.rev ?? 0}
                accent="success"
              />
              <StateCard
                label="Current x"
                value={step?.x ?? "—"}
                accent="cyan"
              />
              <StateCard
                label="Iteration"
                value={
                  step?.phase === "advance" ||
                  step?.phase === "compare" ||
                  step?.phase === "done"
                    ? activeIteration
                    : 0
                }
                accent="amber"
              />
            </div>

            <div className="pn-note-box">
              <div className="pn-note-title">What the algorithm does</div>
              <div className="pn-note-text">
                It peels the last digit from <code>x</code>, appends it to{" "}
                <code>rev</code>, and stops when the left side is no longer
                longer than the reversed side.
              </div>
            </div>
          </div>
        </div>

        <div className="pn-panel pn-flow-panel">
          <div className="pn-panel-head">
            <span>Digit Flow</span>
            <span
              className={`pn-badge ${step?.result === false ? "danger" : step?.result === true ? "success" : "neutral"}`}
            >
              {step?.phase === "negative"
                ? "Negative -> false"
                : step?.phase === "trailing-zero"
                  ? "Trailing zero -> false"
                  : step?.phase === "compare"
                    ? step.result
                      ? "Palindrome"
                      : "Not palindrome"
                    : "Building reverse"}
            </span>
          </div>

          <div className="pn-panel-body pn-flow-body">
            <div className="pn-flow-explainer">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step?.message || "idle"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                  className="pn-message"
                >
                  {step?.message || "Press Play or Step to begin."}
                </motion.div>
              </AnimatePresence>

              <div className="pn-formula-box">
                <div className="pn-formula-row">
                  <span className="pn-formula-key">digit</span>
                  <span className="pn-formula-val">= x % 10</span>
                  <span className="pn-formula-eq">→</span>
                  <span className="pn-formula-val">{step?.digit ?? "—"}</span>
                </div>
                <div className="pn-formula-row">
                  <span className="pn-formula-key">rev</span>
                  <span className="pn-formula-val">= rev * 10 + digit</span>
                  <span className="pn-formula-eq">→</span>
                  <span className="pn-formula-val">
                    {step?.nextRev ?? step?.rev ?? 0}
                  </span>
                </div>
                <div className="pn-formula-row">
                  <span className="pn-formula-key">x</span>
                  <span className="pn-formula-val">= floor(x / 10)</span>
                  <span className="pn-formula-eq">→</span>
                  <span className="pn-formula-val">
                    {step?.nextX ?? step?.x ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="pn-flow-visual">
              <DigitTape
                label="x tape"
                value={step?.x ?? num ?? 0}
                digits={step?.xDigits || stepDigits(num || 0)}
                pointerLabel="x"
                pointerIndex={step?.xDigits ? step.xDigits.length - 1 : 0}
                tone="cyan"
                note={
                  step?.phase === "negative"
                    ? "stop"
                    : step?.phase === "trailing-zero"
                      ? "early exit"
                      : undefined
                }
              />

              <div className="pn-connector">
                <div className="pn-connector-line" />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${step?.phase || "idle"}-${step?.digit ?? "none"}`}
                    className="pn-digit-bubble"
                    initial={{ scale: 0.7, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.7, opacity: 0, y: -10 }}
                    transition={{ duration: 0.18 }}
                  >
                    {step?.digit ?? "•"}
                  </motion.div>
                </AnimatePresence>
                <div className="pn-connector-label">
                  extract rightmost digit
                </div>
              </div>

              <DigitTape
                label="rev tape"
                value={
                  step?.phase === "build"
                    ? (step?.nextRev ?? step?.rev ?? 0)
                    : (step?.rev ?? 0)
                }
                digits={
                  step?.phase === "build" && step?.previewRevDigits
                    ? step.previewRevDigits
                    : step?.revDigits || stepDigits(0)
                }
                pointerLabel="rev"
                pointerIndex={
                  step?.phase === "build" && step?.previewRevDigits
                    ? step.previewRevDigits.length - 1
                    : step?.revDigits
                      ? step.revDigits.length - 1
                      : 0
                }
                tone="green"
                note={
                  step?.phase === "compare"
                    ? "final compare"
                    : step?.phase === "done"
                      ? "answer"
                      : undefined
                }
              />
            </div>
          </div>
        </div>

        <div className="pn-panel pn-result-panel">
          <div className="pn-panel-head">
            <span>Result & Edge Cases</span>
            <span className="pn-badge neutral">LeetCode 9</span>
          </div>

          <div className="pn-panel-body">
            <div className="pn-result-box">
              <div className="pn-result-title">Current verdict</div>
              <div
                className={`pn-result-value ${step?.result === true ? "success" : step?.result === false ? "danger" : "neutral"}`}
              >
                {step?.result == null
                  ? "In progress"
                  : step.result
                    ? "Palindrome"
                    : "Not palindrome"}
              </div>
              <div className="pn-result-subtext">
                {step?.phase === "compare"
                  ? "The loop stopped when the left side was no longer larger than the reversed side."
                  : step?.phase === "negative"
                    ? "Stopped early because the sign is not mirrored."
                    : step?.phase === "trailing-zero"
                      ? "Stopped early because a non-zero number cannot end with 0 and still be a palindrome."
                      : "Watch the rightmost digit move from x into rev."}
              </div>
            </div>

            <div className="pn-edge-list">
              {EDGE_CASES.map((item) => {
                const active = item.key === currentEdgeCase;
                return (
                  <div
                    key={item.key}
                    className={`pn-edge-card ${active ? "active" : ""}`}
                  >
                    <div className="pn-edge-label">{item.label}</div>
                    <div className="pn-edge-note">{item.note}</div>
                  </div>
                );
              })}
            </div>

            <div className="pn-history">
              <div className="pn-history-title">Iteration history</div>
              {history.length === 0 ? (
                <div className="pn-history-empty">No iterations yet.</div>
              ) : (
                history.map((item) => (
                  <div
                    key={`${item.iteration}-${item.nextRev}`}
                    className="pn-history-row"
                  >
                    <span className="pn-history-step">#{item.iteration}</span>
                    <span className="pn-history-text">
                      digit {item.digit} → x = {item.x}, rev = {item.rev}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pn-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
      </div>

      <div
        className={`pn-status ${step?.result === true ? "success" : step?.result === false ? "danger" : ""}`}
      >
        {step?.message || "Press Play or Step to begin."}
      </div>

      <div className="pn-dock">
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
        />
      </div>

      {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
    </div>
  );
}
