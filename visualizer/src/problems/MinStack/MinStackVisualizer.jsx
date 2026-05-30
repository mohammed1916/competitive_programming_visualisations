import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./MinStackVisualizer.css";
import StackPanel from "../../components/StackPanel";

const SOLUTION_CODE = [
  { line: 1, text: "class MinStack:" },
  { line: 2, text: "    def __init__(self):" },
  { line: 3, text: "        self.stack = []" },
  { line: 4, text: "        self.min_stack = []" },
  { line: 5, text: "" },
  { line: 6, text: "    def push(self, val: int) -> None:" },
  { line: 7, text: "        self.stack.append(val)" },
  {
    line: 8,
    text: "        min_val = min(val, self.min_stack[-1] if self.min_stack else val)",
  },
  { line: 9, text: "        self.min_stack.append(min_val)" },
  { line: 10, text: "" },
  { line: 11, text: "    def pop(self) -> None:" },
  { line: 12, text: "        self.stack.pop()" },
  { line: 13, text: "        self.min_stack.pop()" },
  { line: 14, text: "" },
  { line: 15, text: "    def top(self) -> int:" },
  { line: 16, text: "        return self.stack[-1]" },
  { line: 17, text: "" },
  { line: 18, text: "    def getMin(self) -> int:" },
  { line: 19, text: "        return self.min_stack[-1]" },
];

function generateSteps(operations) {
  const steps = [];
  let stack = [];
  let minStack = [];

  steps.push({
    phase: "init",
    activeLine: 3,
    stack: [],
    minStack: [],
    op: null,
    opArg: null,
    result: null,
    message: "Initialize: stack = [], min_stack = [].",
  });

  for (const op of operations) {
    if (op.type === "push") {
      const val = op.val;
      steps.push({
        phase: "push_start",
        activeLine: 7,
        stack: [...stack],
        minStack: [...minStack],
        op: "push",
        opArg: val,
        result: null,
        message: `push(${val}): append ${val} to stack.`,
      });
      stack.push(val);

      const minVal =
        minStack.length === 0
          ? val
          : Math.min(val, minStack[minStack.length - 1]);
      steps.push({
        phase: "push_min",
        activeLine: 8,
        stack: [...stack],
        minStack: [...minStack],
        op: "push",
        opArg: val,
        result: null,
        minVal,
        message: `push(${val}): min_val = min(${val}, ${minStack.length ? minStack[minStack.length - 1] : val}) = ${minVal}.`,
      });
      minStack.push(minVal);
      steps.push({
        phase: "push_done",
        activeLine: 9,
        stack: [...stack],
        minStack: [...minStack],
        op: "push",
        opArg: val,
        result: null,
        minVal,
        message: `push(${val}): append ${minVal} to min_stack. Stack: [${stack}], Min: [${minStack}].`,
      });
    } else if (op.type === "pop") {
      if (stack.length === 0) continue;
      steps.push({
        phase: "pop_start",
        activeLine: 12,
        stack: [...stack],
        minStack: [...minStack],
        op: "pop",
        opArg: null,
        result: null,
        message: `pop(): remove top (${stack[stack.length - 1]}) from stack.`,
      });
      stack.pop();
      minStack.pop();
      steps.push({
        phase: "pop_done",
        activeLine: 13,
        stack: [...stack],
        minStack: [...minStack],
        op: "pop",
        opArg: null,
        result: null,
        message: `pop(): also remove top from min_stack. Stack: [${stack}], Min: [${minStack}].`,
      });
    } else if (op.type === "top") {
      const result = stack.length ? stack[stack.length - 1] : null;
      steps.push({
        phase: "top",
        activeLine: 16,
        stack: [...stack],
        minStack: [...minStack],
        op: "top",
        opArg: null,
        result,
        message:
          result !== null ? `top() → ${result}.` : "top(): stack is empty.",
      });
    } else if (op.type === "getMin") {
      const result = minStack.length ? minStack[minStack.length - 1] : null;
      steps.push({
        phase: "getMin",
        activeLine: 19,
        stack: [...stack],
        minStack: [...minStack],
        op: "getMin",
        opArg: null,
        result,
        message:
          result !== null
            ? `getMin() → ${result}.`
            : "getMin(): stack is empty.",
      });
    }
  }

  return steps;
}

const EXAMPLES = [
  {
    label: "LC Example",
    ops: [
      { type: "push", val: -2 },
      { type: "push", val: 0 },
      { type: "push", val: -3 },
      { type: "getMin" },
      { type: "pop" },
      { type: "top" },
      { type: "getMin" },
    ],
  },
  {
    label: "Simple",
    ops: [
      { type: "push", val: 5 },
      { type: "push", val: 3 },
      { type: "push", val: 7 },
      { type: "getMin" },
      { type: "pop" },
      { type: "getMin" },
    ],
  },
  {
    label: "Decreasing",
    ops: [
      { type: "push", val: 10 },
      { type: "push", val: 6 },
      { type: "push", val: 3 },
      { type: "push", val: 1 },
      { type: "getMin" },
      { type: "pop" },
      { type: "getMin" },
    ],
  },
];

export default function MinStackVisualizer() {
  const [selectedExample, setSelectedExample] = useState(0);
  const [ops, setOps] = useState(EXAMPLES[0].ops);
  const [pushVal, setPushVal] = useState("");

  const steps = useMemo(() => generateSteps(ops), [ops]);

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

  const step = stepIndex >= 0 ? steps[stepIndex] : null;

  const applyExample = useCallback(
    (idx) => {
      setSelectedExample(idx);
      setOps(EXAMPLES[idx].ops);
      handleReset();
    },
    [handleReset],
  );

  const addOp = (type) => {
    if (type === "push") {
      const val = parseInt(pushVal, 10);
      if (isNaN(val)) return;
      setOps((prev) => [...prev, { type: "push", val }]);
      setPushVal("");
    } else {
      setOps((prev) => [...prev, { type }]);
    }
    handleReset();
  };

  const resetOps = () => {
    setOps([]);
    handleReset();
  };

  const stack = step?.stack ?? [];
  const minStack = step?.minStack ?? [];
  const result = step?.result;
  const currOp = step?.op;
  const phase = step?.phase;

  return (
    <div className="ms-shell">
      <div className="ms-top">
        {/* ── Main panel ── */}
        <section className="ms-panel main">
          <header className="ms-head">
            <span>Min Stack · Design</span>
          </header>
          <div className="ms-body">
            <div className="ms-examples">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={ex.label}
                  className={`ms-chip${selectedExample === i ? " active" : ""}`}
                  onClick={() => applyExample(i)}
                >
                  {ex.label}
                </button>
              ))}
            </div>

            {/* Custom ops builder */}
            <div className="ms-builder">
              <div className="ms-push-row">
                <input
                  className="ms-input"
                  value={pushVal}
                  onChange={(e) => setPushVal(e.target.value)}
                  placeholder="val"
                  onKeyDown={(e) => e.key === "Enter" && addOp("push")}
                  type="number"
                />
                <button
                  className="ms-op-btn push"
                  onClick={() => addOp("push")}
                >
                  push(val)
                </button>
                <button className="ms-op-btn pop" onClick={() => addOp("pop")}>
                  pop()
                </button>
                <button className="ms-op-btn top" onClick={() => addOp("top")}>
                  top()
                </button>
                <button
                  className="ms-op-btn min"
                  onClick={() => addOp("getMin")}
                >
                  getMin()
                </button>
                <button className="ms-op-btn reset" onClick={resetOps}>
                  Clear
                </button>
              </div>

              {/* Operation sequence */}
              <div className="ms-op-list">
                {ops.map((op, idx) => (
                  <span
                    key={idx}
                    className={`ms-op-tag ${op.type}${step && steps[stepIndex]?.op === op.type ? "" : ""}`}
                  >
                    {op.type === "push" ? `push(${op.val})` : `${op.type}()`}
                  </span>
                ))}
              </div>
            </div>

            {/* Stack visualizations */}
            <div className="ms-stacks">
              <StackPanel
                label="stack"
                items={stack}
                topBadge="top"
                highlightIndex={stack.length - 1}
              />
              <StackPanel
                label="min_stack"
                items={minStack}
                topBadge="min"
                highlightIndex={minStack.length - 1}
              />

              {/* Result box */}
              {result !== null && result !== undefined && (
                <div className="ms-result-col">
                  <div className="ms-stack-label">return</div>
                  <motion.div
                    className={`ms-result-box${phase === "getMin" ? " min-result" : " top-result"}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    {result}
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />

      <div className="ms-status">
        {step?.message ?? "Press Play or Step to begin."}
      </div>

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
      />
    </div>
  );
}
