import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./SortColorsVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def sortColors(nums):" },
    { line: 2, text: "    lo, mid, hi = 0, 0, len(nums)-1" },
    { line: 3, text: "    while mid <= hi:" },
    { line: 4, text: "        if nums[mid] == 0:" },
    { line: 5, text: "            nums[lo], nums[mid] = nums[mid], nums[lo]" },
    { line: 6, text: "            lo += 1; mid += 1" },
    { line: 7, text: "        elif nums[mid] == 1:" },
    { line: 8, text: "            mid += 1" },
    { line: 9, text: "        else:  # nums[mid] == 2" },
    { line: 10, text: "            nums[mid], nums[hi] = nums[hi], nums[mid]" },
    { line: 11, text: "            hi -= 1" },
];

const COLOR_LABEL = ["R", "W", "B"];
const COLOR_CLASS = ["red", "white", "blue"];

function generateSteps(initial) {
    const steps = [];
    const nums = [...initial];
    let lo = 0, mid = 0, hi = nums.length - 1;

    steps.push({ activeLine: 2, nums: [...nums], lo, mid, hi, message: `Dutch National Flag. lo=0, mid=0, hi=${hi}` });

    while (mid <= hi) {
        steps.push({ activeLine: 3, nums: [...nums], lo, mid, hi, message: `mid=${mid} ≤ hi=${hi}. nums[mid]=${nums[mid]}` });

        if (nums[mid] === 0) {
            steps.push({ activeLine: 4, nums: [...nums], lo, mid, hi, message: `nums[mid]=0 → swap with lo=${lo}` });
            [nums[lo], nums[mid]] = [nums[mid], nums[lo]];
            lo++; mid++;
            steps.push({ activeLine: 6, nums: [...nums], lo, mid, hi, message: `After swap. lo=${lo}, mid=${mid}` });
        } else if (nums[mid] === 1) {
            steps.push({ activeLine: 7, nums: [...nums], lo, mid, hi, message: `nums[mid]=1 → already white, mid++` });
            mid++;
        } else {
            steps.push({ activeLine: 9, nums: [...nums], lo, mid, hi, message: `nums[mid]=2 → swap with hi=${hi}` });
            [nums[mid], nums[hi]] = [nums[hi], nums[mid]];
            hi--;
            steps.push({ activeLine: 11, nums: [...nums], lo, mid, hi, message: `After swap. hi=${hi} (don't move mid yet)` });
        }
    }

    steps.push({ activeLine: 11, nums: [...nums], lo, mid, hi, message: `Done! Sorted: [${nums.join(",")}]` });
    return steps;
}

const EXAMPLES = [
    { label: "[2,0,2,1,1,0]", nums: [2, 0, 2, 1, 1, 0] },
    { label: "[2,0,1]", nums: [2, 0, 1] },
    { label: "[1,2,0,1,2,0,1]", nums: [1, 2, 0, 1, 2, 0, 1] },
];

export default function SortColorsVisualizer() {
    const [sel, setSel] = useState(0);

    const initial = EXAMPLES[sel].nums;
    const steps = useMemo(() => generateSteps(initial), [initial]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : steps[0];

    const applyExample = useCallback((i) => { setSel(i); handleReset(); }, [handleReset]);

    const nums = step?.nums ?? initial;
    const lo = step?.lo ?? 0, mid = step?.mid ?? 0, hi = step?.hi ?? (nums.length - 1);

    return (
        <div className="sc-shell">
            <div className="sc-controls-row">
                <div className="sc-examples">
                    {EXAMPLES.map((ex, i) => (
                        <button key={ex.label} className={`sc-chip ${sel === i ? "active" : ""}`} onClick={() => applyExample(i)}>{ex.label}</button>
                    ))}
                </div>
            </div>

            <div className="sc-panel">
                <div className="sc-panel-label">Array — lo={lo} mid={mid} hi={hi}</div>
                <div className="sc-cells-row">
                    {nums.map((v, i) => (
                        <div key={i} className="sc-cell-wrap">
                            <motion.div
                                className={`sc-cell ${COLOR_CLASS[v]} ${i === mid ? "ptr-mid" : ""} ${i === lo ? "ptr-lo" : ""} ${i === hi ? "ptr-hi" : ""}`}
                                animate={{ scale: i === mid ? 1.18 : 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                                {COLOR_LABEL[v]}
                            </motion.div>
                            <div className="sc-ptrs-below">
                                {i === lo && <span className="sc-ptr lo">lo</span>}
                                {i === mid && <span className="sc-ptr mid">mid</span>}
                                {i === hi && <span className="sc-ptr hi">hi</span>}
                            </div>
                        </div>
                    ))}
                </div>
                {/* Legend */}
                <div className="sc-legend">
                    <span className="sc-leg red">0=Red</span>
                    <span className="sc-leg white">1=White</span>
                    <span className="sc-leg blue">2=Blue</span>
                </div>
            </div>

            {/* Regions */}
            <div className="sc-regions-row">
                <div className="sc-region red-region"><span>{lo} reds sorted</span></div>
                <div className="sc-region white-region"><span>{mid - lo} whites sorted</span></div>
                <div className="sc-region unknown-region"><span>{hi - mid + 1 > 0 ? hi - mid + 1 : 0} unknown</span></div>
                <div className="sc-region blue-region"><span>{nums.length - 1 - hi} blues sorted</span></div>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="sc-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex <= 0} nextDisabled={isDone} resetDisabled={stepIndex <= 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
            />
        </div>
    );
}
