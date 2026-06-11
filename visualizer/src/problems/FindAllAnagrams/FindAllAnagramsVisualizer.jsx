import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./FindAllAnagramsVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def findAnagrams(s, p):" },
    { line: 2, text: "    need = Counter(p)" },
    { line: 3, text: "    have = Counter(s[:len(p)])" },
    { line: 4, text: "    result = []" },
    { line: 5, text: "    if have == need: result.append(0)" },
    { line: 6, text: "    for i in range(len(p), len(s)):" },
    { line: 7, text: "        have[s[i]] += 1" },
    { line: 8, text: "        have[s[i-len(p)]] -= 1" },
    { line: 9, text: "        if have[s[i-len(p)]] == 0: del have[s[i-len(p)]]" },
    { line: 10, text: "        winStart = i - len(p) + 1" },
    { line: 11, text: "        if have == need: result.append(winStart)" },
    { line: 12, text: "    return result" },
];

const EXAMPLES = [
    { label: 's="cbaebabacd" p="abc"', s: "cbaebabacd", p: "abc" },
    { label: 's="abab" p="ab"', s: "abab", p: "ab" },
    { label: 's="aaaaaaa" p="aa"', s: "aaaaaaa", p: "aa" },
];

function countEq(a, b) {
    if (Object.keys(a).length !== Object.keys(b).length) return false;
    for (const k of Object.keys(a)) { if (a[k] !== b[k]) return false; }
    return true;
}

function generateSteps(s, p) {
    const steps = [];
    const need = {};
    for (const c of p) need[c] = (need[c] || 0) + 1;

    const have = {};
    for (let i = 0; i < p.length; i++) {
        const c = s[i];
        if (c !== undefined) have[c] = (have[c] || 0) + 1;
    }

    const result = [];
    const win0 = countEq(have, need);
    if (win0) result.push(0);

    steps.push({
        activeLine: 5, winStart: 0, winEnd: p.length - 1, have: { ...have }, need: { ...need },
        result: [...result], matchWin: win0,
        message: `Initial window [0..${p.length - 1}]. Match=${win0}`,
    });

    for (let i = p.length; i < s.length; i++) {
        have[s[i]] = (have[s[i]] || 0) + 1;
        const outChar = s[i - p.length];
        have[outChar]--;
        if (have[outChar] === 0) delete have[outChar];
        const winStart = i - p.length + 1;
        const match = countEq(have, need);
        if (match) result.push(winStart);
        steps.push({
            activeLine: match ? 11 : 9, winStart, winEnd: i, have: { ...have }, need: { ...need },
            result: [...result], matchWin: match,
            message: `Slide to [${winStart}..${i}]: add '${s[i]}', remove '${outChar}'. Match=${match}${match ? ` → push ${winStart}` : ""}`,
        });
    }

    steps.push({
        activeLine: 12, winStart: -1, winEnd: -1, have: { ...have }, need: { ...need },
        result: [...result], matchWin: false,
        message: `Done. Anagram starts at: [${result.join(", ")}]`,
    });
    return steps;
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

export default function FindAllAnagramsVisualizer() {
    const [ex, setEx] = useState(EXAMPLES[0]);
    const steps = useMemo(() => { try { return generateSteps(ex.s, ex.p); } catch { return []; } }, [ex]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

    // Only show letters present in need or have
    const relevantChars = step ? [...new Set([...Object.keys(step.need), ...Object.keys(step.have)])] : [];

    return (
        <div className="faa-shell">
            <div className="faa-examples">
                {EXAMPLES.map((e) => (
                    <button key={e.label} className={`faa-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>{e.label}</button>
                ))}
            </div>

            {/* String with window highlighted */}
            <div className="faa-panel">
                <div className="faa-panel-label">s = "{ex.s}"  |  p = "{ex.p}"</div>
                <div className="faa-chars-row">
                    {ex.s.split("").map((ch, i) => {
                        const inWin = step && i >= step.winStart && i <= step.winEnd;
                        const isMatch = inWin && step.matchWin;
                        const isResult = step?.result?.includes(i);
                        return (
                            <motion.div key={i} className={`faa-ch ${inWin ? (isMatch ? "match" : "window") : ""} ${isResult ? "result-start" : ""}`}
                                animate={{ scale: inWin ? 1.12 : 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                                {ch}
                                {isResult && <div className="faa-ch-tick">✓</div>}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Freq comparison */}
            <div className="faa-freq-row">
                <div className="faa-panel faa-freq-panel">
                    <div className="faa-panel-label">need (p freq)</div>
                    <div className="faa-freq-bars">
                        {relevantChars.map((c) => (
                            <div key={c} className="faa-freq-item">
                                <div className="faa-freq-char">{c}</div>
                                <div className={`faa-freq-val need`}>{step?.need?.[c] ?? 0}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="faa-panel faa-freq-panel">
                    <div className="faa-panel-label">have (window freq)</div>
                    <div className="faa-freq-bars">
                        {relevantChars.map((c) => {
                            const needVal = step?.need?.[c] ?? 0;
                            const haveVal = step?.have?.[c] ?? 0;
                            const ok = needVal === haveVal;
                            return (
                                <div key={c} className="faa-freq-item">
                                    <div className="faa-freq-char">{c}</div>
                                    <div className={`faa-freq-val have ${ok ? "ok" : "diff"}`}>{haveVal}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="faa-panel faa-result-panel">
                    <div className="faa-panel-label">Result indices</div>
                    <div className="faa-result-indices">
                        <AnimatePresence mode="popLayout">
                            {(step?.result ?? []).map((idx) => (
                                <motion.span key={idx} className="faa-idx-badge"
                                    initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                                    {idx}
                                </motion.span>
                            ))}
                        </AnimatePresence>
                        {(step?.result?.length ?? 0) === 0 && <span className="faa-empty">none yet</span>}
                    </div>
                </div>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className="faa-status">{step?.message ?? "Press Play to begin."}</div>
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
