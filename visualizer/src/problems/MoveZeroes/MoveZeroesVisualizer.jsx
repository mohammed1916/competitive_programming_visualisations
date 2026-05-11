import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./MoveZeroesVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def moveZeroes(nums):" },
    { line: 2, text: "    k = 0  # next write position for non-zero" },
    { line: 3, text: "    for i in range(len(nums)):" },
    { line: 4, text: "        if nums[i] != 0:" },
    { line: 5, text: "            nums[k], nums[i] = nums[i], nums[k]" },
    { line: 6, text: "            k += 1" },
];

const EXAMPLES = [
    { label: "Ex 1", nums: [0, 1, 0, 3, 12] },
    { label: "Ex 2", nums: [0, 0, 1] },
    { label: "Ex 3", nums: [1, 0, 2, 0, 0, 4, 5] },
];

function generateSteps(numsIn) {
    const steps = [];
    const arr = [...numsIn];
    let k = 0;
    steps.push({ activeLine: 2, arr: [...arr], k, i: -1, message: "Init k=0 (write pointer)" });
    for (let i = 0; i < arr.length; i++) {
        steps.push({ activeLine: 4, arr: [...arr], k, i, message: `i=${i}: nums[${i}]=${arr[i]} ${arr[i] !== 0 ? "≠ 0" : "== 0, skip"}` });
        if (arr[i] !== 0) {
            [arr[k], arr[i]] = [arr[i], arr[k]];
            steps.push({ activeLine: 5, arr: [...arr], k, i, message: `Swap nums[${k}] ↔ nums[${i}] → [${arr.join(", ")}]` });
            k++;
            steps.push({ activeLine: 6, arr: [...arr], k, i, message: `k++ → k=${k}` });
        }
    }
    steps.push({ activeLine: 1, arr: [...arr], k, i: -1, done: true, message: `Done: [${arr.join(", ")}]` });
    return steps;
}

export default function MoveZeroesVisualizer() {
    const [ex, setEx] = useState(EXAMPLES[0]);
    const steps = useMemo(() => generateSteps(ex.nums), [ex]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

    const arr = step?.arr ?? ex.nums;
    const k = step?.k ?? 0;
    const i = step?.i ?? -1;

    return (
        <div className="mz-shell">
            <div className="mz-examples">
                {EXAMPLES.map(e => (
                    <button key={e.label} className={`mz-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>{e.label}</button>
                ))}
            </div>

            <div className="mz-panel">
                <div className="mz-panel-label">Array (in-place)</div>
                <div className="mz-arr">
                    {arr.map((v, idx) => {
                        const isI = idx === i;
                        const isK = idx === k;
                        const isZero = v === 0;
                        const isDone = step?.done;
                        return (
                            <div key={idx} className="mz-cell-col">
                                <motion.div
                                    className={`mz-cell ${isI ? "i-cell" : ""} ${isK && !isI ? "k-cell" : ""} ${isZero && !isI && !isK ? "zero" : ""}`}
                                    animate={{ scale: (isI || isK) ? 1.12 : 1, y: isI ? -5 : 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                                    {v}
                                </motion.div>
                                <div className="mz-idx">{idx}</div>
                                <div className="mz-ptrs">
                                    {isI && <span className="mz-ptr i">i</span>}
                                    {isK && <span className="mz-ptr k">k</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mz-trackers">
                <div className="mz-tracker"><span className="mz-tracker-label">k</span>
                    <motion.span key={k} className="mz-tracker-val" initial={{ scale: 1.3 }} animate={{ scale: 1 }}>{k}</motion.span>
                </div>
                <div className="mz-tracker"><span className="mz-tracker-label">i</span>
                    <span className="mz-tracker-val">{i < 0 ? "-" : i}</span>
                </div>
            </div>

            {step?.done && (
                <div className="mz-result">✓ Zeroes moved to end: [{arr.join(", ")}]</div>
            )}

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="mz-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={e => setSpeed(Number(e.target.value))}
            />
        </div>
    );
}
