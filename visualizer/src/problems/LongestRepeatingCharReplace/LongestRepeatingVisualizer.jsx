import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./LongestRepeatingVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def characterReplacement(s, k):" },
    { line: 2, text: "    count = {}" },
    { line: 3, text: "    l, maxCount, res = 0, 0, 0" },
    { line: 4, text: "    for r in range(len(s)):" },
    { line: 5, text: "        count[s[r]] = count.get(s[r], 0) + 1" },
    { line: 6, text: "        maxCount = max(maxCount, count[s[r]])" },
    { line: 7, text: "        while (r - l + 1) - maxCount > k:" },
    { line: 8, text: "            count[s[l]] -= 1" },
    { line: 9, text: "            l += 1" },
    { line: 10, text: "        res = max(res, r - l + 1)" },
    { line: 11, text: "    return res" },
];

function generateSteps(s, k) {
    const steps = [];
    const count = {};
    let l = 0, maxCount = 0, res = 0;

    steps.push({ phase: "init", activeLine: 3, l, r: -1, count: {}, maxCount, res, message: "Initialize window" });

    for (let r = 0; r < s.length; r++) {
        count[s[r]] = (count[s[r]] || 0) + 1;
        maxCount = Math.max(maxCount, count[s[r]]);

        steps.push({
            phase: "expand", activeLine: 5,
            l, r, count: { ...count }, maxCount, res,
            message: `r=${r} s[r]='${s[r]}': count[${s[r]}]=${count[s[r]]}, maxCount=${maxCount}`,
        });

        while (r - l + 1 - maxCount > k) {
            count[s[l]] -= 1;
            steps.push({
                phase: "shrink", activeLine: 8,
                l, r, count: { ...count }, maxCount, res,
                message: `Window size ${r - l + 1} - maxCount ${maxCount} > k=${k} — shrink: l=${l} → ${l + 1}`,
            });
            l++;
        }

        res = Math.max(res, r - l + 1);
        steps.push({
            phase: "update", activeLine: 10,
            l, r, count: { ...count }, maxCount, res,
            message: `Window [${l},${r}] "${s.slice(l, r + 1)}" size=${r - l + 1}, res=${res}`,
        });
    }

    steps.push({ phase: "done", activeLine: 11, l, r: s.length - 1, count: { ...count }, maxCount, res, message: `Result = ${res}` });
    return steps;
}

const EXAMPLES = [
    { label: "ABAB k=2", s: "ABAB", k: 2 },
    { label: "AABABBA k=1", s: "AABABBA", k: 1 },
    { label: "AAAA k=0", s: "AAAA", k: 0 },
];

export default function LongestRepeatingVisualizer() {
    const [sInput, setSInput] = useState("AABABBA");
    const [kInput, setKInput] = useState("1");

    const k = useMemo(() => Math.max(0, parseInt(kInput, 10) || 0), [kInput]);
    const steps = useMemo(() => generateSteps(sInput.toUpperCase(), k), [sInput, k]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;

    const applyExample = useCallback(
        (ex) => { setSInput(ex.s); setKInput(String(ex.k)); handleReset(); },
        [handleReset]
    );

    const str = sInput.toUpperCase();
    const l = step?.l ?? 0;
    const r = step?.r ?? -1;

    return (
        <div className="lr-shell">
            <div className="lr-controls-row">
                <div className="lr-examples">
                    {EXAMPLES.map((ex) => (
                        <button key={ex.label} className="lr-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input className="lr-input" value={sInput} onChange={(e) => { setSInput(e.target.value); handleReset(); }} placeholder="String" />
                    <label className="lr-k-label">k=<input className="lr-k-input" type="number" min={0} value={kInput}
                        onChange={(e) => { setKInput(e.target.value); handleReset(); }} /></label>
                </div>
            </div>

            {/* String visualization */}
            <div className="lr-panel">
                <div className="lr-panel-label">Sliding window</div>
                <div className="lr-chars-row">
                    {str.split("").map((c, i) => {
                        const inWindow = i >= l && i <= r;
                        const isL = i === l;
                        const isR = i === r;
                        return (
                            <motion.div key={i} className={`lr-char ${inWindow ? "in-window" : ""} ${isL ? "ptr-l" : ""} ${isR ? "ptr-r" : ""}`}
                                animate={{ scale: inWindow ? 1.08 : 1 }}
                                transition={{ type: "spring", stiffness: 380, damping: 22 }}>
                                {c}
                                {isL && <span className="lr-ptr-label">L</span>}
                                {isR && <span className="lr-ptr-label">R</span>}
                            </motion.div>
                        );
                    })}
                </div>

                <div className="lr-info-row">
                    <span>window: <strong>{r >= 0 ? `"${str.slice(l, r + 1)}"` : "—"}</strong></span>
                    <span>size: <strong>{r >= l ? r - l + 1 : 0}</strong></span>
                    <span>maxCount: <strong>{step?.maxCount ?? 0}</strong></span>
                    <span>k: <strong>{k}</strong></span>
                    <span className="lr-res">res = <strong>{step?.res ?? 0}</strong></span>
                </div>
            </div>

            {/* Count map */}
            <div className="lr-panel">
                <div className="lr-panel-label">Character counts</div>
                <div className="lr-count-row">
                    {Object.entries(step?.count ?? {}).filter(([, v]) => v > 0).map(([c, v]) => (
                        <div key={c} className={`lr-count-cell ${v === step?.maxCount ? "max" : ""}`}>
                            <span className="lr-count-char">{c}</span>
                            <span className="lr-count-val">{v}</span>
                        </div>
                    ))}
                </div>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="lr-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
            />
        </div>
    );
}
