import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./InterleavingStringVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def isInterleave(s1, s2, s3):" },
    { line: 2, text: "    m, n = len(s1), len(s2)" },
    { line: 3, text: "    if m + n != len(s3): return False" },
    { line: 4, text: "    dp = [[False]*(n+1) for _ in range(m+1)]" },
    { line: 5, text: "    dp[0][0] = True" },
    { line: 6, text: "    for i in range(1, m+1):" },
    { line: 7, text: "        dp[i][0] = dp[i-1][0] and s1[i-1]==s3[i-1]" },
    { line: 8, text: "    for j in range(1, n+1):" },
    { line: 9, text: "        dp[0][j] = dp[0][j-1] and s2[j-1]==s3[j-1]" },
    { line: 10, text: "    for i in range(1, m+1):" },
    { line: 11, text: "        for j in range(1, n+1):" },
    { line: 12, text: "            dp[i][j] = (dp[i-1][j] and s1[i-1]==s3[i+j-1])" },
    { line: 13, text: "                     or (dp[i][j-1] and s2[j-1]==s3[i+j-1])" },
    { line: 14, text: "    return dp[m][n]" },
];

const EXAMPLES = [
    { label: "s1=aab s2=axy s3=aaxaby", s1: "aab", s2: "axy", s3: "aaxaby" },
    { label: "s1=aab s2=axy s3=aayxab", s1: "aab", s2: "axy", s3: "aayxab" },
    { label: "s1=ab s2=bc s3=bbac", s1: "ab", s2: "bc", s3: "bbac" },
];

function generateSteps(s1, s2, s3) {
    const m = s1.length, n = s2.length;
    const steps = [];
    if (m + n !== s3.length) {
        steps.push({ activeLine: 3, dp: [[]], curI: -1, curJ: -1, result: false, message: `len(s1)+len(s2)=${m + n} ≠ len(s3)=${s3.length}. Return false.` });
        return steps;
    }
    // Build dp
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(false));
    dp[0][0] = true;
    steps.push({ activeLine: 5, dp: dp.map(r => [...r]), curI: 0, curJ: 0, result: null, message: "Base: dp[0][0] = true (empty strings interleave)" });

    for (let i = 1; i <= m; i++) {
        dp[i][0] = dp[i - 1][0] && s1[i - 1] === s3[i - 1];
        steps.push({ activeLine: 7, dp: dp.map(r => [...r]), curI: i, curJ: 0, result: null, message: `dp[${i}][0] = dp[${i - 1}][0](${dp[i - 1][0]}) && s1[${i - 1}]="${s1[i - 1]}"==s3[${i - 1}]="${s3[i - 1]}" → ${dp[i][0]}` });
    }
    for (let j = 1; j <= n; j++) {
        dp[0][j] = dp[0][j - 1] && s2[j - 1] === s3[j - 1];
        steps.push({ activeLine: 9, dp: dp.map(r => [...r]), curI: 0, curJ: j, result: null, message: `dp[0][${j}] = dp[0][${j - 1}](${dp[0][j - 1]}) && s2[${j - 1}]="${s2[j - 1]}"==s3[${j - 1}]="${s3[j - 1]}" → ${dp[0][j]}` });
    }
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const fromTop = dp[i - 1][j] && s1[i - 1] === s3[i + j - 1];
            const fromLeft = dp[i][j - 1] && s2[j - 1] === s3[i + j - 1];
            dp[i][j] = fromTop || fromLeft;
            steps.push({
                activeLine: 12,
                dp: dp.map(r => [...r]),
                curI: i, curJ: j,
                result: null,
                message: `dp[${i}][${j}]: top=${fromTop} | left=${fromLeft} → ${dp[i][j]} (s3[${i + j - 1}]="${s3[i + j - 1]}")`,
            });
        }
    }
    steps.push({ activeLine: 14, dp: dp.map(r => [...r]), curI: m, curJ: n, result: dp[m][n], message: `Result: dp[${m}][${n}] = ${dp[m][n]}` });
    return steps;
}

export default function InterleavingStringVisualizer() {
    const [ex, setEx] = useState(EXAMPLES[0]);
    const steps = useMemo(() => { try { return generateSteps(ex.s1, ex.s2, ex.s3); } catch { return []; } }, [ex]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

    const m = ex.s1.length, n = ex.s2.length;

    return (
        <div className="is-shell">
            <div className="is-examples">
                {EXAMPLES.map((e) => (
                    <button key={e.label} className={`is-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>{e.label}</button>
                ))}
            </div>

            {/* String labels */}
            <div className="is-strings">
                <span className="is-str-lbl s1">s1: </span><span className="is-str-val">{ex.s1}</span>
                <span className="is-str-lbl s2">s2: </span><span className="is-str-val">{ex.s2}</span>
                <span className="is-str-lbl s3">s3: </span><span className="is-str-val">{ex.s3}</span>
            </div>

            {/* DP Table */}
            {step && (
                <div className="is-panel">
                    <div className="is-panel-label">DP Table — dp[i][j] = can interleave s1[0..i-1] and s2[0..j-1] into s3[0..i+j-1]</div>
                    <div className="is-table-wrap">
                        <table className="is-table">
                            <thead>
                                <tr>
                                    <th className="is-th corner"></th>
                                    <th className="is-th idx">ε</th>
                                    {ex.s2.split("").map((c, j) => <th key={j} className="is-th s2ch">{c}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {step.dp.map((row, i) => (
                                    <tr key={i}>
                                        <th className="is-th s1ch">{i === 0 ? "ε" : ex.s1[i - 1]}</th>
                                        {row.map((val, j) => {
                                            const isCur = step.curI === i && step.curJ === j;
                                            return (
                                                <motion.td
                                                    key={j}
                                                    className={`is-td ${val ? "true" : "false"} ${isCur ? "cur" : ""}`}
                                                    animate={{ scale: isCur ? 1.2 : 1 }}
                                                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                                                >
                                                    {val ? "T" : "F"}
                                                </motion.td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {step?.result != null && (
                <div className={`is-result ${step.result ? "true" : "false"}`}>
                    {step.result ? "✓ Is Interleaving" : "✗ Not Interleaving"}
                </div>
            )}

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className="is-status">{step?.message ?? "Press Play to begin."}</div>
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
