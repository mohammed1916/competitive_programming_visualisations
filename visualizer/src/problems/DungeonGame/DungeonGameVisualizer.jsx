import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import DockableWorkspace from "../../components/shared/DockableWorkspace";
import FloatingPanel from "../../components/shared/FloatingPanel";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./DungeonGameVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def calculateMinimumHP(dungeon):" },
    { line: 2, text: "    R, C = len(dungeon), len(dungeon[0])" },
    { line: 3, text: "    dp = [[0]*(C+1) for _ in range(R+1)]" },
    { line: 4, text: "    dp[R][C-1] = dp[R-1][C] = 1" },
    { line: 5, text: "    for r in range(R-1, -1, -1):" },
    { line: 6, text: "        for c in range(C-1, -1, -1):" },
    { line: 7, text: "            need = min(dp[r+1][c], dp[r][c+1]) - dungeon[r][c]" },
    { line: 8, text: "            dp[r][c] = max(need, 1)" },
    { line: 9, text: "    return dp[0][0]" },
];

const EXAMPLES = [
    {
        label: "Ex 1",
        dungeon: [[-2, -3, 3], [-5, -10, 1], [10, 30, -5]],
    },
    {
        label: "Ex 2",
        dungeon: [[0]],
    },
    {
        label: "Ex 3",
        dungeon: [[1, -3, 3, -2], [0, -2, 0, -2], [-3, -1, 2, -1]],
    },
];

function generateSteps(dungeon) {
    const R = dungeon.length, C = dungeon[0].length;
    const dp = Array.from({ length: R + 1 }, () => Array(C + 1).fill(0));
    dp[R][C - 1] = 1;
    dp[R - 1] = dp[R - 1] || Array(C + 1).fill(0);
    // sentinel column
    for (let r = 0; r <= R; r++) dp[r][C] = r === R ? 1 : Infinity;
    dp[R][C - 1] = 1;

    // Re-init properly
    for (let r = 0; r <= R; r++) for (let c = 0; c <= C; c++) dp[r][c] = r < R && c < C ? 0 : Infinity;
    dp[R][C - 1] = 1;
    dp[R - 1][C] = 1;

    const steps = [];
    steps.push({ activeLine: 4, dp: dp.map(r => [...r]), r: -1, c: -1, phase: "init", message: `DP table ${R}×${C}. Sentinels dp[R][C-1]=1, dp[R-1][C]=1` });

    for (let r = R - 1; r >= 0; r--) {
        for (let c = C - 1; c >= 0; c--) {
            const below = isFinite(dp[r + 1][c]) ? dp[r + 1][c] : Infinity;
            const right = isFinite(dp[r][c + 1]) ? dp[r][c + 1] : Infinity;
            const need = Math.min(below, right) - dungeon[r][c];
            dp[r][c] = Math.max(need, 1);
            steps.push({
                activeLine: 8, dp: dp.map(r => [...r]), r, c, phase: "fill",
                below: isFinite(below) ? below : "∞",
                right: isFinite(right) ? right : "∞",
                need, val: dp[r][c],
                message: `dp[${r}][${c}] = max(min(${isFinite(below) ? below : "∞"},${isFinite(right) ? right : "∞"}) - dungeon[${r}][${c}](${dungeon[r][c]}), 1) = ${dp[r][c]}`,
            });
        }
    }

    steps.push({ activeLine: 9, dp: dp.map(r => [...r]), r: 0, c: 0, phase: "done", done: true, message: `Minimum initial health = dp[0][0] = ${dp[0][0]}` });
    return steps;
}

const CELL_W = 46, CELL_H = 38;

export default function DungeonGameVisualizer() {
    const [ex, setEx] = useState(EXAMPLES[0]);
    const steps = useMemo(() => generateSteps(ex.dungeon), [ex]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

    const dp = step?.dp ?? [];
    const activeR = step?.r ?? -1;
    const activeC = step?.c ?? -1;
    const dungeon = ex.dungeon;
    const R = dungeon.length, C = dungeon[0].length;

    const VizPanel = () => (
        <div className="dg-viz-panel">
            <div className="dg-examples">
                {EXAMPLES.map(e => (
                    <button key={e.label} className={`dg-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
                        {e.label}
                    </button>
                ))}
            </div>

            <div className="dg-row">
                {/* Dungeon grid */}
                <div className="dg-panel">
                    <div className="dg-panel-label">Dungeon</div>
                    <div className="dg-grid" style={{ gridTemplateColumns: `repeat(${C}, ${CELL_W}px)` }}>
                        {dungeon.map((row, r) => row.map((v, c) => (
                            <motion.div key={`d${r}-${c}`}
                                className={`dg-cell dungeon-cell ${v < 0 ? "negative" : v > 0 ? "positive" : ""} ${r === activeR && c === activeC ? "active-d" : ""}`}
                                animate={{ scale: r === activeR && c === activeC ? 1.12 : 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                                {v > 0 ? `+${v}` : v}
                            </motion.div>
                        )))}
                    </div>
                </div>

                {/* DP grid */}
                <div className="dg-panel">
                    <div className="dg-panel-label">dp (min health needed)</div>
                    <div className="dg-grid" style={{ gridTemplateColumns: `repeat(${C}, ${CELL_W}px)` }}>
                        {Array.from({ length: R }, (_, r) =>
                            Array.from({ length: C }, (_, c) => {
                                const val = dp[r]?.[c] ?? 0;
                                const isActive = r === activeR && c === activeC;
                                return (
                                    <motion.div key={`dp${r}-${c}`}
                                        className={`dg-cell dp-cell ${isActive ? "active-dp" : val > 0 ? "filled" : ""}`}
                                        animate={{ scale: isActive ? 1.12 : 1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                                        {val > 0 ? val : "·"}
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <div className="dg-trackers">
                <div className="dg-tracker">
                    <span className="dg-tracker-label">Cell</span>
                    <span className="dg-tracker-val">{activeR >= 0 ? `[${activeR},${activeC}]` : "—"}</span>
                </div>
                <div className="dg-tracker">
                    <span className="dg-tracker-label">below / right</span>
                    <span className="dg-tracker-val">{step?.below ?? "—"} / {step?.right ?? "—"}</span>
                </div>
                <div className="dg-tracker">
                    <span className="dg-tracker-label">need</span>
                    <span className="dg-tracker-val dg-need">{step?.need ?? "—"}</span>
                </div>
                <div className="dg-tracker">
                    <span className="dg-tracker-label">dp[r][c]</span>
                    <span className="dg-tracker-val dg-dpval">{step?.val ?? "—"}</span>
                </div>
            </div>

            {step?.done && <div className="dg-result">✓ Minimum initial HP = {dp[0]?.[0]}</div>}
            <div className="dg-status">{step?.message ?? "Press Play to begin."}</div>
        </div>
    );

    const dockPanels = [
        {
            id: 'code',
            title: 'Code',
            content: <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />,
        },
        {
            id: 'viz',
            title: 'Visualization',
            content: <VizPanel />,
        },
    ];

    return (
        <div className="problem-shell">
            <DockableWorkspace panels={dockPanels} initialLayout={{ rows: [['code', 'viz']], minimized: [] }} />
            <FloatingPanel title="Playback Controls">
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
            </FloatingPanel>
            {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
        </div>
    );
}
