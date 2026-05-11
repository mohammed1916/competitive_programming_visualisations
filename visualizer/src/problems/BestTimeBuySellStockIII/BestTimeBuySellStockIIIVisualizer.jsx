import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./BestTimeBuySellStockIIIVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def maxProfit(prices):" },
    { line: 2, text: "    b1 = b2 = -inf  # best profit after 1st/2nd buy" },
    { line: 3, text: "    s1 = s2 = 0     # best profit after 1st/2nd sell" },
    { line: 4, text: "    for p in prices:" },
    { line: 5, text: "        b1 = max(b1, -p)         # buy at p (tx1)" },
    { line: 6, text: "        s1 = max(s1, b1 + p)     # sell at p (tx1)" },
    { line: 7, text: "        b2 = max(b2, s1 - p)     # buy at p (tx2)" },
    { line: 8, text: "        s2 = max(s2, b2 + p)     # sell at p (tx2)" },
    { line: 9, text: "    return s2" },
];

const EXAMPLES = [
    { label: "[3,3,5,0,0,3,1,4]", prices: [3, 3, 5, 0, 0, 3, 1, 4] },
    { label: "[1,2,3,4,5]", prices: [1, 2, 3, 4, 5] },
    { label: "[7,6,4,3,1]", prices: [7, 6, 4, 3, 1] },
];

function generateSteps(prices) {
    const steps = [];
    let b1 = -Infinity, b2 = -Infinity, s1 = 0, s2 = 0;

    steps.push({ activeLine: 2, b1, b2, s1, s2, idx: -1, phase: "init", message: "Init: b1=b2=-∞, s1=s2=0" });

    for (let i = 0; i < prices.length; i++) {
        const p = prices[i];
        b1 = Math.max(b1, -p);
        s1 = Math.max(s1, b1 + p);
        b2 = Math.max(b2, s1 - p);
        s2 = Math.max(s2, b2 + p);
        steps.push({
            activeLine: 8, b1, b2, s1, s2, idx: i, phase: "update",
            message: `p=${p}: b1=${b1 === Number.NEGATIVE_INFINITY ? "−∞" : b1} s1=${s1} b2=${b2 === Number.NEGATIVE_INFINITY ? "−∞" : b2} s2=${s2}`,
        });
    }

    steps.push({ activeLine: 9, b1, b2, s1, s2, idx: -1, phase: "done", done: true, message: `Max profit = s2 = ${s2}` });
    return steps;
}

export default function BestTimeBuySellStockIIIVisualizer() {
    const [ex, setEx] = useState(EXAMPLES[0]);
    const steps = useMemo(() => generateSteps(ex.prices), [ex]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

    const prices = ex.prices;
    const idx = step?.idx ?? -1;
    const b1 = step?.b1 ?? -Infinity;
    const b2 = step?.b2 ?? -Infinity;
    const s1 = step?.s1 ?? 0;
    const s2 = step?.s2 ?? 0;
    const phase = step?.phase ?? "init";

    const maxP = Math.max(...prices);
    const SVG_W = 300, SVG_H = 70;
    const xStep = prices.length > 1 ? (SVG_W - 20) / (prices.length - 1) : SVG_W;
    const yScale = (SVG_H - 10) / maxP;
    const polyline = prices.map((p, i) => `${10 + i * xStep},${SVG_H - p * yScale}`).join(" ");

    const fmt = v => v === -Infinity || v === Number.NEGATIVE_INFINITY ? "−∞" : v;

    return (
        <div className="bt3-shell">
            <div className="bt3-examples">
                {EXAMPLES.map(e => (
                    <button key={e.label} className={`bt3-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
                        {e.label}
                    </button>
                ))}
            </div>

            <div className="bt3-panel">
                <div className="bt3-panel-label">Prices</div>
                <svg width={SVG_W} height={SVG_H + 4} className="bt3-svg">
                    <polyline points={polyline} className="bt3-line" />
                    {prices.map((p, i) => (
                        <circle key={i} cx={10 + i * xStep} cy={SVG_H - p * yScale} r={i === idx ? 5 : 3}
                            className={`bt3-dot ${i === idx ? "active-dot" : ""}`} />
                    ))}
                    {idx >= 0 && (
                        <line x1={10 + idx * xStep} y1={0} x2={10 + idx * xStep} y2={SVG_H}
                            stroke="#f9e2af44" strokeWidth="1" strokeDasharray="3,3" />
                    )}
                </svg>
                <div className="bt3-price-row">
                    {prices.map((p, i) => (
                        <span key={i} className={`bt3-price ${i === idx ? "active-price" : ""}`}>{p}</span>
                    ))}
                </div>
            </div>

            <div className="bt3-states">
                {[
                    { label: "b1", val: fmt(b1), desc: "max profit after buy 1", cls: "b1" },
                    { label: "s1", val: fmt(s1), desc: "max profit after sell 1", cls: "s1" },
                    { label: "b2", val: fmt(b2), desc: "max profit after buy 2", cls: "b2" },
                    { label: "s2", val: fmt(s2), desc: "max profit after sell 2", cls: "s2" },
                ].map(({ label, val, desc, cls }) => (
                    <div key={label} className="bt3-state-card">
                        <span className="bt3-state-label">{label}</span>
                        <motion.span key={String(val)} className={`bt3-state-val ${cls}`}
                            initial={{ scale: 1.2 }} animate={{ scale: 1 }}>
                            {val}
                        </motion.span>
                        <span className="bt3-state-desc">{desc}</span>
                    </div>
                ))}
            </div>

            <div className="bt3-trackers">
                <div className="bt3-tracker">
                    <span className="bt3-tracker-label">Day</span>
                    <span className="bt3-tracker-val">{idx < 0 ? "—" : idx}</span>
                </div>
                <div className="bt3-tracker">
                    <span className="bt3-tracker-label">Price</span>
                    <span className="bt3-tracker-val bt3-price-val">{idx < 0 ? "—" : prices[idx]}</span>
                </div>
                <div className="bt3-tracker">
                    <span className="bt3-tracker-label">Phase</span>
                    <span className={`bt3-tracker-val bt3-phase ${phase}`}>{phase}</span>
                </div>
                <div className="bt3-tracker">
                    <span className="bt3-tracker-label">Answer</span>
                    <span className="bt3-tracker-val bt3-answer">{step?.done ? s2 : "…"}</span>
                </div>
            </div>

            {step?.done && <div className="bt3-result">✓ Max profit (≤2 transactions) = {s2}</div>}

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="bt3-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={e => setSpeed(Number(e.target.value))}
            />
        </div>
    );
}
