import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import Selectable from "../../components/Selectable";
import { useVisualizationContext } from "../../context/VisualizationContext";
import "./MaximumGapVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def maximumGap(nums):" },
    { line: 2, text: "    if len(nums) < 2: return 0" },
    { line: 3, text: "    lo, hi = min(nums), max(nums)" },
    { line: 4, text: "    n = len(nums)" },
    { line: 5, text: "    bsize = max(1, (hi-lo)//(n-1))" },
    { line: 6, text: "    buckets = [[inf,-inf] for _ in range(n+1)]" },
    { line: 7, text: "    for x in nums:" },
    { line: 8, text: "        b = (x - lo) // bsize" },
    { line: 9, text: "        buckets[b][0] = min(buckets[b][0], x)" },
    { line: 10, text: "        buckets[b][1] = max(buckets[b][1], x)" },
    { line: 11, text: "    res = 0; prev_max = lo" },
    { line: 12, text: "    for bmin, bmax in buckets:" },
    { line: 13, text: "        if bmin == inf: continue" },
    { line: 14, text: "        res = max(res, bmin - prev_max)" },
    { line: 15, text: "        prev_max = bmax" },
    { line: 16, text: "    return res" },
];

const EXAMPLES = [
    { label: "Ex 1", nums: [3, 6, 9, 1] },
    { label: "Ex 2", nums: [10] },
    { label: "Ex 3", nums: [1, 10000000] },
    { label: "Ex 4", nums: [1, 3, 6, 2, 8, 12] },
];

function generateSteps(nums) {
    const steps = [];
    if (nums.length < 2) {
        steps.push({ activeLine: 2, nums, buckets: [], phase: "done", res: 0, done: true, message: "Less than 2 elements → return 0" });
        return steps;
    }
    const lo = Math.min(...nums), hi = Math.max(...nums), n = nums.length;
    const bsize = Math.max(1, Math.floor((hi - lo) / (n - 1)));
    const buckets = Array.from({ length: n + 1 }, () => [Infinity, -Infinity]);

    steps.push({ activeLine: 5, nums, buckets: buckets.map(b => [...b]), phase: "init", res: 0, lo, hi, bsize, message: `lo=${lo}, hi=${hi}, bsize=${bsize}, ${n + 1} buckets` });

    for (const x of nums) {
        const b = Math.floor((x - lo) / bsize);
        buckets[b][0] = Math.min(buckets[b][0], x);
        buckets[b][1] = Math.max(buckets[b][1], x);
        steps.push({ activeLine: 10, nums, buckets: buckets.map(b => [...b]), phase: "fill", res: 0, lo, hi, bsize, activeB: b, message: `x=${x} → bucket ${b}, range=[${buckets[b][0] === Infinity ? "∞" : buckets[b][0]}, ${buckets[b][1] === -Infinity ? "-∞" : buckets[b][1]}]` });
    }

    let res = 0, prev_max = lo;
    for (let bi = 0; bi <= n; bi++) {
        const [bmin, bmax] = buckets[bi];
        if (bmin === Infinity) continue;
        const gap = bmin - prev_max;
        const improved = gap > res;
        if (improved) res = gap;
        steps.push({ activeLine: improved ? 14 : 13, nums, buckets: buckets.map(b => [...b]), phase: "scan", res, lo, hi, bsize, activeB: bi, prevMax: prev_max, gap, message: `Bucket ${bi}: min=${bmin}, gap=${bmin}-${prev_max}=${gap}${improved ? ` → res=${res}` : ""}` });
        prev_max = bmax;
    }

    steps.push({ activeLine: 16, nums, buckets: buckets.map(b => [...b]), phase: "done", res, lo, hi, bsize, activeB: -1, done: true, message: `Maximum gap = ${res}` });
    return steps;
}

export default function MaximumGapVisualizer() {
    const [ex, setEx] = useState(EXAMPLES[0]);
    const steps = useMemo(() => generateSteps(ex.nums), [ex]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

    // Publish current step to the chatbot
    const {
        publishStep,
        publishProblemState,
        registerTarget,
        annotations,
    } = useVisualizationContext();
    useEffect(() => { publishStep(step, "Maximum Gap"); }, [step, publishStep]);

    // Publish baseline algorithm state even when playback has not started.
    useEffect(() => {
        const n = ex.nums.length;
        const lo = n > 0 ? Math.min(...ex.nums) : null;
        const hi = n > 0 ? Math.max(...ex.nums) : null;
        const bsize = n > 1 ? Math.max(1, Math.floor((hi - lo) / (n - 1))) : null;
        publishProblemState({
            problem: "Maximum Gap",
            nums: ex.nums,
            lo,
            hi,
            n,
            bsize,
            expression: "b = (x - lo) // bsize",
            currentStep: step,
            note: step ? "Playback has active step" : "Playback not started; constants available",
            // Provide the full solution source so the assistant can reference it when composing visualization
            solution: SOLUTION_CODE,
        });
    }, [ex.nums, step, publishProblemState]);

    const buckets = useMemo(() => step?.buckets ?? [], [step]);
    const activeB = step?.activeB ?? -1;
    const res = step?.res ?? 0;
    const phase = step?.phase ?? "init";

    const visibleBuckets = useMemo(
        () => buckets
            .map((b, i) => ({ i, min: b[0], max: b[1] }))
            .filter(b => b.min !== Infinity || b.i === activeB),
        [buckets, activeB]
    );

    // Register targets for buckets and array indices so the assistant can reference them
    useEffect(() => {
        const cleanups = [];
        // register bucket targets
        visibleBuckets.forEach((b) => {
            if (registerTarget) {
                cleanups.push(registerTarget({ id: `bucket-${b.i}`, type: 'bucket', index: b.i, label: `Bucket ${b.i}` }));
            }
        });
        // register array element targets
        ex.nums.forEach((v, i) => {
            if (registerTarget) {
                cleanups.push(registerTarget({ id: `nums-${i}`, type: 'array-item', index: i, label: `nums[${i}]`, value: v }));
            }
        });
        return () => cleanups.forEach((fn) => fn && fn());
    }, [visibleBuckets, ex.nums, registerTarget]);

    return (
        <div className="mg-shell">
            <div className="mg-examples">
                {EXAMPLES.map(e => (
                    <button key={e.label} className={`mg-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
                        {e.label}
                    </button>
                ))}
            </div>

            <div className="mg-panel">
                <div className="mg-panel-label">Input array</div>
                <div className="mg-arr">
                    {ex.nums.map((v, i) => (
                        <Selectable
                            key={i}
                            label={`nums[${i}] = ${v}`}
                            data={{ index: i, value: v, arrayLength: ex.nums.length, step }}
                        >
                            <span className="mg-num">{v}</span>
                            {/* Render any annotations targeting this array element */}
                            {annotations && annotations.filter(a => a.target === `nums-${i}` || (a.target === 'array-item' && a.index === i)).map(a => (
                                <div key={a.id} className="mg-annotation">{a.text}</div>
                            ))}
                        </Selectable>
                    ))}
                </div>
            </div>

            <div className="mg-panel">
                <div className="mg-panel-label">Buckets (bsize={step?.bsize ?? "?"})</div>
                <div className="mg-buckets">
                    {visibleBuckets.length === 0 && <span className="mg-empty">building…</span>}
                    {visibleBuckets.map(({ i, min, max }) => (
                        <motion.div key={i}
                            className={`mg-bucket ${i === activeB ? `active-${phase}` : ""}`}
                            layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 22 }}>
                            <span className="mg-bi">B{i}</span>
                            <span className="mg-brange">[{min === Infinity ? "∅" : min}, {max === -Infinity ? "∅" : max}]</span>
                            {/* Render any bucket annotations from the visualization context */}
                            {annotations && annotations.filter(a => a.target === `bucket-${i}` || (a.target === 'bucket' && a.index === i)).map(a => (
                                <div key={a.id} className="mg-annotation">{a.text}</div>
                            ))}
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="mg-trackers">
                <div className="mg-tracker">
                    <span className="mg-tracker-label">lo / hi</span>
                    <span className="mg-tracker-val">{step?.lo ?? "?"} / {step?.hi ?? "?"}</span>
                </div>
                <div className="mg-tracker">
                    <span className="mg-tracker-label">prev_max</span>
                    <span className="mg-tracker-val">{step?.prevMax ?? "—"}</span>
                </div>
                <div className="mg-tracker">
                    <span className="mg-tracker-label">gap</span>
                    <span className="mg-tracker-val mg-gap">{step?.gap ?? "—"}</span>
                </div>
                <div className="mg-tracker">
                    <span className="mg-tracker-label">result</span>
                    <span className="mg-tracker-val mg-res">{res}</span>
                </div>
            </div>

            {step?.done && <div className="mg-result">✓ Maximum gap = {res}</div>}

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="mg-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={e => setSpeed(Number(e.target.value))}
            />
        </div>
    );
}
