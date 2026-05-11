import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./PalindromePartitioningIIVisualizer.css";

const SOLUTION_CODE = [
  { line: 1,  text: "def minCut(s):" },
  { line: 2,  text: "    n = len(s)" },
  { line: 3,  text: "    # is_pal[i][j] = s[i..j] is palindrome" },
  { line: 4,  text: "    is_pal = precompute_palindromes(s)" },
  { line: 5,  text: "    dp[i] = min cuts for s[0..i]" },
  { line: 6,  text: "    dp = [i for i in range(n)]  # worst: cut every char" },
  { line: 7,  text: "    for i in range(n):" },
  { line: 8,  text: "        if is_pal[0][i]: dp[i] = 0; continue" },
  { line: 9,  text: "        for j in range(1, i+1):" },
  { line: 10, text: "            if is_pal[j][i]:" },
  { line: 11, text: "                dp[i] = min(dp[i], dp[j-1]+1)" },
  { line: 12, text: "    return dp[n-1]" },
];

const EXAMPLES = [
  { label: "aab", s: "aab" },
  { label: "aabb", s: "aabb" },
  { label: "aaabbc", s: "aaabbc" },
];

function generateSteps(s) {
  const n = s.length;
  const steps = [];

  // Precompute palindromes
  const pal = Array.from({ length: n }, () => Array(n).fill(false));
  for (let i = 0; i < n; i++) pal[i][i] = true;
  for (let i = 0; i < n - 1; i++) if (s[i] === s[i + 1]) pal[i][i + 1] = true;
  for (let len = 3; len <= n; len++) {
    for (let i = 0; i <= n - len; i++) {
      const j = i + len - 1;
      if (s[i] === s[j] && pal[i + 1][j - 1]) pal[i][j] = true;
    }
  }

  const dp = Array.from({ length: n }, (_, i) => i);
  steps.push({ activeLine: 6, dp: [...dp], pal: pal.map(r => [...r]), i: -1, j: -1, phase: "init", message: `Init dp=[${dp.join(",")}] (worst: cut every char)` });

  for (let i = 0; i < n; i++) {
    if (pal[0][i]) {
      dp[i] = 0;
      steps.push({ activeLine: 8, dp: [...dp], pal: pal.map(r => [...r]), i, j: -1, phase: "whole-pal", message: `s[0..${i}]="${s.slice(0,i+1)}" is palindrome → dp[${i}]=0` });
      continue;
    }
    for (let j = 1; j <= i; j++) {
      if (pal[j][i]) {
        const newVal = dp[j - 1] + 1;
        const improved = newVal < dp[i];
        if (improved) dp[i] = newVal;
        steps.push({
          activeLine: improved ? 11 : 10,
          dp: [...dp], pal: pal.map(r => [...r]), i, j, phase: improved ? "update" : "check",
          message: `s[${j}..${i}]="${s.slice(j,i+1)}" pal → dp[${i}]=min(dp[${i}], dp[${j-1}]+1)=${dp[i]}`,
        });
      }
    }
  }

  steps.push({ activeLine: 12, dp: [...dp], pal: pal.map(r => [...r]), i: n - 1, j: -1, phase: "done", done: true, message: `Min cuts = dp[${n-1}] = ${dp[n-1]}` });
  return steps;
}

export default function PalindromePartitioningIIVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.s), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

  const s = ex.s;
  const n = s.length;
  const dp = step?.dp ?? Array.from({ length: n }, (_, i) => i);
  const pal = step?.pal ?? Array.from({ length: n }, () => Array(n).fill(false));
  const activeI = step?.i ?? -1;
  const activeJ = step?.j ?? -1;
  const phase = step?.phase ?? "init";
  const answer = dp[n - 1];

  return (
    <div className="pp-shell">
      <div className="pp-examples">
        {EXAMPLES.map(e => (
          <button key={e.label} className={`pp-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
            {e.label}
          </button>
        ))}
      </div>

      <div className="pp-strings">
        <span className="pp-string-label">s</span>
        {s.split("").map((ch, i) => (
          <motion.span
            key={i}
            className={`pp-char ${i === activeI ? "active-i" : ""} ${i === activeJ ? "active-j" : ""} ${activeJ >= 0 && i >= activeJ && i <= activeI ? "in-range" : ""}`}
            animate={{ scale: i === activeI ? 1.2 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {ch}
          </motion.span>
        ))}
      </div>

      <div className="pp-row">
        <div className="pp-panel pp-dp-panel">
          <div className="pp-panel-label">dp[i] — min cuts for s[0..i]</div>
          <div className="pp-dp-row">
            {dp.map((val, i) => (
              <motion.div key={i} className={`pp-dp-cell ${i === activeI ? "active-dp" : ""}`}
                animate={{ scale: i === activeI ? 1.18 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                <div className="pp-dp-val">{val}</div>
                <div className="pp-dp-idx">{i}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="pp-panel">
        <div className="pp-panel-label">Palindrome Table — is_pal[i][j]</div>
        <div className="pp-table-wrap">
          <table className="pp-table">
            <thead>
              <tr>
                <th className="pp-th"></th>
                {s.split("").map((ch, j) => (
                  <th key={j} className="pp-th pp-idx">{j}<br/><span className="pp-ch">{ch}</span></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pal.map((row, i) => (
                <tr key={i}>
                  <td className="pp-th pp-idx">{i}<br/><span className="pp-ch">{s[i]}</span></td>
                  {row.map((val, j) => {
                    const isActive = i === activeJ && j === activeI;
                    return (
                      <motion.td key={j}
                        className={`pp-cell ${j < i ? "na" : val ? "pal" : "no"} ${isActive ? "active-pal" : ""}`}
                        animate={{ scale: isActive ? 1.2 : 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                        {j >= i ? (val ? "✓" : "✗") : ""}
                      </motion.td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pp-trackers">
        <div className="pp-tracker">
          <span className="pp-tracker-label">i</span>
          <span className="pp-tracker-val">{activeI < 0 ? "—" : activeI}</span>
        </div>
        <div className="pp-tracker">
          <span className="pp-tracker-label">j</span>
          <span className="pp-tracker-val">{activeJ < 0 ? "—" : activeJ}</span>
        </div>
        <div className="pp-tracker">
          <span className="pp-tracker-label">Phase</span>
          <span className={`pp-tracker-val pp-phase ${phase.split("-")[0]}`}>{phase.replace("-", " ")}</span>
        </div>
        <div className="pp-tracker">
          <span className="pp-tracker-label">Min Cuts</span>
          <span className="pp-tracker-val pp-answer">{step?.done ? answer : "…"}</span>
        </div>
      </div>

      {step?.done && <div className="pp-result">✓ Min cuts = {answer}</div>}

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      <div className="pp-status">{step?.message ?? "Press Play to begin."}</div>
      <PlaybackControls
        isPlaying={isPlaying} isDone={isDone} speed={speed}
        onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
        prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
        onSpeedChange={e => setSpeed(Number(e.target.value))}
      />
    </div>
  );
}
