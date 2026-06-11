import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./PlusOneVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def plusOne(digits):" },
    { line: 2, text: "    for i in range(len(digits)-1, -1, -1):" },
    { line: 3, text: "        if digits[i] < 9:" },
    { line: 4, text: "            digits[i] += 1" },
    { line: 5, text: "            return digits" },
    { line: 6, text: "        digits[i] = 0  # carry" },
    { line: 7, text: "    return [1] + digits  # all 9s" },
];

const EXAMPLES = [
    { label: "Ex 1", digits: [1, 2, 3], desc: "123" },
    { label: "Ex 2", digits: [4, 3, 2, 1], desc: "4321" },
    { label: "Ex 3", digits: [9], desc: "9" },
    { label: "Ex 4", digits: [9, 9, 9], desc: "999" },
];

function generateSteps(digIn) {
    const steps = [];
    const arr = [...digIn];
    steps.push({ activeLine: 1, arr: [...arr], i: -1, carry: false, message: `Start: [${arr.join(", ")}] + 1` });
    for (let i = arr.length - 1; i >= 0; i--) {
        steps.push({ activeLine: 3, arr: [...arr], i, carry: false, message: `i=${i}: digits[${i}] = ${arr[i]}` });
        if (arr[i] < 9) {
            arr[i] += 1;
            steps.push({ activeLine: 4, arr: [...arr], i, carry: false, message: `digits[${i}] < 9 → increment to ${arr[i]}` });
            steps.push({ activeLine: 5, arr: [...arr], i, carry: false, done: true, message: `Return [${arr.join(", ")}]` });
            return steps;
        }
        arr[i] = 0;
        steps.push({ activeLine: 6, arr: [...arr], i, carry: true, message: `digits[${i}] = 9 → set to 0, carry` });
    }
    const result = [1, ...arr];
    steps.push({ activeLine: 7, arr: result, i: -1, carry: false, done: true, message: `All digits were 9 → prepend 1: [${result.join(", ")}]` });
    return steps;
}

export default function PlusOneVisualizer() {
    const [ex, setEx] = useState(EXAMPLES[0]);
    const steps = useMemo(() => generateSteps(ex.digits), [ex]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

    const arr = step?.arr ?? ex.digits;
    const activeI = step?.i ?? -1;
    const carry = step?.carry ?? false;

    return (
        <div className="po-shell">
            <div className="po-examples">
                {EXAMPLES.map(e => (
                    <button key={e.label} className={`po-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
                        {e.label}: {e.desc}
                    </button>
                ))}
            </div>

            <div className="po-panel">
                <div className="po-panel-label">Digits Array</div>
                <div className="po-arr">
                    <AnimatePresence>
                        {arr.map((d, idx) => {
                            const isActive = idx === activeI;
                            const isNew = idx === 0 && arr.length > ex.digits.length;
                            return (
                                <motion.div
                                    key={`${idx}-${d}`}
                                    className="po-cell-col"
                                    initial={isNew ? { opacity: 0, x: -20 } : false}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                                >
                                    <motion.div
                                        className={`po-cell ${isActive ? (carry ? "carry" : "inc") : ""} ${isNew ? "new-cell" : ""}`}
                                        animate={{ scale: isActive ? 1.15 : 1, y: isActive ? -5 : 0 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                    >
                                        {d}
                                    </motion.div>
                                    <div className="po-idx">{idx}</div>
                                    {isActive && <div className={`po-ptr ${carry ? "carry-ptr" : "inc-ptr"}`}>{carry ? "carry" : "i"}</div>}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            <div className="po-trackers">
                <div className="po-tracker">
                    <span className="po-tracker-label">Index i</span>
                    <span className="po-tracker-val">{activeI < 0 ? "—" : activeI}</span>
                </div>
                <div className="po-tracker">
                    <span className="po-tracker-label">Carry</span>
                    <motion.span key={String(carry)} className={`po-tracker-val ${carry ? "carry-val" : ""}`}
                        initial={{ scale: 1.3 }} animate={{ scale: 1 }}>
                        {carry ? "Yes" : "No"}
                    </motion.span>
                </div>
            </div>

            {step?.done && <div className="po-result">✓ Result: [{arr.join(", ")}] = {arr.join("")}</div>}

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className="po-status">{step?.message ?? "Press Play to begin."}</div>
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
