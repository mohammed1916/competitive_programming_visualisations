import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import AnimatedIterationList from "../../components/shared/AnimatedIterationList";
import DockableWorkspace from "../../components/shared/DockableWorkspace";
import FloatingPanel from "../../components/shared/FloatingPanel";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { useCodeVisualConnectivity } from "../../hooks/useCodeVisualConnectivity";
import { useProblemCode } from "../../hooks/useProblemCode";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import { useAutoScroll } from "../../hooks/useAutoScroll";
import "./MoveZeroesVisualizer.css";

const EXAMPLES = [
    { label: "Ex 1", nums: [0, 1, 0, 3, 12] },
    { label: "Ex 2", nums: [0, 0, 1] },
    { label: "Ex 3", nums: [1, 0, 2, 0, 0, 4, 5] },
];

function generateSteps(numsIn) {
    const steps = [];
    const arr = [...numsIn];
    let k = 0;
    steps.push({ activeLine: 2, arr: [...arr], k, i: -1, message: "Init k=0 (write pointer)" });
    for (let i = 0; i < arr.length; i++) {
        steps.push({ activeLine: 4, arr: [...arr], k, i, message: `i=${i}: nums[${i}]=${arr[i]} ${arr[i] !== 0 ? "≠ 0" : "== 0, skip"}` });
        if (arr[i] !== 0) {
            [arr[k], arr[i]] = [arr[i], arr[k]];
            steps.push({ activeLine: 5, arr: [...arr], k, i, message: `Swap nums[${k}] ↔ nums[${i}] → [${arr.join(", ")}]` });
            k++;
            steps.push({ activeLine: 6, arr: [...arr], k, i, message: `k++ → k=${k}` });
        }
    }
    steps.push({ activeLine: 1, arr: [...arr], k, i: -1, done: true, message: `Done: [${arr.join(", ")}]` });
    return steps;
}

export default function MoveZeroesVisualizer({ problem }) {
    const [ex, setEx] = useState(EXAMPLES[0]);
    const codeLines = useProblemCode(problem, "move-zeroes");
    const [autoScrollCode, setAutoScrollCode] = useAutoScroll();
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();
    const steps = useMemo(
        () =>
            generateSteps(ex.nums).map((current) => ({
                ...current,
                relatedLines: current.relatedLines ?? (current.activeLine != null ? [current.activeLine] : []),
            })),
        [ex]
    );
    const { stepIndex, setStepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
    const connectivity = useCodeVisualConnectivity({
        steps,
        stepIndex,
        onStepJump: setStepIndex,
    });

    const arr = step?.arr ?? ex.nums;
    const k = step?.k ?? 0;
    const i = step?.i ?? -1;

    const dockPanels = [
        {
            id: "input",
            title: "Input Examples",
            subtitle: "Select an example or reset.",
            defaultZone: "left",
            content: (
                <div className="mz-panel-body">
                    <div className="mz-examples">
                        {EXAMPLES.map(e => (
                            <button
                                key={e.label}
                                className={`mz-chip ${ex.label === e.label ? "active" : ""}`}
                                onClick={() => applyEx(e)}
                            >
                                {e.label}
                            </button>
                        ))}
                    </div>
                </div>
            ),
        },
        {
            id: "viz",
            title: "Array Visualization",
            subtitle: step ? `Step ${stepIndex + 1} of ${steps.length}` : "Array state visualization.",
            defaultZone: "right",
            content: (
                <div className="mz-panel-body">
                    <div className="mz-panel">
                        <div className="mz-panel-label">Array (in-place)</div>
                        <AnimatedIterationList
                            items={arr}
                            styleName="pointer-lane"
                            className="mz-arr"
                            getItemState={(value, index) => {
                                const isI = index === i;
                                const isK = index === k;
                                const isZero = value === 0;
                                return {
                                    stateClass: `${isI ? 'i-cell' : ''} ${isK && !isI ? 'k-cell' : ''} ${isZero && !isI && !isK ? 'zero' : ''}`.trim(),
                                    isActive: isI || isK,
                                };
                            }}
                            renderBelow={(_, index) => {
                                const isI = index === i;
                                const isK = index === k;
                                return (
                                    <div className="mz-ptrs">
                                        {isI && <span className="mz-ptr i">i</span>}
                                        {isK && <span className="mz-ptr k">k</span>}
                                    </div>
                                );
                            }}
                        />
                    </div>

                    <div className="mz-trackers">
                        <div className="mz-tracker"><span className="mz-tracker-label">k</span>
                            <motion.span key={k} className="mz-tracker-val" initial={{ scale: 1.3 }} animate={{ scale: 1 }}>{k}</motion.span>
                        </div>
                        <div className="mz-tracker"><span className="mz-tracker-label">i</span>
                            <span className="mz-tracker-val">{i < 0 ? "-" : i}</span>
                        </div>
                    </div>

                    {step?.done && (
                        <div className="mz-result">✓ Zeroes moved to end: [{arr.join(", ")}]</div>
                    )}

                    <div className="mz-status">{step?.message ?? "Press Play to begin."}</div>
                </div>
            ),
        },
        {
            id: "code",
            title: "Code Trace",
            subtitle: step ? `Active line ${step.activeLine}` : "Code line-by-line trace.",
            defaultZone: "full",
            content: (
                <CodeTracePanel
                    step={step}
                    codeLines={codeLines}
                    highlightedLines={connectivity.highlightedLines}
                    onLineSelect={connectivity.handleLineSelect}
                    onActiveLineDomChange={setActiveLineDom}
                    autoScroll={autoScrollCode}
                />
            ),
        },
    ];

    return (
        <div className="mz-shell">
            <DockableWorkspace
                title="Move Zeroes Workspace"
                panels={dockPanels}
                initialLayout={{
                    rows: [
                        ["input", "viz"],
                        ["code"],
                    ],
                    minimized: [],
                }}
            />

            <FloatingPanel title="Playback Controls">
                <PlaybackControls
                    isPlaying={isPlaying}
                    isDone={isDone}
                    speed={speed}
                    onPlayToggle={togglePlay}
                    onPrev={stepBack}
                    onNext={stepForward}
                    onReset={handleReset}
                    prevDisabled={stepIndex < 0}
                    nextDisabled={isDone}
                    resetDisabled={stepIndex < 0}
                    onSpeedChange={e => setSpeed(Number(e.target.value))}
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
