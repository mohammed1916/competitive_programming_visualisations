import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./DecodeStringVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def decodeString(s):" },
    { line: 2, text: "    stack = []  # (count, current_str)" },
    { line: 3, text: "    cur = ''; k = 0" },
    { line: 4, text: "    for c in s:" },
    { line: 5, text: "        if c.isdigit():" },
    { line: 6, text: "            k = k * 10 + int(c)" },
    { line: 7, text: "        elif c == '[':" },
    { line: 8, text: "            stack.append((k, cur))" },
    { line: 9, text: "            cur = ''; k = 0" },
    { line: 10, text: "        elif c == ']':" },
    { line: 11, text: "            k, prev = stack.pop()" },
    { line: 12, text: "            cur = prev + cur * k" },
    { line: 13, text: "        else:" },
    { line: 14, text: "            cur += c" },
    { line: 15, text: "    return cur" },
];

function generateSteps(s) {
    const steps = [];
    const stack = []; // [{k, prev}]
    let cur = "", k = 0;

    steps.push({ activeLine: 3, ci: -1, cur, k, stack: [], message: `Start. s="${s}"` });

    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (/\d/.test(c)) {
            k = k * 10 + parseInt(c, 10);
            steps.push({ activeLine: 6, ci: i, cur, k, stack: [...stack], c, message: `Digit '${c}': k=${k}` });
        } else if (c === "[") {
            stack.push({ k, prev: cur });
            steps.push({ activeLine: 8, ci: i, cur, k, stack: [...stack], c, message: `'[': push (k=${k}, cur="${cur}"). Reset cur, k.` });
            cur = ""; k = 0;
        } else if (c === "]") {
            const { k: pk, prev } = stack.pop();
            const repeated = cur.repeat(pk);
            cur = prev + repeated;
            steps.push({ activeLine: 12, ci: i, cur, k, stack: [...stack], c, message: `']': pop k=${pk}, prev="${prev}". cur="${prev}"+"${repeated}"="${cur}"` });
        } else {
            cur += c;
            steps.push({ activeLine: 14, ci: i, cur, k, stack: [...stack], c, message: `Letter '${c}': cur="${cur}"` });
        }
    }

    steps.push({ activeLine: 15, ci: s.length, cur, k, stack: [], message: `Done! Result: "${cur}"` });
    return steps;
}

const EXAMPLES = [
    { label: '"3[a]2[bc]"', s: "3[a]2[bc]" },
    { label: '"3[a2[c]]"', s: "3[a2[c]]" },
    { label: '"2[abc]3[cd]ef"', s: "2[abc]3[cd]ef" },
];

export default function DecodeStringVisualizer() {
    const [sInput, setSInput] = useState("3[a]2[bc]");
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

    const steps = useMemo(() => { try { return generateSteps(sInput); } catch { return []; } }, [sInput]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;

    const applyExample = useCallback((ex) => { setSInput(ex.s); handleReset(); }, [handleReset]);

    return (
        <div className="ds-shell">
            <div className="ds-controls-row">
                <div className="ds-examples">
                    {EXAMPLES.map((ex) => (
                        <button key={ex.label} className="ds-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                    ))}
                </div>
                <input className="ds-input" value={sInput}
                    onChange={(e) => { setSInput(e.target.value); handleReset(); }} placeholder="encoded string" />
            </div>

            {/* Character-by-character display */}
            <div className="ds-panel">
                <div className="ds-panel-label">Input string</div>
                <div className="ds-chars-row">
                    {sInput.split("").map((ch, i) => {
                        const isCur = step?.ci === i;
                        const type = /\d/.test(ch) ? "digit" : ch === "[" ? "open" : ch === "]" ? "close" : "letter";
                        return (
                            <motion.div key={i} className={`ds-ch ${type} ${isCur ? "current" : ""}`}
                                animate={{ scale: isCur ? 1.25 : 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                                {ch}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Stack */}
            <div className="ds-panel">
                <div className="ds-panel-label">Stack (top on right)</div>
                <div className="ds-stack-row">
                    <AnimatePresence mode="popLayout">
                        {(step?.stack ?? []).map((item, i) => (
                            <motion.div key={`${i}-${item.k}-${item.prev}`} className={`ds-stack-item ${i === (step.stack.length - 1) ? "top" : ""}`}
                                initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
                                transition={{ type: "spring", stiffness: 350, damping: 22 }}>
                                <span className="ds-stack-k">k={item.k}</span>
                                <span className="ds-stack-prev">"{item.prev}"</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {(step?.stack?.length ?? 0) === 0 && <span className="ds-empty">empty</span>}
                </div>
            </div>

            {/* cur and k */}
            <div className="ds-state-row">
                <div className="ds-state-box">
                    <span className="ds-state-label">cur</span>
                    <span className="ds-state-val">"{step?.cur ?? ""}"</span>
                </div>
                <div className="ds-state-box">
                    <span className="ds-state-label">k</span>
                    <span className="ds-state-val">{step?.k ?? 0}</span>
                </div>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className="ds-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
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
