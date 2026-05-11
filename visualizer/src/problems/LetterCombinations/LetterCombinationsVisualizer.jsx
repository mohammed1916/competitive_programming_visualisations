import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./LetterCombinationsVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def letterCombinations(digits):" },
    { line: 2, text: "    if not digits: return []" },
    { line: 3, text: "    phone = {'2':'abc','3':'def','4':'ghi'," },
    { line: 4, text: "             '5':'jkl','6':'mno','7':'pqrs'," },
    { line: 5, text: "             '8':'tuv','9':'wxyz'}" },
    { line: 6, text: "    res = []" },
    { line: 7, text: "    def backtrack(i, path):" },
    { line: 8, text: "        if i == len(digits):" },
    { line: 9, text: "            res.append(''.join(path))" },
    { line: 10, text: "            return" },
    { line: 11, text: "        for c in phone[digits[i]]:" },
    { line: 12, text: "            path.append(c)" },
    { line: 13, text: "            backtrack(i+1, path)" },
    { line: 14, text: "            path.pop()" },
    { line: 15, text: "    backtrack(0, [])" },
    { line: 16, text: "    return res" },
];

const PHONE_MAP = {
    "2": "abc", "3": "def", "4": "ghi", "5": "jkl",
    "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz",
};

function generateSteps(digits) {
    const steps = [];
    const res = [];

    function backtrack(i, path) {
        if (i === digits.length) {
            res.push(path.join(""));
            steps.push({
                phase: "record", activeLine: 9,
                i, path: [...path], res: [...res], activeChar: null, activeDigit: null,
                message: `Complete: "${path.join("")}"`,
            });
            return;
        }

        const letters = PHONE_MAP[digits[i]] ?? "";
        for (const c of letters) {
            path.push(c);
            steps.push({
                phase: "choose", activeLine: 12,
                i, path: [...path], res: [...res], activeChar: c, activeDigit: digits[i],
                message: `digit '${digits[i]}' → try '${c}', path="${path.join("")}"`,
            });
            backtrack(i + 1, path);
            path.pop();
            steps.push({
                phase: "unchoose", activeLine: 14,
                i, path: [...path], res: [...res], activeChar: c, activeDigit: digits[i],
                message: `backtrack: remove '${c}', path="${path.join("")}"`,
            });
        }
    }

    steps.push({ phase: "init", activeLine: 15, i: 0, path: [], res: [], activeChar: null, activeDigit: null, message: `Start for digits="${digits}"` });
    backtrack(0, []);
    steps.push({ phase: "done", activeLine: 16, i: digits.length, path: [], res: [...res], activeChar: null, activeDigit: null, message: `Done. ${res.length} combinations.` });
    return steps;
}

const EXAMPLES = [
    { label: '"23"', digits: "23" },
    { label: '""', digits: "" },
    { label: '"2"', digits: "2" },
    { label: '"234"', digits: "234" },
];

export default function LetterCombinationsVisualizer() {
    const [digits, setDigits] = useState("23");

    const validDigits = useMemo(() => digits.replace(/[^2-9]/g, "").slice(0, 4), [digits]);
    const steps = useMemo(() => (validDigits.length ? generateSteps(validDigits) : []), [validDigits]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;

    const applyExample = useCallback(
        (ex) => { setDigits(ex.digits); handleReset(); },
        [handleReset]
    );

    return (
        <div className="lc-shell">
            <div className="lc-controls-row">
                <div className="lc-examples">
                    {EXAMPLES.map((ex) => (
                        <button key={ex.label} className="lc-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                    ))}
                </div>
                <input className="lc-input" value={digits}
                    onChange={(e) => { setDigits(e.target.value); handleReset(); }}
                    placeholder="digits (e.g. 23)" maxLength={4} />
            </div>

            {/* Phone keypad display */}
            <div className="lc-panel">
                <div className="lc-panel-label">Phone keypad</div>
                <div className="lc-keypad-row">
                    {Object.entries(PHONE_MAP).map(([d, letters]) => (
                        <div key={d} className={`lc-key ${step?.activeDigit === d ? "active" : ""} ${validDigits.includes(d) ? "used" : ""}`}>
                            <span className="lc-key-digit">{d}</span>
                            <span className="lc-key-letters">
                                {letters.split("").map((l) => (
                                    <span key={l} className={`lc-letter ${step?.activeChar === l && step?.activeDigit === d ? "lit" : ""}`}>{l}</span>
                                ))}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Current path */}
            <div className="lc-panel">
                <div className="lc-panel-label">Current path</div>
                <div className="lc-path-row">
                    <AnimatePresence mode="popLayout">
                        {(step?.path ?? []).map((c, i) => (
                            <motion.div key={`${i}-${c}`} className="lc-path-cell"
                                initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
                                transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                                {c}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {(step?.path?.length ?? 0) === 0 && <span className="lc-empty">empty</span>}
                </div>
            </div>

            {/* Results */}
            <div className="lc-panel">
                <div className="lc-panel-label">Results ({step?.res?.length ?? 0})</div>
                <div className="lc-res-row">
                    <AnimatePresence mode="popLayout">
                        {(step?.res ?? []).map((s, i) => (
                            <motion.div key={s}
                                className={`lc-res-item ${i === (step?.res?.length ?? 0) - 1 && step?.phase === "record" ? "latest" : ""}`}
                                initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                transition={{ type: "spring", stiffness: 380, damping: 22 }}>
                                {s}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="lc-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
            />
        </div>
    );
}
