import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./FindMedianVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "class MedianFinder:" },
    { line: 2, text: "    # small = max-heap (inverted), large = min-heap" },
    { line: 3, text: "    def addNum(self, num):" },
    { line: 4, text: "        heappush(small, -num)" },
    { line: 5, text: "        if small and large and -small[0] > large[0]:" },
    { line: 6, text: "            heappush(large, -heappop(small))" },
    { line: 7, text: "        if len(small) > len(large) + 1:" },
    { line: 8, text: "            heappush(large, -heappop(small))" },
    { line: 9, text: "        if len(large) > len(small):" },
    { line: 10, text: "            heappush(small, -heappop(large))" },
    { line: 11, text: "    def findMedian(self):" },
    { line: 12, text: "        if len(small) == len(large):" },
    { line: 13, text: "            return (-small[0] + large[0]) / 2" },
    { line: 14, text: "        return -small[0]" },
];

// Min-heap helpers
function heapPush(heap, val) {
    heap.push(val);
    let i = heap.length - 1;
    while (i > 0) {
        const p = Math.floor((i - 1) / 2);
        if (heap[p] <= heap[i]) break;
        [heap[p], heap[i]] = [heap[i], heap[p]];
        i = p;
    }
}
function heapPop(heap) {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
        heap[0] = last;
        let i = 0;
        while (true) {
            let s = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < heap.length && heap[l] < heap[s]) s = l;
            if (r < heap.length && heap[r] < heap[s]) s = r;
            if (s === i) break;
            [heap[i], heap[s]] = [heap[s], heap[i]];
            i = s;
        }
    }
    return top;
}

function generateSteps(nums) {
    const steps = [];
    const small = []; // max-heap via negation stored as min-heap of negatives
    const large = []; // min-heap

    steps.push({ phase: "init", activeLine: 1, small: [], large: [], median: null, message: "Initialize two heaps" });

    for (const num of nums) {
        // push to small (max-heap)
        heapPush(small, -num);
        steps.push({
            phase: "push_small", activeLine: 4,
            small: [...small], large: [...large], median: null,
            message: `Push ${num} to small (max-heap). small=[${small.map((v) => -v).join(",")}]`,
        });

        // balance: if small's max > large's min
        if (small.length > 0 && large.length > 0 && -small[0] > large[0]) {
            const moved = -heapPop(small);
            heapPush(large, moved);
            steps.push({
                phase: "balance_order", activeLine: 6,
                small: [...small], large: [...large], median: null,
                message: `Order fix: move ${moved} from small to large`,
            });
        }

        // size balance
        if (small.length > large.length + 1) {
            const moved = -heapPop(small);
            heapPush(large, moved);
            steps.push({
                phase: "balance_size_sl", activeLine: 8,
                small: [...small], large: [...large], median: null,
                message: `Size fix: move ${moved} from small to large`,
            });
        }
        if (large.length > small.length) {
            const moved = heapPop(large);
            heapPush(small, -moved);
            steps.push({
                phase: "balance_size_ls", activeLine: 10,
                small: [...small], large: [...large], median: null,
                message: `Size fix: move ${moved} from large to small`,
            });
        }

        const median =
            small.length === large.length
                ? (-small[0] + large[0]) / 2
                : -small[0];
        steps.push({
            phase: "median", activeLine: small.length === large.length ? 13 : 14,
            small: [...small], large: [...large], median,
            message: `After adding ${num}: median = ${median}`,
        });
    }

    return steps;
}

const EXAMPLES = [
    { label: "[1,2,3]", nums: [1, 2, 3] },
    { label: "[6,5,4,3,2,1]", nums: [6, 5, 4, 3, 2, 1] },
    { label: "[2,3,4,7,8]", nums: [2, 3, 4, 7, 8] },
];

function HeapDisplay({ label, values, isMax, accent }) {
    const display = isMax ? values.map((v) => -v) : values;
    return (
        <div className="fm-heap-panel" style={{ borderColor: accent }}>
            <div className="fm-heap-label" style={{ color: accent }}>{label}</div>
            <div className="fm-heap-cells">
                <AnimatePresence mode="popLayout">
                    {display.map((v, i) => (
                        <motion.div key={`${i}-${v}`} className="fm-heap-cell"
                            style={{ borderColor: i === 0 ? accent : "#45475a", color: i === 0 ? accent : "#cdd6f4" }}
                            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ type: "spring", stiffness: 380, damping: 22 }}>
                            {v}
                            {i === 0 && <span className="fm-top-tag">{isMax ? "max" : "min"}</span>}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default function FindMedianVisualizer() {
    const [numsInput, setNumsInput] = useState("[1,2,3]");
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

    const { nums, inputErr } = useMemo(() => {
        try {
            const p = JSON.parse(numsInput);
            if (!Array.isArray(p)) throw new Error("Must be array");
            return { nums: p.map(Number).slice(0, 12), inputErr: "" };
        } catch (e) {
            return { nums: [1, 2, 3], inputErr: e.message };
        }
    }, [numsInput]);

    const steps = useMemo(() => generateSteps(nums), [nums]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;

    const applyExample = useCallback(
        (ex) => { setNumsInput(JSON.stringify(ex.nums)); handleReset(); },
        [handleReset]
    );

    return (
        <div className="fm-shell">
            <div className="fm-controls-row">
                <div className="fm-examples">
                    {EXAMPLES.map((ex) => (
                        <button key={ex.label} className="fm-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input className="fm-input" value={numsInput}
                        onChange={(e) => { setNumsInput(e.target.value); handleReset(); }} />
                    {inputErr && <span className="fm-error">{inputErr}</span>}
                </div>
            </div>

            <div className="fm-heaps-row">
                <HeapDisplay label="small (max-heap)" values={step?.small ?? []} isMax accent="#f38ba8" />
                <div className="fm-median-col">
                    <div className="fm-median-label">median</div>
                    <motion.div className="fm-median-val"
                        key={step?.median}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.3 }}>
                        {step?.median ?? "—"}
                    </motion.div>
                </div>
                <HeapDisplay label="large (min-heap)" values={step?.large ?? []} isMax={false} accent="#89b4fa" />
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            <div className="fm-status">{step?.message ?? "Press Play to begin."}</div>
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
