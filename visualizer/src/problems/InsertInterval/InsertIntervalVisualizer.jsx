import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./InsertIntervalVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def insert(intervals, newInterval):" },
    { line: 2, text: "    res = []" },
    { line: 3, text: "    for i, (s, e) in enumerate(intervals):" },
    { line: 4, text: "        if newInterval[1] < s:" },
    { line: 5, text: "            res.append(newInterval)" },
    { line: 6, text: "            return res + intervals[i:]" },
    { line: 7, text: "        elif e < newInterval[0]:" },
    { line: 8, text: "            res.append([s, e])" },
    { line: 9, text: "        else:  # overlap" },
    { line: 10, text: "            newInterval[0] = min(newInterval[0], s)" },
    { line: 11, text: "            newInterval[1] = max(newInterval[1], e)" },
    { line: 12, text: "    res.append(newInterval)" },
    { line: 13, text: "    return res" },
];

function generateSteps(intervals, newInterval) {
    const steps = [];
    const res = [];
    let ni = [...newInterval];

    steps.push({ activeLine: 2, res: [], ni: [...ni], ci: -1, phase: "init", message: `Insert [${ni}] into ${intervals.length} intervals.` });

    for (let i = 0; i < intervals.length; i++) {
        const [s, e] = intervals[i];
        steps.push({ activeLine: 3, res: [...res], ni: [...ni], ci: i, phase: "check", message: `Check interval [${s},${e}]` });

        if (ni[1] < s) {
            steps.push({ activeLine: 4, res: [...res], ni: [...ni], ci: i, phase: "before", message: `new [${ni}] ends before [${s},${e}] starts → insert new, then append rest` });
            res.push([...ni]);
            const result = [...res, ...intervals.slice(i)];
            steps.push({ activeLine: 6, res: result, ni: [...ni], ci: i, phase: "done_early", message: `Done: ${result.map((x) => `[${x}]`).join(", ")}` });
            return steps;
        } else if (e < ni[0]) {
            steps.push({ activeLine: 7, res: [...res], ni: [...ni], ci: i, phase: "after", message: `[${s},${e}] ends before new [${ni}] starts → append [${s},${e}]` });
            res.push([s, e]);
        } else {
            const prev = [...ni];
            ni[0] = Math.min(ni[0], s);
            ni[1] = Math.max(ni[1], e);
            steps.push({ activeLine: 10, res: [...res], ni: [...ni], ci: i, phase: "merge", message: `Overlap: merge [${prev}] with [${s},${e}] → [${ni}]` });
        }
    }

    res.push([...ni]);
    steps.push({ activeLine: 12, res: [...res], ni: [...ni], ci: -1, phase: "done", message: `Append remaining new: [${ni}]. Result: ${res.map((x) => `[${x}]`).join(", ")}` });
    return steps;
}

const EXAMPLES = [
    { label: "Ex1", intervals: [[1, 3], [6, 9]], newInterval: [2, 5] },
    { label: "Ex2", intervals: [[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], newInterval: [4, 8] },
    { label: "Ex3", intervals: [[1, 5]], newInterval: [2, 3] },
    { label: "Ex4", intervals: [[1, 5]], newInterval: [6, 8] },
];

const BAR_SCALE = 14; // px per unit

export default function InsertIntervalVisualizer() {
    const [sel, setSel] = useState(0);
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

    const { intervals, newInterval } = EXAMPLES[sel];
    const steps = useMemo(() => generateSteps(intervals, newInterval), [intervals, newInterval]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : steps[0];

    const applyExample = useCallback((i) => { setSel(i); handleReset(); }, [handleReset]);

    const res = step?.res ?? [];
    const ni = step?.ni ?? newInterval;
    const ci = step?.ci ?? -1;

    const allIntervals = [...intervals];
    const maxVal = Math.max(...allIntervals.flat(), ...newInterval) + 1;

    return (
        <div className="ii-shell">
            <div className="ii-controls-row">
                <div className="ii-examples">
                    {EXAMPLES.map((ex, i) => (
                        <button key={ex.label} className={`ii-chip ${sel === i ? "active" : ""}`} onClick={() => applyExample(i)}>
                            {ex.label}
                        </button>
                    ))}
                </div>
                <span className="ii-new-tag">new = [{newInterval.join(",")}]</span>
            </div>

            {/* Input intervals */}
            <div className="ii-panel">
                <div className="ii-panel-label">Input intervals</div>
                <div className="ii-bars-col">
                    {intervals.map(([s, e], i) => (
                        <div key={i} className="ii-bar-row">
                            <span className="ii-bar-idx">[{i}]</span>
                            <div className="ii-bar-track" style={{ width: maxVal * BAR_SCALE }}>
                                <motion.div
                                    className={`ii-bar interval ${i === ci ? "active" : ""} ${step?.phase === "after" && i < ci ? "done" : ""}`}
                                    style={{ left: s * BAR_SCALE, width: (e - s) * BAR_SCALE }}
                                    animate={{ scale: i === ci ? 1.05 : 1 }}
                                    transition={{ type: "spring", stiffness: 380, damping: 22 }}>
                                    [{s},{e}]
                                </motion.div>
                            </div>
                        </div>
                    ))}
                    {/* New interval */}
                    <div className="ii-bar-row">
                        <span className="ii-bar-idx new">new</span>
                        <div className="ii-bar-track" style={{ width: maxVal * BAR_SCALE }}>
                            <motion.div
                                className="ii-bar new-iv"
                                style={{ left: ni[0] * BAR_SCALE, width: Math.max((ni[1] - ni[0]) * BAR_SCALE, 24) }}
                                layout transition={{ type: "spring", stiffness: 280, damping: 20 }}>
                                [{ni[0]},{ni[1]}]
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Result */}
            {res.length > 0 && (
                <div className="ii-panel">
                    <div className="ii-panel-label">Result</div>
                    <div className="ii-bars-col">
                        <div className="ii-bar-row">
                            <span className="ii-bar-idx"> </span>
                            <div className="ii-bar-track" style={{ width: maxVal * BAR_SCALE }}>
                                <AnimatePresence>
                                    {res.map(([s, e], i) => (
                                        <motion.div key={`${s}-${e}-${i}`}
                                            className="ii-bar result"
                                            style={{ left: s * BAR_SCALE, width: Math.max((e - s) * BAR_SCALE, 24) }}
                                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                                            [{s},{e}]
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className="ii-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex <= 0} nextDisabled={isDone} resetDisabled={stepIndex <= 0}
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
