import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./MedianOfTwoSortedArraysVisualizer.css";

const SOLUTION_CODE = [
  { line: 1, text: "class Solution:" },
  { line: 2, text: "    def findMedianSortedArrays(self, nums1, nums2):" },
  { line: 3, text: "        if len(nums1) > len(nums2):" },
  { line: 4, text: "            nums1, nums2 = nums2, nums1" },
  { line: 5, text: "" },
  { line: 6, text: "        m, n = len(nums1), len(nums2)" },
  { line: 7, text: "        left = (m + n + 1) // 2" },
  { line: 8, text: "        low, high = 0, m" },
  { line: 9, text: "" },
  { line: 10, text: "        while low <= high:" },
  { line: 11, text: "            cut1 = (low + high) // 2" },
  { line: 12, text: "            cut2 = left - cut1" },
  { line: 13, text: "" },
  { line: 14, text: "            if left1 <= right2 and left2 <= right1:" },
  { line: 15, text: "                if (m + n) % 2 == 0:" },
  {
    line: 16,
    text: "                    return (max(left1, left2) + min(right1, right2)) / 2",
  },
  { line: 17, text: "                return max(left1, left2)" },
  { line: 18, text: "            elif left1 > right2:" },
  { line: 19, text: "                high = cut1 - 1" },
  { line: 20, text: "            else:" },
  { line: 21, text: "                low = cut1 + 1" },
];

const EXAMPLES = [
  { label: "Classic", nums1: [1, 3], nums2: [2] },
  { label: "Even Total", nums1: [1, 2], nums2: [3, 4] },
  { label: "Different Sizes", nums1: [1, 2, 5, 9], nums2: [3, 4, 6, 7, 8] },
  { label: "One Empty", nums1: [], nums2: [1] },
  { label: "Duplicates", nums1: [0, 0], nums2: [0, 0] },
  { label: "Swap Needed", nums1: [8, 9, 10, 11], nums2: [1, 2, 3] },
  {
    label: "Large Input",
    nums1: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19],
    nums2: [1, 1, 1, 1, 1, 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
  },
];

function parseArrayInput(text) {
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error("Input must be an array.");
  const nums = parsed.map(Number);
  if (nums.some((value) => Number.isNaN(value)))
    throw new Error("Arrays may only contain numbers.");
  return nums;
}

function sortIfNeeded(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const isSorted = values.every(
    (value, index, arr) => index === 0 || value >= arr[index - 1],
  );
  return {
    values: isSorted ? values : sorted,
    wasSorted: !isSorted,
  };
}

function formatValue(value) {
  if (value === Infinity) return "∞";
  if (value === -Infinity) return "-∞";
  if (value === null || value === undefined) return "—";
  return Number.isInteger(value) ? String(value) : Number(value).toFixed(1);
}

function formatMedian(value) {
  if (value === null || value === undefined) return "—";
  return Number.isInteger(value) ? String(value) : Number(value).toFixed(1);
}

function generateSteps(searchArray, otherArray, meta) {
  const steps = [];
  const m = searchArray.length;
  const n = otherArray.length;
  const total = m + n;
  const leftSize = Math.floor((total + 1) / 2);

  if (total === 0) {
    steps.push({
      phase: "done",
      activeLine: 10,
      low: 0,
      high: 0,
      partitionA: 0,
      partitionB: 0,
      leftSize,
      total,
      m,
      n,
      maxLeftA: null,
      minRightA: null,
      maxLeftB: null,
      minRightB: null,
      leftMax: null,
      rightMin: null,
      median: null,
      result: null,
      iteration: 0,
      decision: "invalid",
      message: "Both arrays are empty, so the median is undefined.",
    });
    return steps;
  }

  let low = 0;
  let high = m;
  let iteration = 0;

  steps.push({
    phase: "init",
    activeLine: 6,
    low,
    high,
    partitionA: null,
    partitionB: null,
    leftSize,
    total,
    m,
    n,
    searchSource: meta.searchSource,
    otherSource: meta.otherSource,
    swapped: meta.swapped,
    median: null,
    result: null,
    iteration,
    decision: null,
    message: meta.swapped
      ? `Swap the arrays internally so binary search runs on the smaller one (${meta.searchSource}).`
      : "Binary search will run on the smaller array A.",
  });

  while (low <= high) {
    const partitionA = Math.floor((low + high) / 2);
    const partitionB = leftSize - partitionA;

    const maxLeftA = partitionA === 0 ? -Infinity : searchArray[partitionA - 1];
    const minRightA = partitionA === m ? Infinity : searchArray[partitionA];
    const maxLeftB = partitionB === 0 ? -Infinity : otherArray[partitionB - 1];
    const minRightB = partitionB === n ? Infinity : otherArray[partitionB];

    steps.push({
      phase: "partition",
      activeLine: 11,
      low,
      high,
      partitionA,
      partitionB,
      leftSize,
      total,
      m,
      n,
      searchSource: meta.searchSource,
      otherSource: meta.otherSource,
      swapped: meta.swapped,
      maxLeftA,
      minRightA,
      maxLeftB,
      minRightB,
      leftMax: Math.max(maxLeftA, maxLeftB),
      rightMin: Math.min(minRightA, minRightB),
      median: null,
      result: null,
      iteration,
      decision: null,
      message: `Try cutA = ${partitionA} and cutB = ${partitionB}.`,
    });

    const conditionA = maxLeftA <= minRightB;
    const conditionB = maxLeftB <= minRightA;

    steps.push({
      phase: "evaluate",
      activeLine: 14,
      low,
      high,
      partitionA,
      partitionB,
      leftSize,
      total,
      m,
      n,
      searchSource: meta.searchSource,
      otherSource: meta.otherSource,
      swapped: meta.swapped,
      maxLeftA,
      minRightA,
      maxLeftB,
      minRightB,
      leftMax: Math.max(maxLeftA, maxLeftB),
      rightMin: Math.min(minRightA, minRightB),
      conditionA,
      conditionB,
      median: null,
      result: null,
      iteration,
      decision: null,
      message: `Check partition: leftA <= rightB is ${conditionA}, and leftB <= rightA is ${conditionB}.`,
    });

    if (conditionA && conditionB) {
      const evenTotal = total % 2 === 0;
      const leftMax = Math.max(maxLeftA, maxLeftB);
      const rightMin = Math.min(minRightA, minRightB);
      const median = evenTotal ? (leftMax + rightMin) / 2 : leftMax;

      steps.push({
        phase: "found",
        activeLine: evenTotal ? 16 : 17,
        low,
        high,
        partitionA,
        partitionB,
        leftSize,
        total,
        m,
        n,
        searchSource: meta.searchSource,
        otherSource: meta.otherSource,
        swapped: meta.swapped,
        maxLeftA,
        minRightA,
        maxLeftB,
        minRightB,
        leftMax,
        rightMin,
        evenTotal,
        median,
        result: true,
        iteration,
        decision: "found",
        message: evenTotal
          ? `Valid partition found. Even total length => median = (${formatValue(leftMax)} + ${formatValue(rightMin)}) / 2 = ${formatMedian(median)}.`
          : `Valid partition found. Odd total length => median = max(leftA, leftB) = ${formatMedian(median)}.`,
      });

      steps.push({
        phase: "done",
        activeLine: evenTotal ? 16 : 17,
        low,
        high,
        partitionA,
        partitionB,
        leftSize,
        total,
        m,
        n,
        searchSource: meta.searchSource,
        otherSource: meta.otherSource,
        swapped: meta.swapped,
        maxLeftA,
        minRightA,
        maxLeftB,
        minRightB,
        leftMax,
        rightMin,
        evenTotal,
        median,
        result: true,
        iteration,
        decision: "found",
        message: `Return median = ${formatMedian(median)}.`,
      });
      return steps;
    }

    if (maxLeftA > minRightB) {
      high = partitionA - 1;
      steps.push({
        phase: "move_left",
        activeLine: 19,
        low,
        high,
        partitionA,
        partitionB,
        leftSize,
        total,
        m,
        n,
        searchSource: meta.searchSource,
        otherSource: meta.otherSource,
        swapped: meta.swapped,
        maxLeftA,
        minRightA,
        maxLeftB,
        minRightB,
        leftMax: Math.max(maxLeftA, maxLeftB),
        rightMin: Math.min(minRightA, minRightB),
        median: null,
        result: null,
        iteration,
        decision: "move_left",
        message: `leftA (${formatValue(maxLeftA)}) is too big for rightB (${formatValue(minRightB)}), so move cutA left: high = ${high}.`,
      });
    } else {
      low = partitionA + 1;
      steps.push({
        phase: "move_right",
        activeLine: 21,
        low,
        high,
        partitionA,
        partitionB,
        leftSize,
        total,
        m,
        n,
        searchSource: meta.searchSource,
        otherSource: meta.otherSource,
        swapped: meta.swapped,
        maxLeftA,
        minRightA,
        maxLeftB,
        minRightB,
        leftMax: Math.max(maxLeftA, maxLeftB),
        rightMin: Math.min(minRightA, minRightB),
        median: null,
        result: null,
        iteration,
        decision: "move_right",
        message: `leftB (${formatValue(maxLeftB)}) is too big for rightA (${formatValue(minRightA)}), so move cutA right: low = ${low}.`,
      });
    }

    iteration += 1;
  }

  steps.push({
    phase: "done",
    activeLine: 10,
    low,
    high,
    partitionA: null,
    partitionB: null,
    leftSize,
    total,
    m,
    n,
    searchSource: meta.searchSource,
    otherSource: meta.otherSource,
    swapped: meta.swapped,
    median: null,
    result: false,
    iteration,
    decision: "not_found",
    message: "No valid partition was found. Check the inputs.",
  });

  return steps;
}

function MetricCard({ label, value, tone }) {
  return (
    <div className="median-metric-card">
      <div className="median-metric-label">{label}</div>
      <div className={`median-metric-value ${tone || ""}`}>{value}</div>
    </div>
  );
}

function TapeMark({ label, value, left, tone }) {
  const isCut = tone === "partition";

  return (
    <motion.div
      layout
      className={`median-marker ${tone || ""}`}
      style={{ left }}
      initial={{ opacity: 0, y: -8, scale: isCut ? 0.9 : 1 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isCut ? [1, 1.06, 1] : 1,
      }}
      transition={{
        layout: { type: "spring", stiffness: 420, damping: 32 },
        duration: isCut ? 1.1 : 0.18,
        repeat: isCut ? Infinity : 0,
        repeatType: "mirror",
        ease: "easeInOut",
      }}
    >
      <span className="median-marker-label">{label}</span>
      <span className="median-marker-value">{value}</span>
    </motion.div>
  );
}

function ComparisonBoard({ step }) {
  const leftAStatus =
    step?.conditionA === undefined ? "idle" : step.conditionA ? "pass" : "fail";
  const leftBStatus =
    step?.conditionB === undefined ? "idle" : step.conditionB ? "pass" : "fail";
  const focusClass =
    step?.phase === "move_left"
      ? "focus-left"
      : step?.phase === "move_right"
        ? "focus-right"
        : step?.phase === "found"
          ? "focus-both"
          : "idle";

  return (
    <div className="median-compare-board">
      <div className="median-compare-title">Partition comparisons</div>
      <div className="median-compare-grid">
        <div className={`median-compare-row ${focusClass} ${leftAStatus}`}>
          <div className="median-compare-side left">
            <span className="median-compare-key">leftA</span>
            <span className="median-compare-value">
              {formatValue(step?.maxLeftA)}
            </span>
          </div>
          <div className={`median-compare-arrow ${leftAStatus}`}>
            <span className="median-compare-arrow-line">→</span>
            <span className="median-compare-arrow-caption">must be ≤</span>
          </div>
          <div className="median-compare-side right">
            <span className="median-compare-key">rightB</span>
            <span className="median-compare-value">
              {formatValue(step?.minRightB)}
            </span>
          </div>
        </div>

        <div className={`median-compare-row ${focusClass} ${leftBStatus}`}>
          <div className="median-compare-side left">
            <span className="median-compare-key">leftB</span>
            <span className="median-compare-value">
              {formatValue(step?.maxLeftB)}
            </span>
          </div>
          <div className={`median-compare-arrow ${leftBStatus}`}>
            <span className="median-compare-arrow-line">→</span>
            <span className="median-compare-arrow-caption">must be ≤</span>
          </div>
          <div className="median-compare-side right">
            <span className="median-compare-key">rightA</span>
            <span className="median-compare-value">
              {formatValue(step?.minRightA)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArrayTape({
  title,
  subtitle,
  values,
  partition,
  low,
  high,
  showRange,
  showBounds,
  colorClass,
}) {
  const denom = Math.max(1, values.length);
  const markerAt = (position) => {
    const pct = (position / denom) * 100;
    if (position <= 0) return "0%";
    if (position >= denom) return "100%";
    return `${pct}%`;
  };

  return (
    <div className={`median-tape-card ${colorClass || ""}`}>
      <div className="median-tape-head">
        <div>
          <div className="median-tape-title">{title}</div>
          <div className="median-tape-subtitle">{subtitle}</div>
        </div>
        <div className="median-tape-count">{values.length} items</div>
      </div>

      <div className="median-tape-stage">
        {showRange && low !== null && high !== null && (
          <div
            className="median-range"
            style={{
              left: `${(low / denom) * 100}%`,
              width: `${Math.max(((high - low) / denom) * 100, 1)}%`,
            }}
          />
        )}

        <div className="median-marker-layer">
          {showBounds && low !== null && (
            <TapeMark label="low" value={low} left={markerAt(low)} tone="low" />
          )}
          {showBounds && high !== null && (
            <TapeMark
              label="high"
              value={high}
              left={markerAt(high)}
              tone="high"
            />
          )}
          {partition !== null && (
            <TapeMark
              label="cut"
              value={partition}
              left={markerAt(partition)}
              tone="partition"
            />
          )}
        </div>

        <div className="median-cells">
          {values.length === 0 ? (
            <div className="median-empty">∅</div>
          ) : (
            values.map((value, index) => {
              const isLeft = partition !== null && index < partition;
              const isRight = partition !== null && index >= partition;
              const isBoundaryLeft =
                partition !== null && index === partition - 1;
              const isBoundaryRight = partition !== null && index === partition;

              return (
                <motion.div
                  key={`${title}-${index}-${value}`}
                  className={`median-cell ${isLeft ? "left" : ""} ${isRight ? "right" : ""} ${isBoundaryLeft ? "boundary-left" : ""} ${isBoundaryRight ? "boundary-right" : ""}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                >
                  <div className="median-cell-index">{index}</div>
                  <div className="median-cell-value">{value}</div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function MedianOfTwoSortedArraysVisualizer() {
  const [nums1Input, setNums1Input] = useState("[1, 3]");
  const [nums2Input, setNums2Input] = useState("[2]");
  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

  const prepared = useMemo(() => {
    try {
      const raw1 = parseArrayInput(nums1Input);
      const raw2 = parseArrayInput(nums2Input);
      const sorted1 = sortIfNeeded(raw1);
      const sorted2 = sortIfNeeded(raw2);

      let nums1 = sorted1.values;
      let nums2 = sorted2.values;
      let swapped = false;
      let searchArray = nums1;
      let otherArray = nums2;
      let searchSource = "nums1";
      let otherSource = "nums2";

      if (searchArray.length > otherArray.length) {
        swapped = true;
        searchArray = nums2;
        otherArray = nums1;
        searchSource = "nums2";
        otherSource = "nums1";
      }

      return {
        nums1,
        nums2,
        searchArray,
        otherArray,
        swapped,
        searchSource,
        otherSource,
        autoSorted: sorted1.wasSorted || sorted2.wasSorted,
        inputError:
          sorted1.wasSorted || sorted2.wasSorted
            ? "Arrays were automatically sorted for binary search."
            : "",
      };
    } catch (error) {
      return {
        nums1: [1, 3],
        nums2: [2],
        searchArray: [1, 3],
        otherArray: [2],
        swapped: false,
        searchSource: "nums1",
        otherSource: "nums2",
        autoSorted: false,
        inputError: error.message || "Invalid input",
      };
    }
  }, [nums1Input, nums2Input]);

  const steps = useMemo(() => {
    return generateSteps(prepared.searchArray, prepared.otherArray, {
      swapped: prepared.swapped,
      searchSource: prepared.searchSource,
      otherSource: prepared.otherSource,
    });
  }, [
    prepared.searchArray,
    prepared.otherArray,
    prepared.searchSource,
    prepared.otherSource,
    prepared.swapped,
  ]);

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
  const total =
    step?.total ?? prepared.searchArray.length + prepared.otherArray.length;
  const leftSize = step?.leftSize ?? Math.floor((total + 1) / 2);
  const evenTotal = total % 2 === 0;
  const history = useMemo(() => {
    return steps.filter(
      (s) =>
        s.phase === "found" ||
        s.phase === "move_left" ||
        s.phase === "move_right",
    );
  }, [steps]);
  const sourceLabel = prepared.swapped
    ? "A = nums2, B = nums1 (swapped internally)"
    : "A = nums1, B = nums2";

  const applyExample = useCallback(
    (example) => {
      setNums1Input(JSON.stringify(example.nums1));
      setNums2Input(JSON.stringify(example.nums2));
      handleReset();
    },
    [handleReset],
  );

  return (
    <div className="median-shell">
      <div className="median-top">
        <div className="median-panel median-input-panel">
          <div className="median-panel-head">
            <span>Inputs & Examples</span>
            {prepared.inputError && (
              <span className="median-error-pill">{prepared.inputError}</span>
            )}
          </div>

          <div className="median-panel-body">
            <div className="median-example-row">
              {EXAMPLES.map((example) => (
                <button
                  key={example.label}
                  className="median-example-btn"
                  onClick={() => applyExample(example)}
                >
                  {example.label}
                </button>
              ))}
            </div>

            <div className="median-input-grid">
              <div className="median-input-group">
                <span className="median-input-prefix">nums1 =</span>
                <input
                  className="median-input"
                  value={nums1Input}
                  onChange={(event) => {
                    setNums1Input(event.target.value);
                    handleReset();
                  }}
                  placeholder="[1, 3]"
                />
              </div>

              <div className="median-input-group">
                <span className="median-input-prefix">nums2 =</span>
                <input
                  className="median-input"
                  value={nums2Input}
                  onChange={(event) => {
                    setNums2Input(event.target.value);
                    handleReset();
                  }}
                  placeholder="[2]"
                />
              </div>
            </div>

            <div className="median-note-box">
              <div className="median-note-title">How the search is set up</div>
              <div className="median-note-text">
                We always binary-search the smaller array.{" "}
                <strong>{sourceLabel}</strong>.
              </div>
              <div className="median-note-text">
                Search space stays small because only cut A moves left or right.
              </div>
              {prepared.autoSorted && (
                <div className="median-note-text">
                  Input arrays were automatically sorted for visualization.
                </div>
              )}
            </div>

            <div className="median-input-stats">
              <MetricCard
                label="len(nums1)"
                value={prepared.nums1.length}
                tone="blue"
              />
              <MetricCard
                label="len(nums2)"
                value={prepared.nums2.length}
                tone="cyan"
              />
              <MetricCard label="Total" value={total} tone="amber" />
            </div>
          </div>
        </div>

        <div className="median-panel median-array-panel">
          <div className="median-panel-head">
            <span>Partition Visualization</span>
            <span className="median-badge neutral">
              {step?.phase === "found"
                ? "Valid partition found"
                : step?.phase === "move_left" || step?.phase === "move_right"
                  ? "Adjusting cut"
                  : "Searching"}
            </span>
          </div>

          <div className="median-panel-body">
            <ArrayTape
              title="A"
              subtitle={`searched array (${prepared.swapped ? "nums2" : "nums1"})`}
              values={prepared.searchArray}
              partition={step?.partitionA ?? 0}
              low={step?.low ?? 0}
              high={step?.high ?? prepared.searchArray.length}
              showRange
              showBounds
              colorClass="a-tape"
            />

            <ArrayTape
              title="B"
              subtitle={`other array (${prepared.swapped ? "nums1" : "nums2"})`}
              values={prepared.otherArray}
              partition={step?.partitionB ?? leftSize}
              low={null}
              high={null}
              showRange={false}
              showBounds={false}
              colorClass="b-tape"
            />
          </div>
        </div>

        <div className="median-panel median-math-panel">
          <div className="median-panel-head">
            <span>Partition Math & Verdict</span>
            <span className="median-badge neutral">LeetCode 4</span>
          </div>

          <div className="median-panel-body">
            <div className="median-result-box">
              <div className="median-result-title">Current median</div>
              <div
                className={`median-result-value ${step?.result === true ? "success" : step?.result === false ? "danger" : "neutral"}`}
              >
                {step?.phase === "found" || step?.phase === "done"
                  ? formatMedian(step?.median)
                  : "In progress"}
              </div>
              <div className="median-result-subtext">
                {step?.phase === "found"
                  ? evenTotal
                    ? "Even total length: average the largest value on the left and the smallest value on the right."
                    : "Odd total length: the median is the largest value on the left half."
                  : step?.phase === "move_left"
                    ? "Cut A is too far right, so shift left. The leftA → rightB check failed."
                    : step?.phase === "move_right"
                      ? "Cut A is too far left, so shift right. The leftB → rightA check failed."
                      : "Watch the partitions move until both sides match."}
              </div>
            </div>

            <ComparisonBoard step={step} />

            <div className="median-metric-grid">
              <MetricCard
                label="m"
                value={step?.m ?? prepared.searchArray.length}
                tone="blue"
              />
              <MetricCard
                label="n"
                value={step?.n ?? prepared.otherArray.length}
                tone="cyan"
              />
              <MetricCard label="half" value={leftSize} tone="amber" />
              <MetricCard
                label="cutA"
                value={step?.partitionA ?? 0}
                tone="blue"
              />
              <MetricCard
                label="cutB"
                value={step?.partitionB ?? leftSize}
                tone="cyan"
              />
              <MetricCard
                label="iteration"
                value={step?.iteration ?? 0}
                tone="amber"
              />
            </div>

            <div className="median-condition-box">
              <div className="median-condition-row">
                <span className="median-condition-label">leftA ≤ rightB</span>
                <span
                  className={`median-condition-pill ${step?.conditionA === true ? "ok" : step?.conditionA === false ? "bad" : "neutral"}`}
                >
                  {step?.conditionA === undefined
                    ? "—"
                    : String(step.conditionA)}
                </span>
              </div>
              <div className="median-condition-row">
                <span className="median-condition-label">leftB ≤ rightA</span>
                <span
                  className={`median-condition-pill ${step?.conditionB === true ? "ok" : step?.conditionB === false ? "bad" : "neutral"}`}
                >
                  {step?.conditionB === undefined
                    ? "—"
                    : String(step.conditionB)}
                </span>
              </div>
              <div className="median-condition-row summary">
                <span className="median-condition-label">Decision</span>
                <span className="median-condition-pill neutral">
                  {step?.decision || "—"}
                </span>
              </div>
            </div>

            <div className="median-boundary-box">
              <div className="median-boundary-title">Boundary values</div>
              <div className="median-boundary-grid">
                <div>
                  <span className="key">maxLeftA</span>
                  <span>{formatValue(step?.maxLeftA)}</span>
                </div>
                <div>
                  <span className="key">minRightA</span>
                  <span>{formatValue(step?.minRightA)}</span>
                </div>
                <div>
                  <span className="key">maxLeftB</span>
                  <span>{formatValue(step?.maxLeftB)}</span>
                </div>
                <div>
                  <span className="key">minRightB</span>
                  <span>{formatValue(step?.minRightB)}</span>
                </div>
              </div>
            </div>

            <div className="median-history-box">
              <div className="median-history-title">Iteration history</div>
              {history.length === 0 ? (
                <div className="median-history-empty">
                  No partition attempts yet.
                </div>
              ) : (
                history.map((entry) => (
                  <div
                    key={`${entry.phase}-${entry.iteration}-${entry.partitionA ?? "na"}`}
                    className="median-history-row"
                  >
                    <span className="median-history-step">
                      #{entry.iteration}
                    </span>
                    <span className="median-history-text">
                      cutA={entry.partitionA} cutB={entry.partitionB} →{" "}
                      {entry.decision}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="median-middle">
        <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
      </div>

      <div
        className={`median-status ${step?.phase === "found" || step?.phase === "done" ? "success" : step?.phase === "move_left" || step?.phase === "move_right" ? "update" : ""}`}
      >
        {step?.message || "Press Play or Step to begin."}
      </div>

      <div className="median-dock">
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
