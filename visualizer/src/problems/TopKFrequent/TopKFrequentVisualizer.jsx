import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./TopKFrequentVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def topKFrequent(nums, k):" },
    { line: 2, text: "    count = Counter(nums)" },
    { line: 3, text: "    freq = [[] for _ in range(len(nums)+1)]" },
    { line: 4, text: "    for num, cnt in count.items():" },
    { line: 5, text: "        freq[cnt].append(num)" },
    { line: 6, text: "    res = []" },
    { line: 7, text: "    for i in range(len(freq)-1, 0, -1):" },
    { line: 8, text: "        for n in freq[i]:" },
    { line: 9, text: "            res.append(n)" },
    { line: 10, text: "            if len(res) == k: return res" },
];

function generateSteps(nums, k) {
    const steps = [];

    // Build count
    const count = {};
    for (const n of nums) count[n] = (count[n] || 0) + 1;

    steps.push({
        phase: "count", activeLine: 2,
        count: { ...count }, buckets: null, res: [], activeFreq: null, activeNum: null,
        message: `Count frequencies: ${Object.entries(count).map(([n, c]) => `${n}→${c}`).join(", ")}`,
    });

    // Build bucket array
    const freq = Array.from({ length: nums.length + 1 }, () => []);
    for (const [num, cnt] of Object.entries(count)) {
        freq[cnt].push(Number(num));
    }
    const bucketsSnap = freq.map((b) => [...b]);

    steps.push({
        phase: "buckets", activeLine: 5,
        count: { ...count }, buckets: bucketsSnap, res: [], activeFreq: null, activeNum: null,
        message: `Bucket sort: freq[i] contains numbers appearing i times`,
    });

    // Collect top k
    const res = [];
    for (let i = freq.length - 1; i >= 1; i--) {
        for (const n of freq[i]) {
            res.push(n);
            steps.push({
                phase: res.length === k ? "found" : "collect", activeLine: res.length === k ? 10 : 9,
                count: { ...count }, buckets: bucketsSnap, res: [...res], activeFreq: i, activeNum: n,
                message: `freq[${i}] contains ${n} — add to result. res=[${res.join(",")}]`,
            });
            if (res.length === k) {
                steps.push({
                    phase: "done", activeLine: 10,
                    count: { ...count }, buckets: bucketsSnap, res: [...res], activeFreq: null, activeNum: null,
                    message: `Found k=${k} elements — return [${res.join(",")}]`,
                });
                return steps;
            }
        }
    }

    steps.push({
        phase: "done", activeLine: 10,
        count: { ...count }, buckets: bucketsSnap, res: [...res], activeFreq: null, activeNum: null,
        message: `Result: [${res.join(",")}]`,
    });
    return steps;
}

const EXAMPLES = [
    { label: "[1,1,1,2,2,3] k=2", nums: [1, 1, 1, 2, 2, 3], k: 2 },
    { label: "[1] k=1", nums: [1], k: 1 },
    { label: "[4,1,1,2,2,3,3,3] k=2", nums: [4, 1, 1, 2, 2, 3, 3, 3], k: 2 },
];

function parseNums(str) {
    try { const p = JSON.parse(str); if (!Array.isArray(p)) throw new Error(); return { nums: p.map(Number), err: "" }; }
    catch { return { nums: [], err: "Invalid" }; }
}

export default function TopKFrequentVisualizer() {
    const [numsInput, setNumsInput] = useState("[1,1,1,2,2,3]");
    const [kInput, setKInput] = useState("2");
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

    const { nums, err } = useMemo(() => parseNums(numsInput), [numsInput]);
    const k = useMemo(() => Math.max(1, parseInt(kInput, 10) || 1), [kInput]);

    const steps = useMemo(() => (nums.length ? generateSteps(nums, k) : []), [nums, k]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;

    const applyExample = useCallback(
        (ex) => { setNumsInput(JSON.stringify(ex.nums)); setKInput(String(ex.k)); handleReset(); },
        [handleReset]
    );

    const buckets = step?.buckets ?? [];

    return (
        <div className="tkf-shell">
            <div className="tkf-controls-row">
                <div className="tkf-examples">
                    {EXAMPLES.map((ex) => (
                        <button key={ex.label} className="tkf-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input className="tkf-input" value={numsInput} onChange={(e) => { setNumsInput(e.target.value); handleReset(); }} />
                    <label className="tkf-k-label">k=<input className="tkf-k-input" type="number" min={1} value={kInput}
                        onChange={(e) => { setKInput(e.target.value); handleReset(); }} /></label>
                    {err && <span className="tkf-error">{err}</span>}
                </div>
            </div>

            {/* Count map */}
            <div className="tkf-panel">
                <div className="tkf-panel-label">Frequency count</div>
                <div className="tkf-count-row">
                    {Object.entries(step?.count ?? {}).map(([n, c]) => (
                        <div key={n} className={`tkf-count-cell ${step?.activeNum === Number(n) ? "active" : ""}`}>
                            <span className="tkf-count-num">{n}</span>
                            <span className="tkf-count-freq">×{c}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bucket array */}
            {buckets.length > 0 && (
                <div className="tkf-panel">
                    <div className="tkf-panel-label">Bucket (index = frequency)</div>
                    <div className="tkf-buckets-row">
                        {buckets.map((bucket, i) => {
                            if (i === 0 && bucket.length === 0) return null;
                            const isActive = step?.activeFreq === i;
                            return (
                                <div key={i} className={`tkf-bucket ${isActive ? "active" : ""} ${bucket.length === 0 ? "empty" : ""}`}>
                                    <div className="tkf-bucket-idx">{i}</div>
                                    <div className="tkf-bucket-items">
                                        {bucket.map((n) => (
                                            <motion.div key={n}
                                                className={`tkf-bucket-item ${step?.activeNum === n && isActive ? "highlight" : ""}`}
                                                animate={{ scale: step?.activeNum === n && isActive ? 1.2 : 1 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                                                {n}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Result */}
            {(step?.res?.length ?? 0) > 0 && (
                <div className="tkf-panel">
                    <div className="tkf-panel-label">Result (top {k} frequent)</div>
                    <div className="tkf-res-row">
                        <AnimatePresence mode="popLayout">
                            {step.res.map((n, i) => (
                                <motion.div key={i} className="tkf-res-cell"
                                    initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 380, damping: 22 }}>
                                    {n}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className="tkf-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
                showPatternOverlay={showPatternOverlay}
                onShowPatternOverlayChange={setShowPatternOverlay}
                patternOverlayLabel="Show pattern overlay"
                showPatternOverlayToggle
            />
            {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
        </div>
    );
}
