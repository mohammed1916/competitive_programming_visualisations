import { useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./MultiplyStrings.css";

const SOLUTION_CODE = [
  { line: 1, text: "def multiply(num1: str, num2: str) -> str:" },
  { line: 2, text: "    if num1 == '0' or num2 == '0': return '0'" },
  { line: 3, text: "    m, n = len(num1), len(num2)" },
  { line: 4, text: "    result = [0] * (m + n)" },
  { line: 5, text: "    for i in range(m - 1, -1, -1):" },
  { line: 6, text: "        for j in range(n - 1, -1, -1):" },
  { line: 7, text: "            mul = int(num1[i]) * int(num2[j])" },
  { line: 8, text: "            p1, p2 = i + j, i + j + 1" },
  { line: 9, text: "            total = mul + result[p2]" },
  { line: 10, text: "            result[p2] = total % 10" },
  { line: 11, text: "            result[p1] += total // 10" },
  { line: 12, text: "    result_str = ''.join(map(str, result))" },
  { line: 13, text: "    return result_str.lstrip('0') or '0'" },
];

function generateSteps(num1, num2) {
  const steps = [];

  if (!num1 || !num2) {
    steps.push({
      phase: "error",
      activeLine: 2,
      message: "Invalid input",
    });
    return steps;
  }

  if (num1 === "0" || num2 === "0") {
    steps.push({
      phase: "init",
      activeLine: 2,
      message: "One of the numbers is 0, return '0'",
      result: [0],
    });
    return steps;
  }

  const m = num1.length;
  const n = num2.length;
  const result = new Array(m + n).fill(0);

  steps.push({
    phase: "init",
    activeLine: 3,
    message: `Initialize lengths: m=${m}, n=${n}`,
    result: [...result],
    currentI: null,
    currentJ: null,
    carry: 0,
  });

  steps.push({
    phase: "create_result_array",
    activeLine: 4,
    message: `Create result array of size ${m + n}`,
    result: [...result],
    currentI: null,
    currentJ: null,
    carry: 0,
  });

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      const digit1 = parseInt(num1[i]);
      const digit2 = parseInt(num2[j]);
      const mul = digit1 * digit2;

      steps.push({
        phase: "multiply",
        activeLine: 7,
        message: `Multiply num1[${i}]=${digit1} × num2[${j}]=${digit2} = ${mul}`,
        result: [...result],
        currentI: i,
        currentJ: j,
        mul,
        p1: i + j,
        p2: i + j + 1,
        carry: 0,
      });

      const p1 = i + j;
      const p2 = i + j + 1;
      const total = mul + result[p2];

      steps.push({
        phase: "add_to_result",
        activeLine: 9,
        message: `total = ${mul} + result[${p2}] = ${total}`,
        result: [...result],
        currentI: i,
        currentJ: j,
        p1,
        p2,
        total,
        carry: Math.floor(total / 10),
      });

      result[p2] = total % 10;
      result[p1] += Math.floor(total / 10);

      steps.push({
        phase: "update_cells",
        activeLine: 10,
        message: `result[${p2}] = ${result[p2]}, result[${p1}] += ${Math.floor(total / 10)} (carry)`,
        result: [...result],
        currentI: i,
        currentJ: j,
        p1,
        p2,
        carry: Math.floor(total / 10),
      });
    }
  }

  steps.push({
    phase: "trim_zeros",
    activeLine: 12,
    message: `Convert result array to string and trim leading zeros`,
    result: [...result],
    currentI: null,
    currentJ: null,
  });

  const resultStr = result.join("").replace(/^0+/, "") || "0";

  steps.push({
    phase: "done",
    activeLine: 13,
    message: `Result: ${resultStr}`,
    result: [...result],
    resultStr,
    currentI: null,
    currentJ: null,
  });

  return steps;
}

const EXAMPLES = [
  { label: "2 × 3", num1: "2", num2: "3" },
  { label: "123 × 456", num1: "123", num2: "456" },
  { label: "9 × 9", num1: "9", num2: "9" },
  { label: "0 × 5", num1: "0", num2: "5" },
];

export default function MultiplyStringsVisualizer() {
  const [num1Input, setNum1Input] = useState("123");
  const [num2Input, setNum2Input] = useState("456");
  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

  const { num1, num2, inputError } = useMemo(() => {
    try {
      const n1 = num1Input.trim();
      const n2 = num2Input.trim();
      if (!n1 || !n2) throw new Error("Both inputs required");
      if (!/^\d+$/.test(n1) || !/^\d+$/.test(n2))
        throw new Error("Must be non-negative integers");
      return { num1: n1, num2: n2, inputError: "" };
    } catch (e) {
      return { num1: null, num2: null, inputError: e.message };
    }
  }, [num1Input, num2Input]);

  const steps = useMemo(
    () => (num1 && num2 ? generateSteps(num1, num2) : []),
    [num1, num2]
  );

  const { currentStep, isPlaying, setCurrentStep, setIsPlaying } =
    usePlaybackState(steps);

  const currentStepData = steps[currentStep] || {};

  const handleLoadExample = useCallback(
    (num1, num2) => {
      setNum1Input(num1);
      setNum2Input(num2);
      setCurrentStep(0);
      setIsPlaying(false);
    },
    [setCurrentStep, setIsPlaying]
  );

  return (
    <div className="ms-shell">
      <div className="ms-container">
        <div className="ms-input-section">
          <div className="ms-panel">
            <div className="ms-panel-head">Input</div>
            <div className="ms-panel-body">
              <div className="ms-field">
                <span>num1 (multiplicand)</span>
                <input
                  className="ms-input"
                  value={num1Input}
                  onChange={(e) => setNum1Input(e.target.value)}
                  placeholder="e.g., 123"
                />
              </div>
              <div className="ms-field">
                <span>num2 (multiplier)</span>
                <input
                  className="ms-input"
                  value={num2Input}
                  onChange={(e) => setNum2Input(e.target.value)}
                  placeholder="e.g., 456"
                />
              </div>
              {inputError && <div className="ms-error">{inputError}</div>}
              <div className="ms-examples">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.label}
                    className="ms-example-btn"
                    onClick={() => handleLoadExample(ex.num1, ex.num2)}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="ms-visualization-section">
          <div className="ms-panel">
            <div className="ms-panel-head">Multiplication Grid</div>
            <div className="ms-panel-body">
              <div className="ms-grid-container">
                <div className="ms-numbers-row">
                  <div className="ms-label">num1:</div>
                  <div className="ms-number-display">
                    {(num1 || "?").split("").map((d, i) => (
                      <div
                        key={`n1-${i}`}
                        className={`ms-digit ${
                          currentStepData.currentI === num1.length - 1 - i
                            ? "active"
                            : ""
                        }`}
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="ms-numbers-row">
                  <div className="ms-label">num2:</div>
                  <div className="ms-number-display">
                    {(num2 || "?").split("").map((d, i) => (
                      <div
                        key={`n2-${i}`}
                        className={`ms-digit ${
                          currentStepData.currentJ === num2.length - 1 - i
                            ? "active"
                            : ""
                        }`}
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ms-result-grid">
                  <div className="ms-grid-label">Result Array:</div>
                  <div className="ms-result-cells">
                    {(currentStepData.result || new Array(8).fill(0)).map(
                      (val, i) => (
                        <motion.div
                          key={`cell-${i}`}
                          className={`ms-result-cell ${
                            currentStepData.p1 === i || currentStepData.p2 === i
                              ? "highlight"
                              : ""
                          }`}
                          animate={{
                            scale:
                              currentStepData.p1 === i ||
                              currentStepData.p2 === i
                                ? 1.1
                                : 1,
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="ms-cell-value">{val}</div>
                          <div className="ms-cell-index">i={i}</div>
                        </motion.div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ms-info-section">
        <div className="ms-panel">
          <div className="ms-panel-head">Algorithm Trace</div>
          <div className="ms-panel-body">
            <div className="ms-trace-message">
              {currentStepData.message || "Ready to multiply"}
            </div>
            {currentStepData.mul !== undefined && (
              <div className="ms-trace-detail">
                <span>Multiplication:</span> {currentStepData.mul}
              </div>
            )}
            {currentStepData.total !== undefined && (
              <div className="ms-trace-detail">
                <span>Total:</span> {currentStepData.total}
              </div>
            )}
            {currentStepData.carry !== undefined &&
              currentStepData.carry > 0 && (
                <div className="ms-trace-detail">
                  <span>Carry:</span> {currentStepData.carry}
                </div>
              )}
            {currentStepData.resultStr && (
              <div className="ms-trace-result">
                <span>Final Result:</span> {currentStepData.resultStr}
              </div>
            )}
          </div>
        </div>
      </div>

      <PlaybackControls
        currentStep={currentStep}
        totalSteps={steps.length}
        isPlaying={isPlaying}
        onStepChange={setCurrentStep}
        onPlayPause={setIsPlaying}
        speed={1}
        showPatternOverlay={showPatternOverlay}
        onShowPatternOverlayChange={setShowPatternOverlay}
        patternOverlayLabel="Show pattern overlay"
        showPatternOverlayToggle
      />
      {showPatternOverlay && currentStepData && <PatternOverlay step={currentStepData} activeLineDom={activeLineDom} />}
    </div>
  );
}
