import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./PermutationInStringVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def checkInclusion(s1, s2):" },
    { line: 2, text: "    if len(s1) > len(s2): return False" },
    { line: 3, text: "    need = Counter(s1)" },
    { line: 4, text: "    have = Counter(s2[:len(s1)])" },
    { line: 5, text: "    if have == need: return True" },
    { line: 6, text: "    for i in range(len(s1), len(s2)):" },
    { line: 7, text: "        have[s2[i]] += 1" },
    { line: 8, text: "        out = s2[i - len(s1)]" },
    { line: 9, text: "        have[out] -= 1" },
    { line: 10, text: "        if have[out] == 0: del have[out]" },
    { line: 11, text: "        if have == need: return True" },
    { line: 12, text: "    return False" },
];

const EXAMPLES = [
    { label: 's1="ab" s2="eidbaooo"', s1: "ab", s2: "eidbaooo" },
    { label: 's1="ab" s2="eidboaoo"', s1: "ab", s2: "eidboaoo" },
    { label: 's1="adc" s2="dcda"', s1: "adc", s2: "dcda" },
];

function countEq(a, b) {
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (const k of ka) { if (a[k] !== b[k]) return false; }
    return true;
}

function generateSteps(s1, s2) {
    const steps = [];
    if (s1.length > s2.length) {
        steps.push({ activeLine: 2, winStart: -1, winEnd: -1, have: {}, need: {}, result: false, matchWin: false, message: "s1 longer than s2 → false" });
        return steps;
    }
    const need = {};
    for (const c of s1) need[c] = (need[c] || 0) + 1;
    const have = {};
    for (let i = 0; i < s1.length; i++) have[s2[i]] = (have[s2[i]] || 0) + 1;

    const initMatch = countEq(have, need);
    steps.push({ activeLine: 5, winStart: 0, winEnd: s1.length - 1, have: { ...have }, need: { ...need }, result: initMatch || null, matchWin: initMatch, message: `Initial window [0..${s1.length - 1}]. Match=${initMatch}` });
    if (initMatch) return steps;

    for (let i = s1.length; i < s2.length; i++) {
        have[s2[i]] = (have[s2[i]] || 0) + 1;
        const out = s2[i - s1.length];
        have[out]--;
        if (have[out] === 0) delete have[out];
        const winStart = i - s1.length + 1;
        const match = countEq(have, need);
        steps.push({
            activeLine: match ? 11 : 10, winStart, winEnd: i, have: { ...have }, need: { ...need },
            result: match ? true : null, matchWin: match,
            message: `Window [${winStart}..${i}]: add '${s2[i]}', remove '${out}'. Match=${match}`,
        });
        if (match) return steps;
    }
    steps.push({ activeLine: 12, winStart: -1, winEnd: -1, have: { ...have }, need: { ...need }, result: false, matchWin: false, message: "No permutation found → return false." });
    return steps;
}

export default function PermutationInStringVisualizer() {
    const [ex, setEx] = useState(EXAMPLES[0]);
    const steps = useMemo(() => { try { return generateSteps(ex.s1, ex.s2); } catch { return []; } }, [ex]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
    const relevantChars = step ? [...new Set([...Object.keys(step.need), ...Object.keys(step.have)])] : [];

    return (
        <div className="pis-shell">
            <div className="pis-examples">
                {EXAMPLES.map((e) => (
                    <button key={e.label} className={`pis-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>{e.label}</button>
                ))}
            </div>

            <div className="pis-strings">
                <span className="pis-lbl s1">s1:</span><span className="pis-val">{ex.s1}</span>
                <span className="pis-lbl s2">s2:</span><span className="pis-val">{ex.s2}</span>
            </div>

            <div className="pis-panel">
                <div className="pis-panel-label">Sliding window over s2</div>
                <div className="pis-chars-row">
                    {ex.s2.split("").map((ch, i) => {
                        const inWin = step && i >= step.winStart && i <= step.winEnd;
                        const isMatch = inWin && step.matchWin;
                        return (
                            <motion.div key={i} className={`pis-ch ${inWin ? (isMatch ? "match" : "window") : ""}`}
                                animate={{ scale: inWin ? 1.12 : 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                                {ch}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <div className="pis-freq-row">
                <div className="pis-panel pis-freq-panel">
                    <div className="pis-panel-label">need (s1 freq)</div>
                    <div className="pis-freq-items">
                        {relevantChars.map((c) => (
                            <div key={c} className="pis-freq-item">
                                <div className="pis-freq-char">{c}</div>
                                <div className="pis-freq-val need">{step?.need?.[c] ?? 0}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="pis-panel pis-freq-panel">
                    <div className="pis-panel-label">have (window)</div>
                    <div className="pis-freq-items">
                        {relevantChars.map((c) => {
                            const ok = (step?.need?.[c] ?? 0) === (step?.have?.[c] ?? 0);
                            return (
                                <div key={c} className="pis-freq-item">
                                    <div className="pis-freq-char">{c}</div>
                                    <div className={`pis-freq-val have ${ok ? "ok" : "diff"}`}>{step?.have?.[c] ?? 0}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {step?.result != null && (
                <AnimatePresence>
                    <motion.div className={`pis-result ${step.result ? "true" : "false"}`}
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                        {step.result ? "✓ Permutation found!" : "✗ No permutation found."}
                    </motion.div>
                </AnimatePresence>
            )}

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="pis-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
            />
        </div>
    );
}
