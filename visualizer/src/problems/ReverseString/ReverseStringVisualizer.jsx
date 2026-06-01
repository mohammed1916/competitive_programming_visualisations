import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { useCodeVisualConnectivity } from "../../hooks/useCodeVisualConnectivity";
import "./ReverseStringVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def reverseString(s):" },
    { line: 2, text: "    l, r = 0, len(s) - 1" },
    { line: 3, text: "    while l < r:" },
    { line: 4, text: "        s[l], s[r] = s[r], s[l]" },
    { line: 5, text: "        l += 1" },
    { line: 6, text: "        r -= 1" },
];

const EXAMPLES = [
    { label: "Ex 1", s: ["h", "e", "l", "l", "o"] },
    { label: "Ex 2", s: ["H", "a", "n", "n", "a", "h"] },
    { label: "Ex 3", s: ["a", "b", "c", "d", "e", "f"] },
];

function generateSteps(sIn) {
    const steps = [];
    const arr = [...sIn];
    let l = 0, r = arr.length - 1;
    steps.push({ activeLine: 2, arr: [...arr], l, r, message: `Init: l=${l}, r=${r}` });
    while (l < r) {
        steps.push({ activeLine: 3, arr: [...arr], l, r, message: `l=${l} < r=${r}: swap s[${l}]='${arr[l]}' ↔ s[${r}]='${arr[r]}'` });
        [arr[l], arr[r]] = [arr[r], arr[l]];
        steps.push({ activeLine: 4, arr: [...arr], l, r, message: `Swapped → [${arr.map(c => `'${c}'`).join(", ")}]` });
        l++; r--;
        steps.push({ activeLine: 6, arr: [...arr], l, r, message: `Advance: l=${l}, r=${r}` });
    }
    steps.push({ activeLine: 3, arr: [...arr], l, r, done: true, message: `l=${l} ≥ r=${r}: done → [${arr.join("")}]` });
    return steps;
}

export default function ReverseStringVisualizer() {
    const [ex, setEx] = useState(EXAMPLES[0]);
    const steps = useMemo(
        () =>
            generateSteps(ex.s).map((current) => ({
                ...current,
                relatedLines: current.relatedLines ?? (current.activeLine != null ? [current.activeLine] : []),
            })),
        [ex]
    );
    const { stepIndex, setStepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
    const connectivity = useCodeVisualConnectivity({
        steps,
        stepIndex,
        onStepJump: setStepIndex,
    });

    const arr = step?.arr ?? ex.s;
    const l = step?.l ?? 0;
    const r = step?.r ?? (ex.s.length - 1);

    return (
        <div className="rs-shell">
            <div className="rs-examples">
                {EXAMPLES.map(e => (
                    <button key={e.label} className={`rs-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
                        {e.label}: [{e.s.join("")}]
                    </button>
                ))}
            </div>

            <div className="rs-panel">
                <div className="rs-panel-label">Character Array</div>
                <div className="rs-arr">
                    {arr.map((ch, idx) => {
                        const isL = idx === l && !step?.done;
                        const isR = idx === r && !step?.done;
                        const inRange = idx >= l && idx <= r && !step?.done;
                        return (
                            <div key={idx} className="rs-cell-col">
                                <motion.div
                                    className={`rs-cell ${isL ? "l-cell" : ""} ${isR ? "r-cell" : ""} ${!isL && !isR && inRange ? "range-cell" : ""}`}
                                    animate={{ scale: (isL || isR) ? 1.18 : 1, y: isL ? -6 : isR ? -6 : 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                >
                                    {ch}
                                </motion.div>
                                <div className="rs-idx">{idx}</div>
                                <div className="rs-ptrs">
                                    {isL && <span className="rs-ptr l-ptr">L</span>}
                                    {isR && <span className="rs-ptr r-ptr">R</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="rs-trackers">
                <div className="rs-tracker">
                    <span className="rs-tracker-label">l</span>
                    <span className="rs-tracker-val" style={{ color: "#89b4fa" }}>{l}</span>
                </div>
                <div className="rs-tracker">
                    <span className="rs-tracker-label">r</span>
                    <span className="rs-tracker-val" style={{ color: "#f38ba8" }}>{r}</span>
                </div>
                <div className="rs-tracker">
                    <span className="rs-tracker-label">Swaps left</span>
                    <span className="rs-tracker-val">{Math.max(0, r - l + 1 > 0 ? Math.floor((r - l + 1) / 2) : 0)}</span>
                </div>
            </div>

            {step?.done && <div className="rs-result">✓ Reversed: "{arr.join("")}"</div>}

            <CodeTracePanel
                step={step}
                codeLines={SOLUTION_CODE}
                highlightedLines={connectivity.highlightedLines}
                onLineSelect={connectivity.handleLineSelect}
            />
            <div className="rs-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={e => setSpeed(Number(e.target.value))}
            />
        </div>
    );
}
