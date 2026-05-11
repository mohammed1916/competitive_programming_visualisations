import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./GenerateParenthesesVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def generateParenthesis(n):" },
    { line: 2, text: "    res = []" },
    { line: 3, text: "    def backtrack(s, open, close):" },
    { line: 4, text: "        if len(s) == 2*n:" },
    { line: 5, text: "            res.append(s)" },
    { line: 6, text: "            return" },
    { line: 7, text: "        if open < n:" },
    { line: 8, text: "            backtrack(s+'(', open+1, close)" },
    { line: 9, text: "        if close < open:" },
    { line: 10, text: "            backtrack(s+')', open, close+1)" },
    { line: 11, text: "    backtrack('', 0, 0)" },
    { line: 12, text: "    return res" },
];

function generateSteps(n) {
    const steps = [];
    const res = [];

    function backtrack(s, open, close) {
        if (s.length === 2 * n) {
            res.push(s);
            steps.push({
                phase: "record", activeLine: 5,
                s, open, close, res: [...res],
                message: `Complete: "${s}"`,
            });
            return;
        }

        if (open < n) {
            steps.push({
                phase: "add_open", activeLine: 8,
                s, open, close, res: [...res],
                message: `open(${open}) < n(${n}) — add '(' → "${s + "("}"`,
            });
            backtrack(s + "(", open + 1, close);
        }

        if (close < open) {
            steps.push({
                phase: "add_close", activeLine: 10,
                s, open, close, res: [...res],
                message: `close(${close}) < open(${open}) — add ')' → "${s + ")"}"`,
            });
            backtrack(s + ")", open, close + 1);
        }
    }

    steps.push({ phase: "init", activeLine: 11, s: "", open: 0, close: 0, res: [], message: `Start backtracking for n=${n}` });
    backtrack("", 0, 0);
    steps.push({ phase: "done", activeLine: 12, s: "", open: n, close: n, res: [...res], message: `Done. ${res.length} combinations.` });
    return steps;
}

const EXAMPLES = [
    { label: "n=1", n: 1 }, { label: "n=2", n: 2 }, { label: "n=3", n: 3 }, { label: "n=4", n: 4 },
];

export default function GenerateParenthesesVisualizer() {
    const [n, setN] = useState(3);

    const steps = useMemo(() => generateSteps(n), [n]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;

    const applyExample = useCallback(
        (ex) => { setN(ex.n); handleReset(); },
        [handleReset]
    );

    const s = step?.s ?? "";

    return (
        <div className="gp-shell">
            <div className="gp-controls-row">
                <div className="gp-examples">
                    {EXAMPLES.map((ex) => (
                        <button key={ex.label} className={`gp-chip ${n === ex.n ? "active" : ""}`}
                            onClick={() => applyExample(ex)}>{ex.label}</button>
                    ))}
                </div>
                <span className="gp-n-display">n = {n}</span>
            </div>

            {/* Current string being built */}
            <div className="gp-panel">
                <div className="gp-panel-label">
                    Current string &nbsp;|&nbsp; open={step?.open ?? 0} &nbsp;|&nbsp; close={step?.close ?? 0}
                </div>
                <div className="gp-str-row">
                    {s.split("").map((c, i) => (
                        <motion.div key={i}
                            className={`gp-char ${c === "(" ? "open" : "close"} ${i === s.length - 1 && step?.phase !== "record" ? "new" : ""}`}
                            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                            {c}
                        </motion.div>
                    ))}
                    {s.length === 0 && <span className="gp-empty-str">""</span>}
                </div>
            </div>

            {/* Results */}
            <div className="gp-panel">
                <div className="gp-panel-label">Results ({step?.res?.length ?? 0})</div>
                <div className="gp-res-grid">
                    <AnimatePresence mode="popLayout">
                        {(step?.res ?? []).map((combo, i) => (
                            <motion.div key={combo}
                                className={`gp-res-item ${i === (step?.res?.length ?? 0) - 1 && step?.phase === "record" ? "latest" : ""}`}
                                initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                transition={{ type: "spring", stiffness: 380, damping: 24 }}>
                                {combo}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="gp-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
            />
        </div>
    );
}
