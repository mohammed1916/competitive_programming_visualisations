import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./BurstBalloonsVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def maxCoins(nums):" },
    { line: 2, text: "    nums = [1] + nums + [1]" },
    { line: 3, text: "    n = len(nums)" },
    { line: 4, text: "    dp = [[0]*n for _ in range(n)]" },
    { line: 5, text: "    for length in range(2, n):" },
    { line: 6, text: "        for left in range(0, n-length):" },
    { line: 7, text: "            right = left + length" },
    { line: 8, text: "            for k in range(left+1, right):" },
    { line: 9, text: "                coins = nums[left]*nums[k]*nums[right]" },
    { line: 10, text: "                val = dp[left][k] + coins + dp[k][right]" },
    { line: 11, text: "                dp[left][right] = max(dp[left][right], val)" },
    { line: 12, text: "    return dp[0][n-1]" },
];

const EXAMPLES = [
    { label: "Ex 1", nums: [3, 1, 5, 8] },
    { label: "Ex 2", nums: [1, 5] },
    { label: "Ex 3", nums: [2, 4, 3] },
];

function generateSteps(numsOrig) {
    const nums = [1, ...numsOrig, 1];
    const n = nums.length;
    const dp = Array.from({ length: n }, () => Array(n).fill(0));
    const steps = [];

    steps.push({ activeLine: 4, dp: dp.map(r => [...r]), left: -1, right: -1, k: -1, phase: "init", message: `Padded nums = [${nums.join(", ")}], dp is ${n}×${n}` });

    for (let length = 2; length < n; length++) {
        for (let left = 0; left < n - length; left++) {
            const right = left + length;
            for (let k = left + 1; k < right; k++) {
                const coins = nums[left] * nums[k] * nums[right];
                const val = dp[left][k] + coins + dp[k][right];
                const improved = val > dp[left][right];
                if (improved) dp[left][right] = val;
                steps.push({
                    activeLine: improved ? 11 : 10,
                    dp: dp.map(r => [...r]), left, right, k, coins, val, phase: "fill",
                    message: `dp[${left}][${right}]: k=${k}, ${nums[left]}×${nums[k]}×${nums[right]}=${coins}, total=${val}${improved ? ` → dp[${left}][${right}]=${dp[left][right]}` : ""}`,
                });
            }
        }
    }

    steps.push({ activeLine: 12, dp: dp.map(r => [...r]), left: 0, right: n - 1, k: -1, phase: "done", done: true, message: `Max coins = dp[0][${n - 1}] = ${dp[0][n - 1]}` });
    return steps;
}

export default function BurstBalloonsVisualizer() {
    const [ex, setEx] = useState(EXAMPLES[0]);
    const steps = useMemo(() => generateSteps(ex.nums), [ex]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

    const nums = [1, ...ex.nums, 1];
    const n = nums.length;
    const dp = step?.dp ?? Array.from({ length: n }, () => Array(n).fill(0));
    const activeL = step?.left ?? -1;
    const activeR = step?.right ?? -1;
    const activeK = step?.k ?? -1;

    return (
        <div className="bb-shell">
            <div className="bb-examples">
                {EXAMPLES.map(e => (
                    <button key={e.label} className={`bb-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
                        {e.label}
                    </button>
                ))}
            </div>

            <div className="bb-panel">
                <div className="bb-panel-label">Padded nums</div>
                <div className="bb-nums">
                    {nums.map((v, i) => (
                        <div key={i} className={`bb-num ${i === 0 || i === n - 1 ? "sentinel" : ""} ${i === activeK ? "pivot" : ""}`}>
                            <span className="bb-idx">{i}</span>
                            <span className="bb-val">{v}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bb-panel">
                <div className="bb-panel-label">DP table (interval [left, right])</div>
                <div className="bb-table-wrap">
                    <table className="bb-table">
                        <thead>
                            <tr>
                                <th></th>
                                {Array.from({ length: n }, (_, c) => <th key={c}>{c}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {dp.slice(0, n).map((row, r) => (
                                <tr key={r}>
                                    <th>{r}</th>
                                    {row.slice(0, n).map((v, c) => {
                                        const isActive = r === activeL && c === activeR;
                                        const isK = r === activeL && c === activeK || c === activeR && r === activeK;
                                        return (
                                            <motion.td key={c}
                                                className={`bb-td ${isActive ? "active-cell" : isK ? "k-cell" : v > 0 ? "filled" : ""}`}
                                                animate={{ scale: isActive ? 1.15 : 1 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                                                {v || "·"}
                                            </motion.td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bb-trackers">
                <div className="bb-tracker">
                    <span className="bb-tracker-label">Window</span>
                    <span className="bb-tracker-val">[{activeL},{activeR}]</span>
                </div>
                <div className="bb-tracker">
                    <span className="bb-tracker-label">k (pivot)</span>
                    <span className="bb-tracker-val">{activeK >= 0 ? activeK : "—"}</span>
                </div>
                <div className="bb-tracker">
                    <span className="bb-tracker-label">coins</span>
                    <span className="bb-tracker-val bb-coins">{step?.coins ?? "—"}</span>
                </div>
                <div className="bb-tracker">
                    <span className="bb-tracker-label">val</span>
                    <span className="bb-tracker-val bb-val-v">{step?.val ?? "—"}</span>
                </div>
            </div>

            {step?.done && <div className="bb-result">✓ Max coins = {dp[0]?.[n - 1]}</div>}

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className="bb-status">{step?.message ?? "Press Play to begin."}</div>
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
