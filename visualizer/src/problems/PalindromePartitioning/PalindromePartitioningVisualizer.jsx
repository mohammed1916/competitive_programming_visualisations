import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import DockableWorkspace from "../../components/shared/DockableWorkspace";
import FloatingPanel from "../../components/shared/FloatingPanel";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import { useAutoScroll } from "../../hooks/useAutoScroll";
import "./PalindromePartitioningVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def partition(s):" },
    { line: 2, text: "    res, part = [], []" },
    { line: 3, text: "    def backtrack(i):" },
    { line: 4, text: "        if i == len(s):" },
    { line: 5, text: "            res.append(part[:]); return" },
    { line: 6, text: "        for j in range(i, len(s)):" },
    { line: 7, text: "            sub = s[i:j+1]" },
    { line: 8, text: "            if sub == sub[::-1]:  # isPalin" },
    { line: 9, text: "                part.append(sub)" },
    { line: 10, text: "                backtrack(j+1)" },
    { line: 11, text: "                part.pop()" },
    { line: 12, text: "    backtrack(0)" },
    { line: 13, text: "    return res" },
];

function isPalin(s) { return s === s.split("").reverse().join(""); }

function generateSteps(s) {
    const steps = [];
    const res = [];
    const part = [];

    function backtrack(i) {
        if (i === s.length) {
            res.push([...part]);
            steps.push({ activeLine: 5, i, j: -1, part: [...part], res: res.map((r) => [...r]), sub: null, valid: null, message: `Complete partition: [${part.join(" | ")}]` });
            return;
        }
        for (let j = i; j < s.length; j++) {
            const sub = s.slice(i, j + 1);
            const valid = isPalin(sub);
            steps.push({ activeLine: 8, i, j, part: [...part], res: res.map((r) => [...r]), sub, valid, message: valid ? `"${sub}" is palindrome ✓` : `"${sub}" not palindrome ✗` });
            if (valid) {
                part.push(sub);
                steps.push({ activeLine: 9, i, j, part: [...part], res: res.map((r) => [...r]), sub, valid, message: `Append "${sub}". path=[${part.join(",")}]` });
                backtrack(j + 1);
                part.pop();
                steps.push({ activeLine: 11, i, j, part: [...part], res: res.map((r) => [...r]), sub, valid, message: `Backtrack: pop "${sub}". path=[${part.join(",")}]` });
            }
        }
    }

    steps.push({ activeLine: 12, i: 0, j: -1, part: [], res: [], sub: null, valid: null, message: `Start. s="${s}"` });
    backtrack(0);
    steps.push({ activeLine: 13, i: s.length, j: -1, part: [], res: res.map((r) => [...r]), sub: null, valid: null, message: `Done. ${res.length} partitions.` });
    return steps;
}

const EXAMPLES = [
    { label: '"aab"', s: "aab" },
    { label: '"a"', s: "a" },
    { label: '"racecar"', s: "racecar" },
    { label: '"aabb"', s: "aabb" },
];

export default function PalindromePartitioningVisualizer() {
    const [sInput, setSInput] = useState("aab");

    const s = sInput.replace(/[^a-z]/gi, "").slice(0, 7);
    const steps = useMemo(() => (s.length ? generateSteps(s) : []), [s]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();
    const [autoScrollCode, setAutoScrollCode] = useAutoScroll();

    const applyExample = useCallback((ex) => { setSInput(ex.s); handleReset(); }, [handleReset]);

    const i = step?.i ?? 0, j = step?.j ?? -1;

    const dockPanels = [
        {
            id: "input",
            title: "Input & Visualization",
            subtitle: "Edit the string and watch the algorithm step through.",
            defaultZone: "left",
            content: (
                <div className="pp-panel-body">
                    <div className="pp-controls-row">
                        <div className="pp-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="pp-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <input className="pp-input" value={sInput}
                            onChange={(e) => { setSInput(e.target.value); handleReset(); }} maxLength={7} placeholder="string" />
                    </div>

                    {/* String with highlight */}
                    <div className="pp-panel">
                        <div className="pp-panel-label">String — current window [{i}, {j}]</div>
                        <div className="pp-str-row">
                            {s.split("").map((ch, idx) => {
                                const inWindow = j >= 0 && idx >= i && idx <= j;
                                return (
                                    <motion.div key={idx}
                                        className={`pp-ch ${inWindow ? (step?.valid ? "palin" : "not-palin") : ""} ${idx === i ? "start" : ""}`}
                                        animate={{ scale: inWindow ? 1.12 : 1 }}
                                        transition={{ type: "spring", stiffness: 380, damping: 20 }}>
                                        {ch}
                                    </motion.div>
                                );
                            })}
                        </div>
                        {step?.sub && (
                            <div className={`pp-sub-tag ${step.valid ? "valid" : "invalid"}`}>
                                "{step.sub}" {step.valid ? "✓ palindrome" : "✗ not palindrome"}
                            </div>
                        )}
                    </div>

                    {/* Current path */}
                    <div className="pp-panel">
                        <div className="pp-panel-label">Current path</div>
                        <div className="pp-path-row">
                            {(step?.part ?? []).length === 0 && <span className="pp-empty">empty</span>}
                            {(step?.part ?? []).map((seg, idx) => (
                                <motion.div key={`${idx}-${seg}`} className="pp-seg"
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 380, damping: 22 }}>
                                    {seg}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Results */}
                    {(step?.res?.length ?? 0) > 0 && (
                        <div className="pp-panel">
                            <div className="pp-panel-label">Results ({step.res.length})</div>
                            <div className="pp-results">
                                <AnimatePresence mode="popLayout">
                                    {step.res.map((r, i) => (
                                        <motion.div key={r.join("|")}
                                            className={`pp-result-row ${i === step.res.length - 1 && step.activeLine === 5 ? "latest" : ""}`}
                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                            transition={{ type: "spring", stiffness: 320, damping: 22 }}>
                                            [{r.map((seg, si) => <span key={si} className="pp-res-seg">"{seg}"</span>)}]
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    <div className="pp-status">{step?.message ?? "Press Play to begin."}</div>
                </div>
            ),
        },
        {
            id: "code",
            title: "Code Trace",
            subtitle: step ? `Active line ${step.activeLine}` : "Line-by-line solution view.",
            defaultZone: "right",
            content: (
                <CodeTracePanel
                    step={step}
                    codeLines={SOLUTION_CODE}
                    onActiveLineDomChange={setActiveLineDom}
                    autoScroll={autoScrollCode}
                />
            ),
        },
    ];

    return (
        <div className="pp-shell">
            <DockableWorkspace
                title="Palindrome Partitioning Workspace"
                panels={dockPanels}
                initialLayout={{
                    rows: [["input", "code"]],
                    minimized: [],
                }}
            />

            <FloatingPanel title="Playback Controls">
                <PlaybackControls
                    onReset={handleReset}
                    onPrev={stepBack}
                    onPlayToggle={togglePlay}
                    onNext={stepForward}
                    resetDisabled={steps.length === 0}
                    prevDisabled={stepIndex <= 0}
                    nextDisabled={steps.length === 0 || isDone}
                    isPlaying={isPlaying}
                    isDone={isDone}
                    speed={speed}
                    onSpeedChange={(event) => setSpeed(Number(event.target.value))}
                    speedIndicator={`${speed}ms`}
                    autoScroll={autoScrollCode}
                    onAutoScrollChange={setAutoScrollCode}
                    autoScrollLabel="Auto-scroll code"
                    showAutoScroll
                    showPatternOverlay={showPatternOverlay}
                    onShowPatternOverlayChange={setShowPatternOverlay}
                    patternOverlayLabel="Show pattern overlay"
                    showPatternOverlayToggle
                />
            </FloatingPanel>

            {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
        </div>
    );
}
