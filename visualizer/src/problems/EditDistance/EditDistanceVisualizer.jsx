import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import FloatingPanel from "../../components/shared/FloatingPanel";
import DockableWorkspace from "../../components/shared/DockableWorkspace";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import { useAutoScroll } from "../../hooks/useAutoScroll";
import "./EditDistanceVisualizer.css";

const SOLUTION_CODE = [
  { line: 1, text: "def minDistance(word1, word2):" },
  { line: 2, text: "    m, n = len(word1), len(word2)" },
  { line: 3, text: "    dp = [[0]*(n+1) for _ in range(m+1)]" },
  { line: 4, text: "    for i in range(m+1): dp[i][0] = i" },
  { line: 5, text: "    for j in range(n+1): dp[0][j] = j" },
  { line: 6, text: "    for i in range(1, m+1):" },
  { line: 7, text: "        for j in range(1, n+1):" },
  { line: 8, text: "            if word1[i-1] == word2[j-1]:" },
  { line: 9, text: "                dp[i][j] = dp[i-1][j-1]" },
  { line: 10, text: "            else:" },
  { line: 11, text: "                dp[i][j] = 1 + min(dp[i-1][j],   # delete" },
  { line: 12, text: "                               dp[i][j-1],   # insert" },
  { line: 13, text: "                               dp[i-1][j-1]) # replace" },
  { line: 14, text: "    return dp[m][n]" },
];

const EXAMPLES = [
  { label: '"horse"→"ros"', w1: "horse", w2: "ros" },
  { label: '"intention"→"execution"', w1: "intention", w2: "execution" },
  { label: '"abc"→"abc"', w1: "abc", w2: "abc" },
  { label: '"abc"→""', w1: "abc", w2: "" },
];

function generateSteps(w1, w2) {
  const m = w1.length, n = w2.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  const steps = [];

  steps.push({ activeLine: 4, dp: dp.map(r => [...r]), curI: 0, curJ: 0, message: `Init base cases: dp[i][0]=i (delete all), dp[0][j]=j (insert all)` });

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const match = w1[i - 1] === w2[j - 1];
      if (match) {
        dp[i][j] = dp[i - 1][j - 1];
        steps.push({ activeLine: 9, dp: dp.map(r => [...r]), curI: i, curJ: j, message: `w1[${i-1}]="${w1[i-1]}"==w2[${j-1}]="${w2[j-1]}": dp[${i}][${j}]=dp[${i-1}][${j-1}]=${dp[i][j]}` });
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        steps.push({ activeLine: 11, dp: dp.map(r => [...r]), curI: i, curJ: j, message: `w1[${i-1}]="${w1[i-1]}"≠w2[${j-1}]="${w2[j-1]}": dp[${i}][${j}]=1+min(${dp[i-1][j]},${dp[i][j-1]},${dp[i-1][j-1]})=${dp[i][j]}` });
      }
    }
  }
  steps.push({ activeLine: 14, dp: dp.map(r => [...r]), curI: m, curJ: n, message: `Result: dp[${m}][${n}] = ${dp[m][n]}` });
  return steps;
}

export default function EditDistanceVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.w1, ex.w2), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
  const [autoScrollCode, setAutoScrollCode] = useAutoScroll();
  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

  const maxVal = step ? Math.max(...step.dp.flat()) : 1;

  // DP Table visualization panel component
  const DPTablePanel = () => (
    step && (
      <div className="ed-panel">
        <div className="ed-panel-label">DP Table</div>
        <div className="ed-table-wrap">
          <table className="ed-table">
            <thead>
              <tr>
                <th className="ed-th corner"></th>
                <th className="ed-th">ε</th>
                {ex.w2.split("").map((c, j) => <th key={j} className="ed-th w2ch">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {step.dp.map((row, i) => (
                <tr key={i}>
                  <th className="ed-th w1ch">{i === 0 ? "ε" : ex.w1[i - 1]}</th>
                  {row.map((val, j) => {
                    const isCur = step.curI === i && step.curJ === j;
                    const intensity = maxVal > 0 ? val / maxVal : 0;
                    return (
                      <motion.td key={j}
                        className={`ed-td ${isCur ? "cur" : val === 0 ? "zero" : ""}`}
                        animate={{ scale: isCur ? 1.25 : 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 22 }}
                        style={{ background: isCur ? undefined : `rgba(137,180,250,${intensity * 0.35})` }}
                      >
                        {val}
                      </motion.td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  );

  // Input/Config panel component
  const InputPanel = () => (
    <div className="ed-input-panel">
      <div className="ed-examples">
        {EXAMPLES.map((e) => (
          <button key={e.label} className={`ed-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>{e.label}</button>
        ))}
      </div>

      <div className="ed-strings">
        <span className="ed-lbl w1">word1:</span><span className="ed-val">{ex.w1 || '""'}</span>
        <span className="ed-lbl w2">word2:</span><span className="ed-val">{ex.w2 || '""'}</span>
      </div>

      <div className="ed-status">{step?.message ?? "Press Play to begin."}</div>
    </div>
  );

  // Create dock panels
  const dockPanels = [
    {
      id: 'input',
      title: 'Input',
      subtitle: `word1: "${ex.w1}" → word2: "${ex.w2}"`,
      content: <InputPanel />,
    },
    {
      id: 'table',
      title: 'DP Table',
      subtitle: step ? `Step ${stepIndex + 1}/${steps.length}` : 'Edit Distance Table',
      content: <DPTablePanel />,
    },
    {
      id: 'code',
      title: 'Code Trace',
      subtitle: step ? `Line ${step.activeLine}` : 'Solution code',
      content: (
        <CodeTracePanel
          step={step}
          codeLines={SOLUTION_CODE}
          onActiveLineDomChange={setActiveLineDom}
          autoScroll={autoScrollCode}
        />
      ),
    },
  ];

  return (
    <div className="ed-shell">
      <DockableWorkspace
        title="Edit Distance Visualizer"
        panels={dockPanels}
        initialLayout={{
          rows: [['input', 'table'], ['code']],
          minimized: [],
        }}
      />

      <FloatingPanel title="Playback Controls">
        <PlaybackControls
          onReset={handleReset}
          onPrev={stepBack}
          onPlayToggle={togglePlay}
          onNext={stepForward}
          resetDisabled={steps.length === 0}
          prevDisabled={stepIndex <= 0}
          nextDisabled={steps.length === 0 || isDone}
          isPlaying={isPlaying}
          isDone={isDone}
          speed={speed}
          onSpeedChange={(event) => setSpeed(Number(event.target.value))}
          speedIndicator={`${speed}ms`}
          autoScroll={autoScrollCode}
          onAutoScrollChange={setAutoScrollCode}
          autoScrollLabel="Auto-scroll code"
          showAutoScroll
          showPatternOverlay={showPatternOverlay}
          onShowPatternOverlayChange={setShowPatternOverlay}
          patternOverlayLabel="Show pattern overlay"
          showPatternOverlayToggle
        />
      </FloatingPanel>

      {showPatternOverlay && step && (
        <PatternOverlay step={step} activeLineDom={activeLineDom} />
      )}
    </div>
  );
}
