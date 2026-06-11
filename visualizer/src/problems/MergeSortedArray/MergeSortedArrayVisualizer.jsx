import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./MergeSortedArrayVisualizer.css";

const SOLUTION_CODE = [
  { line: 1,  text: "def merge(nums1, m, nums2, n):" },
  { line: 2,  text: "    i, j, k = m-1, n-1, m+n-1" },
  { line: 3,  text: "    while i >= 0 and j >= 0:" },
  { line: 4,  text: "        if nums1[i] >= nums2[j]:" },
  { line: 5,  text: "            nums1[k] = nums1[i]; i -= 1" },
  { line: 6,  text: "        else:" },
  { line: 7,  text: "            nums1[k] = nums2[j]; j -= 1" },
  { line: 8,  text: "        k -= 1" },
  { line: 9,  text: "    while j >= 0:" },
  { line: 10, text: "        nums1[k] = nums2[j]; j -= 1; k -= 1" },
];

const EXAMPLES = [
  { label: "Ex 1", nums1: [1, 2, 3, 0, 0, 0], m: 3, nums2: [2, 5, 6], n: 3 },
  { label: "Ex 2", nums1: [1, 0],              m: 1, nums2: [2],       n: 1 },
  { label: "Ex 3", nums1: [4, 5, 6, 0, 0, 0], m: 3, nums2: [1, 2, 3], n: 3 },
];

function generateSteps(nums1Init, m, nums2, n) {
  const steps = [];
  const a = [...nums1Init];
  let i = m - 1, j = n - 1, k = m + n - 1;

  steps.push({
    activeLine: 2, a: [...a], b: [...nums2], i, j, k,
    message: `Init i=${i}, j=${j}, k=${k}`,
  });

  while (i >= 0 && j >= 0) {
    steps.push({
      activeLine: 4, a: [...a], b: [...nums2], i, j, k,
      message: `Compare nums1[${i}]=${a[i]} vs nums2[${j}]=${nums2[j]}`,
    });
    if (a[i] >= nums2[j]) {
      a[k] = a[i];
      steps.push({
        activeLine: 5, a: [...a], b: [...nums2], i, j, k,
        message: `nums1[${i}](${a[i]}) >= nums2[${j}](${nums2[j]}) → place ${a[i]} at pos ${k}`,
      });
      i--;
    } else {
      a[k] = nums2[j];
      steps.push({
        activeLine: 7, a: [...a], b: [...nums2], i, j, k,
        message: `nums2[${j}](${nums2[j]}) > nums1[${i}](${a[i]}) → place ${nums2[j]} at pos ${k}`,
      });
      j--;
    }
    k--;
  }

  while (j >= 0) {
    a[k] = nums2[j];
    steps.push({
      activeLine: 10, a: [...a], b: [...nums2], i, j, k,
      message: `Remaining nums2[${j}]=${nums2[j]} → place at pos ${k}`,
    });
    j--; k--;
  }

  steps.push({
    activeLine: 1, a: [...a], b: [...nums2], i, j, k, done: true,
    message: `Done! Merged: [${a.join(", ")}]`,
  });
  return steps;
}

export default function MergeSortedArrayVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.nums1, ex.m, ex.nums2, ex.n), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

  const renderArray = (arr, label, pointers) => (
    <div className="msa-arr-block">
      <div className="msa-arr-label">{label}</div>
      <div className="msa-arr-row">
        {arr.map((v, idx) => {
          const ptrs = pointers.filter(p => p.pos === idx);
          return (
            <div key={idx} className="msa-cell-col">
              <motion.div
                className={`msa-cell ${ptrs.some(p => p.name === "k") ? "k-cell" : ""} ${ptrs.some(p => p.name === "i") ? "i-cell" : ""}`}
                animate={{ scale: ptrs.length > 0 ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                {v === 0 && label === "nums1" && idx >= ex.m && !step?.done ? <span className="msa-zero">0</span> : v}
              </motion.div>
              <div className="msa-idx">{idx}</div>
              <div className="msa-ptrs">
                {ptrs.map(p => <span key={p.name} className={`msa-ptr ${p.name}`}>{p.name}</span>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const nums1Ptrs = step ? [
    { name: "i", pos: step.i },
    { name: "k", pos: step.k },
  ].filter(p => p.pos >= 0) : [];
  const nums2Ptrs = step ? [{ name: "j", pos: step.j }].filter(p => p.pos >= 0) : [];

  return (
    <div className="msa-shell">
      <div className="msa-examples">
        {EXAMPLES.map(e => (
          <button key={e.label} className={`msa-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>{e.label}</button>
        ))}
      </div>

      <div className="msa-panel">
        <div className="msa-panel-label">Arrays</div>
        {renderArray(step?.a ?? ex.nums1, "nums1", nums1Ptrs)}
        {renderArray(step?.b ?? ex.nums2, "nums2", nums2Ptrs)}
      </div>

      {step?.done && (
        <div className="msa-result">✓ Merged in-place: [{(step?.a ?? []).join(", ")}]</div>
      )}

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
      <div className="msa-status">{step?.message ?? "Press Play to begin."}</div>
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
