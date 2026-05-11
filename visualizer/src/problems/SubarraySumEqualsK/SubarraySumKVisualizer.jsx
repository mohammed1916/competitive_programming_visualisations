import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./SubarraySumKVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def subarraySum(nums, k):" },
    { line: 2, text: "    count, prefix = 0, 0" },
    { line: 3, text: "    freq = {0: 1}  # prefix sum → frequency" },
    { line: 4, text: "    for num in nums:" },
    { line: 5, text: "        prefix += num" },
    { line: 6, text: "        count += freq.get(prefix - k, 0)" },
    { line: 7, text: "        freq[prefix] = freq.get(prefix, 0) + 1" },
    { line: 8, text: "    return count" },
];

function generateSteps(nums, k) {
    const steps = [];
    let count = 0, prefix = 0;
    const freq = { 0: 1 };

    steps.push({
        phase: "init", activeLine: 3,
        prefix, count, freq: { ...freq }, activeIdx: -1, found: 0,
        message: `freq = {0: 1} (empty prefix sum seen once), k=${k}`,
    });

    for (let i = 0; i < nums.length; i++) {
        prefix += nums[i];
        steps.push({
            phase: "add", activeLine: 5,
            prefix, count, freq: { ...freq }, activeIdx: i, found: 0,
            message: `i=${i} num=${nums[i]}: prefix = ${prefix}`,
        });

        const need = prefix - k;
        const found = freq[need] ?? 0;
        count += found;
        steps.push({
            phase: "check", activeLine: 6,
            prefix, count, freq: { ...freq }, activeIdx: i, need, found,
            message: `Need prefix-k = ${prefix}-${k} = ${need}: freq[${need}]=${found} → count=${count}`,
        });

        freq[prefix] = (freq[prefix] ?? 0) + 1;
        steps.push({
            phase: "store", activeLine: 7,
            prefix, count, freq: { ...freq }, activeIdx: i, found: 0,
            message: `Store prefix ${prefix}: freq[${prefix}]=${freq[prefix]}`,
        });
    }

    steps.push({ phase: "done", activeLine: 8, prefix, count, freq: { ...freq }, activeIdx: -1, found: 0, message: `Result = ${count} subarrays sum to ${k}` });
    return steps;
}

const EXAMPLES = [
    { label: "[1,1,1] k=2", nums: [1, 1, 1], k: 2 },
    { label: "[1,2,3] k=3", nums: [1, 2, 3], k: 3 },
    { label: "[3,4,7,2,-3,1,4,2] k=7", nums: [3, 4, 7, 2, -3, 1, 4, 2], k: 7 },
];

function parseNums(str) {
    try { const p = JSON.parse(str); if (!Array.isArray(p)) throw new Error(); return { nums: p.map(Number), err: "" }; }
    catch { return { nums: [], err: "Invalid" }; }
}

export default function SubarraySumKVisualizer() {
    const [numsInput, setNumsInput] = useState("[1,1,1]");
    const [kInput, setKInput] = useState("2");

    const { nums, err } = useMemo(() => parseNums(numsInput), [numsInput]);
    const k = useMemo(() => parseInt(kInput, 10) || 0, [kInput]);

    const steps = useMemo(() => (nums.length ? generateSteps(nums, k) : []), [nums, k]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;

    const applyExample = useCallback(
        (ex) => { setNumsInput(JSON.stringify(ex.nums)); setKInput(String(ex.k)); handleReset(); },
        [handleReset]
    );

    return (
        <div className="ssk-shell">
            <div className="ssk-controls-row">
                <div className="ssk-examples">
                    {EXAMPLES.map((ex) => (
                        <button key={ex.label} className="ssk-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input className="ssk-input" value={numsInput} onChange={(e) => { setNumsInput(e.target.value); handleReset(); }} />
                    <label className="ssk-k-label">k=<input className="ssk-k-input" type="number" value={kInput}
                        onChange={(e) => { setKInput(e.target.value); handleReset(); }} /></label>
                    {err && <span className="ssk-error">{err}</span>}
                </div>
            </div>

            {/* Array + prefix display */}
            <div className="ssk-panel">
                <div className="ssk-panel-label">Array — current prefix sum = <strong>{step?.prefix ?? 0}</strong></div>
                <div className="ssk-cells-row">
                    {nums.map((v, i) => (
                        <motion.div key={i} className={`ssk-cell ${i === step?.activeIdx ? "active" : i < (step?.activeIdx ?? -1) ? "past" : ""}`}
                            animate={{ scale: i === step?.activeIdx ? 1.15 : 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                            <span className="ssk-cell-val">{v}</span>
                            <span className="ssk-cell-idx">{i}</span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Prefix frequency map */}
            <div className="ssk-panel">
                <div className="ssk-panel-label">Prefix sum → frequency map</div>
                <div className="ssk-freq-row">
                    <AnimatePresence mode="popLayout">
                        {Object.entries(step?.freq ?? {}).map(([ps, freq]) => {
                            const isNeed = String(step?.need) === ps && step?.phase === "check";
                            return (
                                <motion.div key={ps} className={`ssk-freq-cell ${isNeed ? "need" : ""}`}
                                    initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 380, damping: 22 }}>
                                    <span className="ssk-freq-key">{ps}</span>
                                    <span className="ssk-freq-val">×{freq}</span>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {step?.phase === "check" && step.found > 0 && (
                <div className="ssk-found-badge">+{step.found} subarrays found! (total = {step.count})</div>
            )}

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="ssk-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
            />
        </div>
    );
}
