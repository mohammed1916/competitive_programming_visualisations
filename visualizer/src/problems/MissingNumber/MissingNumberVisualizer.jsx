import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./MissingNumberVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def missingNumber(nums):" },
    { line: 2, text: "    n = len(nums)" },
    { line: 3, text: "    expected = n * (n + 1) // 2  # Gauss sum" },
    { line: 4, text: "    return expected - sum(nums)" },
];

const EXAMPLES = [
    { label: "Ex 1", nums: [3, 0, 1] },
    { label: "Ex 2", nums: [0, 1] },
    { label: "Ex 3", nums: [9, 6, 4, 2, 3, 5, 7, 0, 1] },
];

function generateSteps(nums) {
    const steps = [];
    const n = nums.length;
    steps.push({ activeLine: 2, n, message: `n = len(nums) = ${n}` });

    const expected = (n * (n + 1)) / 2;
    steps.push({ activeLine: 3, n, expected, message: `expected = ${n}×${n + 1}/2 = ${expected} (Gauss sum 0..${n})` });

    // Show accumulating sum of nums
    let runSum = 0;
    for (let i = 0; i < nums.length; i++) {
        runSum += nums[i];
        steps.push({ activeLine: 4, n, expected, runSum, cur: i, message: `sum so far: ${runSum} (added nums[${i}]=${nums[i]})` });
    }

    const result = expected - runSum;
    steps.push({ activeLine: 4, n, expected, runSum, cur: -1, result, message: `${expected} - ${runSum} = ${result} → missing number is ${result}` });
    return steps;
}

export default function MissingNumberVisualizer() {
    const [ex, setEx] = useState(EXAMPLES[0]);
    const steps = useMemo(() => generateSteps(ex.nums), [ex]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

    const n = ex.nums.length;
    const full = Array.from({ length: n + 1 }, (_, i) => i); // 0..n
    const numSet = new Set(ex.nums);

    return (
        <div className="mn-shell">
            <div className="mn-examples">
                {EXAMPLES.map(e => (
                    <button key={e.label} className={`mn-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>{e.label}</button>
                ))}
            </div>

            {/* Full range 0..n */}
            <div className="mn-panel">
                <div className="mn-panel-label">Full range 0..{n} (expected)</div>
                <div className="mn-arr">
                    {full.map(v => {
                        const present = numSet.has(v);
                        const isMissing = step?.result === v;
                        return (
                            <motion.div key={v} className={`mn-cell full ${present ? "present" : "missing"} ${isMissing ? "found" : ""}`}
                                animate={{ scale: isMissing ? 1.2 : 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                                {v}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Input array */}
            <div className="mn-panel">
                <div className="mn-panel-label">Input nums</div>
                <div className="mn-arr">
                    {ex.nums.map((v, i) => {
                        const isCur = step?.cur === i;
                        return (
                            <motion.div key={i} className={`mn-cell ${isCur ? "cur" : ""}`}
                                animate={{ scale: isCur ? 1.12 : 1, y: isCur ? -4 : 0 }}
                                transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                                {v}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Gauss trackers */}
            <div className="mn-trackers">
                <div className="mn-tracker">
                    <span className="mn-tracker-label">expected (Gauss)</span>
                    <span className="mn-tracker-val">{step?.expected ?? "?"}</span>
                </div>
                <div className="mn-tracker">
                    <span className="mn-tracker-label">actual sum</span>
                    <motion.span key={step?.runSum} className="mn-tracker-val"
                        initial={{ scale: 1.3, color: "#fab387" }} animate={{ scale: 1, color: "#cdd6f4" }}>
                        {step?.runSum ?? 0}
                    </motion.span>
                </div>
                <div className="mn-tracker result-tracker">
                    <span className="mn-tracker-label">missing</span>
                    <motion.span key={step?.result} className="mn-tracker-val result-val">
                        {step?.result != null ? step.result : "?"}
                    </motion.span>
                </div>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="mn-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={e => setSpeed(Number(e.target.value))}
            />
        </div>
    );
}
