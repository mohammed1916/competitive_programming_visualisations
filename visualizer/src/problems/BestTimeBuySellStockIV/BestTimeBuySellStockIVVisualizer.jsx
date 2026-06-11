import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./BestTimeBuySellStockIVVisualizer.css";

const SOLUTION_CODE = [
  { line: 1,  text: "def maxProfit(k, prices):" },
  { line: 2,  text: "    n = len(prices)" },
  { line: 3,  text: "    if k >= n//2: return greedy(prices)" },
  { line: 4,  text: "    # dp[t][i] = max profit using ≤t transactions up to day i" },
  { line: 5,  text: "    dp = [[0]*n for _ in range(k+1)]" },
  { line: 6,  text: "    for t in range(1, k+1):" },
  { line: 7,  text: "        max_so_far = -prices[0]" },
  { line: 8,  text: "        for i in range(1, n):" },
  { line: 9,  text: "            max_so_far = max(max_so_far," },
  { line: 10, text: "                         dp[t-1][i-1] - prices[i-1])" },
  { line: 11, text: "            dp[t][i] = max(dp[t][i-1]," },
  { line: 12, text: "                        prices[i] + max_so_far)" },
  { line: 13, text: "    return dp[k][n-1]" },
];

const EXAMPLES = [
  { label: "k=2 [3,2,6,5,0,3]", k: 2, prices: [3,2,6,5,0,3] },
  { label: "k=2 [3,3,5,0,0,3,1,4]", k: 2, prices: [3,3,5,0,0,3,1,4] },
  { label: "k=1 [1,2,3,4,5]", k: 1, prices: [1,2,3,4,5] },
];

function generateSteps(k, prices) {
  const n = prices.length;
  const steps = [];
  const dp = Array.from({ length: k + 1 }, () => Array(n).fill(0));

  steps.push({ activeLine: 5, dp: dp.map(r => [...r]), t: -1, i: -1, msf: null, phase: "init", message: `k=${k}, n=${n}. Init dp all zeros.` });

  for (let t = 1; t <= k; t++) {
    let maxSoFar = -prices[0];
    steps.push({ activeLine: 7, dp: dp.map(r => [...r]), t, i: 0, msf: maxSoFar, phase: "t-init", message: `t=${t}: max_so_far = -prices[0] = ${maxSoFar}` });
    for (let i = 1; i < n; i++) {
      const candidate = dp[t - 1][i - 1] - prices[i - 1];
      if (candidate > maxSoFar) maxSoFar = candidate;
      const newVal = Math.max(dp[t][i - 1], prices[i] + maxSoFar);
      dp[t][i] = newVal;
      steps.push({
        activeLine: 12, dp: dp.map(r => [...r]), t, i, msf: maxSoFar, phase: "fill",
        message: `t=${t}, i=${i}: msf=max(${maxSoFar}, dp[${t-1}][${i-1}]-p[${i-1}])=${maxSoFar}; dp[${t}][${i}]=max(dp[${t}][${i-1}], p[${i}]+msf)=${newVal}`,
      });
    }
  }

  steps.push({ activeLine: 13, dp: dp.map(r => [...r]), t: k, i: n - 1, msf: null, phase: "done", done: true, message: `Max profit with ≤${k} transactions = ${dp[k][n - 1]}` });
  return steps;
}

export default function BestTimeBuySellStockIVVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.k, ex.prices), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

  const dp = step?.dp ?? Array.from({ length: ex.k + 1 }, () => Array(ex.prices.length).fill(0));
  const activeT = step?.t ?? -1;
  const activeI = step?.i ?? -1;
  const msf = step?.msf;
  const phase = step?.phase ?? "init";
  const prices = ex.prices;
  const k = ex.k;
  const n = prices.length;
  const answer = dp[k]?.[n - 1] ?? 0;

  const maxPrice = Math.max(...prices);
  const SVG_W = 300, SVG_H = 70;
  const xStep = (SVG_W - 20) / (n - 1);
  const yScale = (SVG_H - 10) / maxPrice;
  const polyline = prices.map((p, i) => `${10 + i * xStep},${SVG_H - p * yScale}`).join(" ");

  return (
    <div className="bt4-shell">
      <div className="bt4-examples">
        {EXAMPLES.map(e => (
          <button key={e.label} className={`bt4-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
            {e.label}
          </button>
        ))}
      </div>

      <div className="bt4-panel">
        <div className="bt4-panel-label">Prices</div>
        <svg width={SVG_W} height={SVG_H + 4} className="bt4-svg">
          <polyline points={polyline} className="bt4-line" />
          {prices.map((p, i) => (
            <circle key={i} cx={10 + i * xStep} cy={SVG_H - p * yScale} r={i === activeI ? 5 : 3}
              className={`bt4-dot ${i === activeI ? "active-dot" : ""}`} />
          ))}
        </svg>
        <div className="bt4-price-row">
          {prices.map((p, i) => (
            <span key={i} className={`bt4-price ${i === activeI ? "active-price" : ""}`}>{p}</span>
          ))}
        </div>
      </div>

      <div className="bt4-panel">
        <div className="bt4-panel-label">DP Table — dp[t][i]: max profit with ≤t transactions up to day i</div>
        <div className="bt4-table-wrap">
          <table className="bt4-table">
            <thead>
              <tr>
                <th className="bt4-th">t\i</th>
                {prices.map((_, i) => (
                  <th key={i} className={`bt4-th bt4-idx ${i === activeI ? "active-col" : ""}`}>{i}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dp.map((row, t) => (
                <tr key={t}>
                  <td className={`bt4-th bt4-idx ${t === activeT ? "active-row" : ""}`}>{t}</td>
                  {row.map((val, i) => {
                    const isActive = t === activeT && i === activeI;
                    return (
                      <motion.td key={i}
                        className={`bt4-cell ${val > 0 ? "pos" : "zero"} ${isActive ? "active-cell" : ""}`}
                        animate={{ scale: isActive ? 1.2 : 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}>
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

      <div className="bt4-trackers">
        <div className="bt4-tracker">
          <span className="bt4-tracker-label">t</span>
          <span className="bt4-tracker-val">{activeT < 0 ? "—" : activeT}</span>
        </div>
        <div className="bt4-tracker">
          <span className="bt4-tracker-label">i (day)</span>
          <span className="bt4-tracker-val">{activeI < 0 ? "—" : activeI}</span>
        </div>
        <div className="bt4-tracker">
          <span className="bt4-tracker-label">max_so_far</span>
          <span className="bt4-tracker-val bt4-msf">{msf == null ? "—" : msf}</span>
        </div>
        <div className="bt4-tracker">
          <span className="bt4-tracker-label">Phase</span>
          <span className={`bt4-tracker-val bt4-phase ${phase.split("-")[0]}`}>{phase.replace("-", " ")}</span>
        </div>
      </div>

      {step?.done && <div className="bt4-result">✓ Max profit = {answer}</div>}

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
      <div className="bt4-status">{step?.message ?? "Press Play to begin."}</div>
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
