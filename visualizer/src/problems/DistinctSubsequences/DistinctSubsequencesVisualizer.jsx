import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./DistinctSubsequencesVisualizer.css";

const SOLUTION_CODE = [
  { line: 1,  text: "def numDistinct(s, t):" },
  { line: 2,  text: "    m, n = len(s), len(t)" },
  { line: 3,  text: "    dp = [[0]*(n+1) for _ in range(m+1)]" },
  { line: 4,  text: "    for i in range(m+1): dp[i][0] = 1" },
  { line: 5,  text: "    for i in range(1, m+1):" },
  { line: 6,  text: "        for j in range(1, n+1):" },
  { line: 7,  text: "            dp[i][j] = dp[i-1][j]  # skip s[i]" },
  { line: 8,  text: "            if s[i-1] == t[j-1]:" },
  { line: 9,  text: "                dp[i][j] += dp[i-1][j-1]  # use s[i]" },
  { line: 10, text: "    return dp[m][n]" },
];

const EXAMPLES = [
  { label: "rabbbit/rabbit", s: "rabbbit", t: "rabbit" },
  { label: "babgbag/bag", s: "babgbag", t: "bag" },
  { label: "abc/ac", s: "abc", t: "ac" },
];

function generateSteps(s, t) {
  const m = s.length, n = t.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  const steps = [];

  for (let i = 0; i <= m; i++) dp[i][0] = 1;
  steps.push({ activeLine: 4, dp: dp.map(r => [...r]), i: -1, j: -1, phase: "base", message: "dp[i][0]=1 for all i (empty t always matches)" });

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = dp[i - 1][j];
      const matched = s[i - 1] === t[j - 1];
      if (matched) dp[i][j] += dp[i - 1][j - 1];
      steps.push({
        activeLine: matched ? 9 : 7,
        dp: dp.map(r => [...r]), i, j, phase: matched ? "match" : "skip",
        message: matched
          ? `s[${i-1}]='${s[i-1]}'==t[${j-1}]='${t[j-1]}': dp[${i}][${j}]=${dp[i][j]}`
          : `s[${i-1}]='${s[i-1]}'≠t[${j-1}]='${t[j-1]}': dp[${i}][${j}]=dp[${i-1}][${j}]=${dp[i][j]}`,
      });
    }
  }

  steps.push({ activeLine: 10, dp: dp.map(r => [...r]), i: m, j: n, phase: "done", done: true, message: `Distinct subsequences = ${dp[m][n]}` });
  return steps;
}

export default function DistinctSubsequencesVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.s, ex.t), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

  const dp = step?.dp ?? Array.from({ length: ex.s.length + 1 }, () => Array(ex.t.length + 1).fill(0));
  const activeI = step?.i ?? -1;
  const activeJ = step?.j ?? -1;
  const phase = step?.phase ?? "init";
  const s = ex.s, t = ex.t;
  const answer = dp[s.length]?.[t.length] ?? 0;

  return (
    <div className="ds-shell">
      <div className="ds-examples">
        {EXAMPLES.map(e => (
          <button key={e.label} className={`ds-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
            {e.label}
          </button>
        ))}
      </div>

      <div className="ds-strings">
        <div className="ds-string-row">
          <span className="ds-string-label">s</span>
          {s.split("").map((ch, i) => (
            <span key={i} className={`ds-char ${activeI - 1 === i ? "active-s" : ""}`}>{ch}</span>
          ))}
        </div>
        <div className="ds-string-row">
          <span className="ds-string-label">t</span>
          {t.split("").map((ch, j) => (
            <span key={j} className={`ds-char ${activeJ - 1 === j ? "active-t" : ""}`}>{ch}</span>
          ))}
        </div>
      </div>

      <div className="ds-panel">
        <div className="ds-panel-label">DP Table — dp[i][j]: # ways s[0..i) contains t[0..j) as subsequence</div>
        <div className="ds-table-wrap">
          <table className="ds-table">
            <thead>
              <tr>
                <th className="ds-th"></th>
                <th className="ds-th ds-idx">ε</th>
                {t.split("").map((ch, j) => (
                  <th key={j} className={`ds-th ds-idx ${activeJ - 1 === j ? "active-col" : ""}`}>{ch}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dp.map((row, i) => (
                <tr key={i}>
                  <td className={`ds-th ds-idx ${activeI - 1 === i - 1 ? "active-row" : ""}`}>{i === 0 ? "ε" : s[i - 1]}</td>
                  {row.map((val, j) => {
                    const isActive = i === activeI && j === activeJ;
                    return (
                      <motion.td
                        key={j}
                        className={`ds-cell ${val > 0 ? "nonzero" : "zero"} ${isActive ? "active-cell" : ""}`}
                        animate={{ scale: isActive ? 1.2 : 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
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

      <div className="ds-trackers">
        <div className="ds-tracker">
          <span className="ds-tracker-label">i (s)</span>
          <span className="ds-tracker-val">{activeI < 0 ? "—" : activeI}</span>
        </div>
        <div className="ds-tracker">
          <span className="ds-tracker-label">j (t)</span>
          <span className="ds-tracker-val">{activeJ < 0 ? "—" : activeJ}</span>
        </div>
        <div className="ds-tracker">
          <span className="ds-tracker-label">Phase</span>
          <span className={`ds-tracker-val ds-phase ${phase}`}>{phase}</span>
        </div>
        <div className="ds-tracker">
          <span className="ds-tracker-label">Answer</span>
          <span className="ds-tracker-val ds-answer">{step?.done ? answer : "…"}</span>
        </div>
      </div>

      {step?.done && <div className="ds-result">✓ Distinct subsequences = {answer}</div>}

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      <div className="ds-status">{step?.message ?? "Press Play to begin."}</div>
      <PlaybackControls
        isPlaying={isPlaying} isDone={isDone} speed={speed}
        onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
        prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
        onSpeedChange={e => setSpeed(Number(e.target.value))}
      />
    </div>
  );
}
