import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./SubstringConcatenationVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def findSubstring(s, words):" },
    { line: 2, text: "    wlen, n = len(words[0]), len(s)" },
    { line: 3, text: "    total = wlen * len(words)" },
    { line: 4, text: "    freq = Counter(words)" },
    { line: 5, text: "    result = []" },
    { line: 6, text: "    for i in range(n - total + 1):" },
    { line: 7, text: "        seen = {}" },
    { line: 8, text: "        for j in range(len(words)):" },
    { line: 9, text: "            word = s[i + j*wlen : i + (j+1)*wlen]" },
    { line: 10, text: "            if word not in freq: break" },
    { line: 11, text: "            seen[word] = seen.get(word,0) + 1" },
    { line: 12, text: "            if seen[word] > freq[word]: break" },
    { line: 13, text: "        else: result.append(i)" },
    { line: 14, text: "    return result" },
];

const EXAMPLES = [
    { label: "Ex 1", s: "barfoothefoobarman", words: ["foo", "bar"] },
    { label: "Ex 2", s: "wordgoodgoodgoodbestword", words: ["word", "good", "best", "word"] },
    { label: "Ex 3", s: "barfoofoobarthefoobarman", words: ["bar", "foo", "the"] },
];

function generateSteps(s, words) {
    const wlen = words[0].length;
    const total = wlen * words.length;
    const n = s.length;
    const freq = {};
    for (const w of words) freq[w] = (freq[w] || 0) + 1;
    const steps = [];
    const result = [];

    steps.push({ activeLine: 4, s, i: -1, j: -1, window: null, seen: {}, result: [], phase: "init", message: `wlen=${wlen}, total=${total}, freq={${Object.entries(freq).map(([k, v]) => k + ":" + v).join(", ")}}` });

    for (let i = 0; i <= n - total; i++) {
        const seen = {};
        let valid = true;
        steps.push({ activeLine: 7, s, i, j: -1, window: [i, i + total - 1], seen: {}, result: [...result], phase: "window", message: `Check window i=${i}: "${s.slice(i, i + total)}"` });

        for (let j = 0; j < words.length; j++) {
            const start = i + j * wlen;
            const word = s.slice(start, start + wlen);
            const inFreq = freq[word] !== undefined;
            steps.push({
                activeLine: inFreq ? 11 : 10,
                s, i, j, window: [i, i + total - 1], wordStart: start, wordEnd: start + wlen - 1,
                seen: { ...seen }, result: [...result], phase: inFreq ? "check" : "break",
                message: inFreq ? `j=${j}: word="${word}" in freq` : `j=${j}: word="${word}" NOT in freq → break`,
            });
            if (!inFreq) { valid = false; break; }
            seen[word] = (seen[word] || 0) + 1;
            if (seen[word] > freq[word]) {
                valid = false;
                steps.push({ activeLine: 12, s, i, j, window: [i, i + total - 1], wordStart: start, wordEnd: start + wlen - 1, seen: { ...seen }, result: [...result], phase: "overflow", message: `"${word}" appears ${seen[word]} > ${freq[word]} times → break` });
                break;
            }
        }
        if (valid) {
            result.push(i);
            steps.push({ activeLine: 13, s, i, j: words.length - 1, window: [i, i + total - 1], seen: { ...seen }, result: [...result], phase: "found", message: `✓ Valid window at i=${i}!` });
        }
    }

    steps.push({ activeLine: 14, s, i: -1, j: -1, window: null, seen: {}, result: [...result], phase: "done", done: true, message: `Result: [${result.join(", ")}]` });
    return steps;
}

export default function SubstringConcatenationVisualizer() {
    const [ex, setEx] = useState(EXAMPLES[0]);
    const steps = useMemo(() => generateSteps(ex.s, ex.words), [ex]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

    const s = ex.s;
    const words = ex.words;
    const wlen = words[0].length;
    const window = step?.window ?? null;
    const wordStart = step?.wordStart ?? -1;
    const wordEnd = step?.wordEnd ?? -1;
    const seen = step?.seen ?? {};
    const result = step?.result ?? [];
    const phase = step?.phase ?? "init";
    const freq = useMemo(() => { const f = {}; for (const w of words) f[w] = (f[w] || 0) + 1; return f; }, [words]);

    return (
        <div className="sc-shell">
            <div className="sc-examples">
                {EXAMPLES.map(e => (
                    <button key={e.label} className={`sc-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
                        {e.label}
                    </button>
                ))}
            </div>

            <div className="sc-panel">
                <div className="sc-panel-label">Words</div>
                <div className="sc-words">
                    {words.map((w, i) => <span key={i} className="sc-word">{w}</span>)}
                </div>
            </div>

            <div className="sc-panel">
                <div className="sc-panel-label">String s</div>
                <div className="sc-string">
                    {s.split("").map((ch, idx) => {
                        const inWindow = window && idx >= window[0] && idx <= window[1];
                        const inWord = idx >= wordStart && idx <= wordEnd;
                        const isResult = result.some(r => idx >= r && idx < r + wlen * words.length);
                        return (
                            <motion.span key={idx}
                                className={`sc-ch ${inWord ? "in-word" : ""} ${inWindow && !inWord ? "in-window" : ""} ${isResult && !inWord ? "in-result" : ""}`}
                                animate={{ y: inWord ? -3 : 0 }}
                                transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                                {ch}
                            </motion.span>
                        );
                    })}
                </div>
                {window && (
                    <div className="sc-window-label">
                        Window [{window[0]}..{window[1]}]: "{s.slice(window[0], window[1] + 1)}"
                    </div>
                )}
            </div>

            <div className="sc-row">
                <div className="sc-panel sc-half">
                    <div className="sc-panel-label">seen (this window)</div>
                    <div className="sc-freq">
                        {Object.entries(seen).map(([w, cnt]) => (
                            <div key={w} className={`sc-freq-row ${cnt > (freq[w] || 0) ? "overflow" : ""}`}>
                                <span className="sc-freq-word">{w}</span>
                                <span className="sc-freq-cnt">{cnt}/{freq[w]}</span>
                            </div>
                        ))}
                        {Object.keys(seen).length === 0 && <span className="sc-empty">—</span>}
                    </div>
                </div>
                <div className="sc-panel sc-half">
                    <div className="sc-panel-label">Result indices</div>
                    <div className="sc-result-list">
                        {result.map((r, i) => (
                            <motion.span key={i} className="sc-ridx" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{r}</motion.span>
                        ))}
                        {result.length === 0 && <span className="sc-empty">none yet</span>}
                    </div>
                </div>
            </div>

            <div className="sc-trackers">
                <div className="sc-tracker">
                    <span className="sc-tracker-label">i</span>
                    <span className="sc-tracker-val">{step?.i ?? "—"}</span>
                </div>
                <div className="sc-tracker">
                    <span className="sc-tracker-label">j (word)</span>
                    <span className="sc-tracker-val">{step?.j ?? "—"}</span>
                </div>
                <div className="sc-tracker">
                    <span className="sc-tracker-label">Phase</span>
                    <span className={`sc-tracker-val sc-phase ${phase}`}>{phase}</span>
                </div>
                <div className="sc-tracker">
                    <span className="sc-tracker-label">Matches</span>
                    <span className="sc-tracker-val sc-matches">{result.length}</span>
                </div>
            </div>

            {step?.done && <div className="sc-result">✓ Indices: [{result.join(", ")}]</div>}

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className="sc-status">{step?.message ?? "Press Play to begin."}</div>
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
