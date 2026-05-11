import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./WildcardMatchingVisualizer.css";

const SOLUTION_CODE = [
  { line: 1,  text: "def isMatch(s, p):" },
  { line: 2,  text: "    m, n = len(s), len(p)" },
  { line: 3,  text: "    dp = [[False]*(n+1) for _ in range(m+1)]" },
  { line: 4,  text: "    dp[0][0] = True" },
  { line: 5,  text: "    for j in range(1, n+1):" },
  { line: 6,  text: "        if p[j-1]=='*': dp[0][j] = dp[0][j-1]" },
  { line: 7,  text: "    for i in range(1, m+1):" },
  { line: 8,  text: "        for j in range(1, n+1):" },
  { line: 9,  text: "            if p[j-1]=='*':" },
  { line: 10, text: "                dp[i][j] = dp[i-1][j] or dp[i][j-1]" },
  { line: 11, text: "            elif p[j-1]=='?' or p[j-1]==s[i-1]:" },
  { line: 12, text: "                dp[i][j] = dp[i-1][j-1]" },
  { line: 13, text: "    return dp[m][n]" },
];

const EXAMPLES = [
  { label: "aa / a*", s: "aa", p: "a*" },
  { label: "cb / ?a", s: "cb", p: "?a" },
  { label: "abc / a*c", s: "abc", p: "a*c" },
  { label: "aab / c*a*b", s: "aab", p: "c*a*b" },
];

function generateSteps(s, p) {
  const m = s.length, n = p.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(false));
  const steps = [];

  dp[0][0] = true;
  steps.push({ activeLine: 4, dp: dp.map(r => [...r]), i: 0, j: 0, phase: "init", message: "dp[0][0] = true (empty matches empty)" });

  for (let j = 1; j <= n; j++) {
    if (p[j - 1] === "*") {
      dp[0][j] = dp[0][j - 1];
      steps.push({ activeLine: 6, dp: dp.map(r => [...r]), i: 0, j, phase: "base", message: `p[${j-1}]='*': dp[0][${j}]=${dp[0][j]}` });
    }
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (p[j - 1] === "*") {
        dp[i][j] = dp[i - 1][j] || dp[i][j - 1];
        steps.push({ activeLine: 10, dp: dp.map(r => [...r]), i, j, phase: "star", message: `'*': dp[${i}][${j}] = dp[${i-1}][${j}]||dp[${i}][${j-1}] = ${dp[i][j]}` });
      } else if (p[j - 1] === "?" || p[j - 1] === s[i - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
        steps.push({ activeLine: 12, dp: dp.map(r => [...r]), i, j, phase: "match", message: `'${p[j-1]}'=='${s[i-1]}': dp[${i}][${j}]=${dp[i][j]}` });
      } else {
        steps.push({ activeLine: 11, dp: dp.map(r => [...r]), i, j, phase: "no-match", message: `'${p[j-1]}'!='${s[i-1]}': dp[${i}][${j}]=false` });
      }
    }
  }

  steps.push({ activeLine: 13, dp: dp.map(r => [...r]), i: m, j: n, phase: "done", done: true, message: `Result: dp[${m}][${n}] = ${dp[m][n]}` });
  return steps;
}

const CELL_SIZE = 34;

export default function WildcardMatchingVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.s, ex.p), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

  const dp = step?.dp ?? Array.from({ length: ex.s.length + 1 }, () => Array(ex.p.length + 1).fill(false));
  const activeI = step?.i ?? -1;
  const activeJ = step?.j ?? -1;
  const phase = step?.phase ?? "init";
  const s = ex.s, p = ex.p;

  return (
    <div className="wm-shell">
      <div className="wm-examples">
        {EXAMPLES.map(e => (
          <button key={e.label} className={`wm-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
            {e.label}
          </button>
        ))}
      </div>

      <div className="wm-strings">
        <div className="wm-string-row">
          <span className="wm-string-label">s</span>
          {s.split("").map((ch, i) => (
            <span key={i} className={`wm-char ${activeI - 1 === i ? "active-s" : ""}`}>{ch}</span>
          ))}
        </div>
        <div className="wm-string-row">
          <span className="wm-string-label">p</span>
          {p.split("").map((ch, j) => (
            <span key={j} className={`wm-char ${activeJ - 1 === j ? "active-p" : ""} ${ch === "*" ? "star" : ch === "?" ? "qmark" : ""}`}>{ch}</span>
          ))}
        </div>
      </div>

      <div className="wm-panel">
        <div className="wm-panel-label">DP Table — dp[i][j]: s[0..i) matches p[0..j)</div>
        <div className="wm-table-wrap">
          <table className="wm-table">
            <thead>
              <tr>
                <th className="wm-th"></th>
                <th className="wm-th wm-idx">ε</th>
                {p.split("").map((ch, j) => (
                  <th key={j} className={`wm-th wm-idx ${activeJ - 1 === j ? "active-col" : ""}`}>{ch}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dp.map((row, i) => (
                <tr key={i}>
                  <td className={`wm-th wm-idx ${activeI - 1 === i - 1 ? "active-row" : ""}`}>{i === 0 ? "ε" : s[i - 1]}</td>
                  {row.map((val, j) => {
                    const isActive = i === activeI && j === activeJ;
                    return (
                      <motion.td
                        key={j}
                        className={`wm-cell ${val ? "true" : "false"} ${isActive ? "active-cell" : ""}`}
                        animate={{ scale: isActive ? 1.2 : 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        {val ? "T" : "F"}
                      </motion.td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="wm-trackers">
        <div className="wm-tracker">
          <span className="wm-tracker-label">i (s)</span>
          <span className="wm-tracker-val">{activeI < 0 ? "—" : activeI}</span>
        </div>
        <div className="wm-tracker">
          <span className="wm-tracker-label">j (p)</span>
          <span className="wm-tracker-val">{activeJ < 0 ? "—" : activeJ}</span>
        </div>
        <div className="wm-tracker">
          <span className="wm-tracker-label">Phase</span>
          <span className={`wm-tracker-val wm-phase ${phase.replace("-","")}`}>{phase}</span>
        </div>
        <div className="wm-tracker">
          <span className="wm-tracker-label">Result</span>
          <span className={`wm-tracker-val wm-result-val ${dp[ex.s.length]?.[ex.p.length] ? "true" : "false"}`}>
            {step?.done ? String(dp[ex.s.length][ex.p.length]) : "…"}
          </span>
        </div>
      </div>

      {step?.done && (
        <div className={`wm-result ${dp[ex.s.length][ex.p.length] ? "match" : "no-match"}`}>
          {dp[ex.s.length][ex.p.length] ? `✓ "${s}" matches pattern "${p}"` : `✗ "${s}" does not match "${p}"`}
        </div>
      )}

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      <div className="wm-status">{step?.message ?? "Press Play to begin."}</div>
      <PlaybackControls
        isPlaying={isPlaying} isDone={isDone} speed={speed}
        onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
        prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
        onSpeedChange={e => setSpeed(Number(e.target.value))}
      />
    </div>
  );
}
