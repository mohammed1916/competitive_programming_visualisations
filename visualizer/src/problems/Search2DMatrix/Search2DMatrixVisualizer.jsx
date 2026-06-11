import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./Search2DMatrixVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def searchMatrix(matrix, target):" },
    { line: 2, text: "    rows, cols = len(matrix), len(matrix[0])" },
    { line: 3, text: "    lo, hi = 0, rows * cols - 1" },
    { line: 4, text: "    while lo <= hi:" },
    { line: 5, text: "        mid = (lo + hi) // 2" },
    { line: 6, text: "        r, c = mid // cols, mid % cols" },
    { line: 7, text: "        val = matrix[r][c]" },
    { line: 8, text: "        if val == target: return True" },
    { line: 9, text: "        elif val < target: lo = mid + 1" },
    { line: 10, text: "        else: hi = mid - 1" },
    { line: 11, text: "    return False" },
];

function generateSteps(matrix, target) {
    const steps = [];
    const rows = matrix.length, cols = matrix[0].length;
    let lo = 0, hi = rows * cols - 1;

    steps.push({ activeLine: 3, lo, hi, mid: -1, r: -1, c: -1, found: null, message: `Search for ${target}. Treat ${rows}×${cols} matrix as 1D array, lo=0, hi=${hi}` });

    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const r = Math.floor(mid / cols), c = mid % cols;
        const val = matrix[r][c];
        steps.push({ activeLine: 5, lo, hi, mid, r, c, val, found: null, message: `lo=${lo}, hi=${hi} → mid=${mid} → [${r}][${c}]=${val}` });

        if (val === target) {
            steps.push({ activeLine: 8, lo, hi, mid, r, c, val, found: true, message: `Found ${target} at [${r}][${c}]! Return true.` });
            return steps;
        } else if (val < target) {
            lo = mid + 1;
            steps.push({ activeLine: 9, lo, hi, mid, r, c, val, found: null, message: `${val} < ${target} → lo = ${lo}` });
        } else {
            hi = mid - 1;
            steps.push({ activeLine: 10, lo, hi, mid, r, c, val, found: null, message: `${val} > ${target} → hi = ${hi}` });
        }
    }

    steps.push({ activeLine: 11, lo, hi, mid: -1, r: -1, c: -1, found: false, message: `${target} not found. Return false.` });
    return steps;
}

const EXAMPLES = [
    { label: "target=3", matrix: [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target: 3 },
    { label: "target=13", matrix: [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target: 13 },
    { label: "target=16", matrix: [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target: 16 },
];

export default function Search2DMatrixVisualizer() {
    const [sel, setSel] = useState(0);

    const { matrix, target } = EXAMPLES[sel];
    const steps = useMemo(() => generateSteps(matrix, target), [matrix, target]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : steps[0];

    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

    const applyExample = useCallback((i) => { setSel(i); handleReset(); }, [handleReset]);

    const cols = matrix[0].length;
    const lo = step?.lo ?? 0, hi = step?.hi ?? (matrix.length * cols - 1), mid = step?.mid ?? -1;

    return (
        <div className="s2m-shell">
            <div className="s2m-controls-row">
                <div className="s2m-examples">
                    {EXAMPLES.map((ex, i) => (
                        <button key={ex.label} className={`s2m-chip ${sel === i ? "active" : ""}`} onClick={() => applyExample(i)}>
                            {ex.label}
                        </button>
                    ))}
                </div>
                <span className="s2m-target-tag">target = {target}</span>
            </div>

            <div className="s2m-panel">
                <div className="s2m-panel-label">Matrix (flattened index shown)</div>
                <div className="s2m-grid" style={{ gridTemplateColumns: `repeat(${cols}, 60px)` }}>
                    {matrix.map((row, i) =>
                        row.map((val, j) => {
                            const flat = i * cols + j;
                            const isMid = flat === mid;
                            const inRange = flat >= lo && flat <= hi;
                            const isFound = isMid && step?.found === true;
                            return (
                                <motion.div key={`${i}-${j}`}
                                    className={`s2m-cell ${isMid ? (isFound ? "found" : "mid") : ""} ${inRange && !isMid ? "in-range" : ""} ${!inRange ? "out" : ""}`}
                                    animate={{ scale: isMid ? 1.15 : 1 }}
                                    transition={{ type: "spring", stiffness: 380, damping: 20 }}>
                                    <span className="s2m-val">{val}</span>
                                    <span className="s2m-flat">{flat}</span>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Pointer bar */}
            <div className="s2m-ptrs">
                <span className="s2m-ptr lo">lo={lo}</span>
                <span className="s2m-ptr mid">mid={mid >= 0 ? mid : "—"}</span>
                <span className="s2m-ptr hi">hi={hi}</span>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className="s2m-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex <= 0} nextDisabled={isDone} resetDisabled={stepIndex <= 0}
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
