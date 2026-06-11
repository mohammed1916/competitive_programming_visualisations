import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./FirstMissingPositiveVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def firstMissingPositive(nums):" },
    { line: 2, text: "    n = len(nums)" },
    { line: 3, text: "    # Phase 1: place each num at index num-1" },
    { line: 4, text: "    for i in range(n):" },
    { line: 5, text: "        while 1 <= nums[i] <= n and nums[nums[i]-1] != nums[i]:" },
    { line: 6, text: "            j = nums[i] - 1" },
    { line: 7, text: "            nums[i], nums[j] = nums[j], nums[i]" },
    { line: 8, text: "    # Phase 2: scan for first mismatch" },
    { line: 9, text: "    for i in range(n):" },
    { line: 10, text: "        if nums[i] != i + 1:" },
    { line: 11, text: "            return i + 1" },
    { line: 12, text: "    return n + 1" },
];

const EXAMPLES = [
    { label: "Ex 1", nums: [1, 2, 0] },
    { label: "Ex 2", nums: [3, 4, -1, 1] },
    { label: "Ex 3", nums: [7, 8, 9, 11, 12] },
    { label: "Ex 4", nums: [2, 1] },
];

function generateSteps(numsIn) {
    const steps = [];
    const arr = [...numsIn];
    const n = arr.length;

    steps.push({ activeLine: 2, arr: [...arr], i: -1, j: -1, phase: "init", message: `n=${n}. Phase 1: cyclic sort — place each number at index num-1.` });

    // Phase 1
    for (let i = 0; i < n; i++) {
        steps.push({ activeLine: 4, arr: [...arr], i, j: -1, phase: "place", message: `i=${i}: nums[${i}]=${arr[i]}` });
        while (arr[i] >= 1 && arr[i] <= n && arr[arr[i] - 1] !== arr[i]) {
            const j = arr[i] - 1;
            steps.push({
                activeLine: 5, arr: [...arr], i, j, phase: "swap",
                message: `nums[${i}]=${arr[i]} → should be at index ${j}. Swap nums[${i}] ↔ nums[${j}]`,
            });
            [arr[i], arr[j]] = [arr[j], arr[i]];
            steps.push({ activeLine: 7, arr: [...arr], i, j, phase: "swapped", message: `After swap: [${arr.join(", ")}]` });
        }
    }

    steps.push({ activeLine: 8, arr: [...arr], i: -1, j: -1, phase: "scan", message: `Phase 2: scan for first index where nums[i] ≠ i+1` });

    // Phase 2
    for (let i = 0; i < n; i++) {
        steps.push({ activeLine: 10, arr: [...arr], i, j: -1, phase: "scan", message: `i=${i}: nums[${i}]=${arr[i]}, expected ${i + 1}` });
        if (arr[i] !== i + 1) {
            steps.push({ activeLine: 11, arr: [...arr], i, j: -1, phase: "found", done: true, missing: i + 1, message: `nums[${i}]=${arr[i]} ≠ ${i + 1} → answer = ${i + 1}` });
            return steps;
        }
    }
    steps.push({ activeLine: 12, arr: [...arr], i: -1, j: -1, phase: "found", done: true, missing: n + 1, message: `All 1..${n} present → answer = ${n + 1}` });
    return steps;
}

export default function FirstMissingPositiveVisualizer() {
    const [ex, setEx] = useState(EXAMPLES[0]);
    const steps = useMemo(() => generateSteps(ex.nums), [ex]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

    const arr = step?.arr ?? ex.nums;
    const activeI = step?.i ?? -1;
    const activeJ = step?.j ?? -1;
    const phase = step?.phase ?? "init";

    return (
        <div className="fmp-shell">
            <div className="fmp-examples">
                {EXAMPLES.map(e => (
                    <button key={e.label} className={`fmp-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
                        {e.label}: [{e.nums.join(", ")}]
                    </button>
                ))}
            </div>

            <div className="fmp-panel">
                <div className="fmp-panel-label">Array (in-place cyclic sort)</div>
                <div className="fmp-arr">
                    {arr.map((v, idx) => {
                        const isI = idx === activeI;
                        const isJ = idx === activeJ;
                        const correct = phase !== "init" && v === idx + 1;
                        const isDoneHL = step?.done && step?.missing === idx + 1;
                        return (
                            <div key={idx} className="fmp-cell-col">
                                <motion.div
                                    className={`fmp-cell ${isI ? "i-cell" : ""} ${isJ && !isI ? "j-cell" : ""} ${correct && !isI && !isJ ? "correct" : ""} ${isDoneHL ? "missing-slot" : ""}`}
                                    animate={{ scale: (isI || isJ) ? 1.15 : 1, y: isI ? -6 : 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                >
                                    {v}
                                </motion.div>
                                <div className="fmp-expected">={idx + 1}?</div>
                                <div className="fmp-idx">{idx}</div>
                                <div className="fmp-ptrs">
                                    {isI && <span className="fmp-ptr fmp-i">i</span>}
                                    {isJ && <span className="fmp-ptr fmp-j">j</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="fmp-trackers">
                <div className="fmp-tracker">
                    <span className="fmp-tracker-label">Phase</span>
                    <span className={`fmp-tracker-val fmp-phase ${phase}`}>{phase}</span>
                </div>
                <div className="fmp-tracker">
                    <span className="fmp-tracker-label">i</span>
                    <span className="fmp-tracker-val">{activeI < 0 ? "—" : activeI}</span>
                </div>
                <div className="fmp-tracker">
                    <span className="fmp-tracker-label">j (swap target)</span>
                    <span className="fmp-tracker-val" style={{ color: "#f9e2af" }}>{activeJ < 0 ? "—" : activeJ}</span>
                </div>
            </div>

            {step?.done && (
                <div className="fmp-result">✓ First missing positive = {step.missing}</div>
            )}

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className="fmp-status">{step?.message ?? "Press Play to begin."}</div>
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
