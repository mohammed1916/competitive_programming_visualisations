import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./RandomizedCollectionVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "class RandomizedCollection:" },
    { line: 2, text: "    def __init__(self):" },
    { line: 3, text: "        self.nums = []  # [val, ...]" },
    { line: 4, text: "        self.idx = defaultdict(set)  # val -> set of indices" },
    { line: 5, text: "    def insert(self, val):" },
    { line: 6, text: "        self.idx[val].add(len(self.nums))" },
    { line: 7, text: "        self.nums.append(val)" },
    { line: 8, text: "        return len(self.idx[val]) == 1  # True if first time" },
    { line: 9, text: "    def remove(self, val):" },
    { line: 10, text: "        idx = self.idx[val].pop()" },
    { line: 11, text: "        last = self.nums[-1]" },
    { line: 12, text: "        self.nums[idx] = last" },
    { line: 13, text: "        self.idx[last].add(idx); self.idx[last].discard(len-1)" },
    { line: 14, text: "        self.nums.pop()" },
    { line: 15, text: "    def getRandom(self):" },
    { line: 16, text: "        return random.choice(self.nums)" },
];

const EXAMPLES = [
    {
        label: "Ex 1",
        ops: [
            { type: "insert", val: 1 },
            { type: "insert", val: 1 },
            { type: "insert", val: 2 },
            { type: "getRandom" },
            { type: "remove", val: 1 },
            { type: "getRandom" },
            { type: "insert", val: 2 },
            { type: "getRandom" },
            { type: "remove", val: 2 },
            { type: "getRandom" },
        ],
    },
    {
        label: "Ex 2",
        ops: [
            { type: "insert", val: 0 },
            { type: "insert", val: 1 },
            { type: "remove", val: 0 },
            { type: "insert", val: 2 },
            { type: "remove", val: 1 },
            { type: "getRandom" },
        ],
    },
];

function generateSteps(ops) {
    const steps = [];
    const nums = [];
    const idx = {}; // val -> array of indices (simulating set)

    function getIdx(val) { return idx[val] ?? []; }
    function addIdx(val, i) { idx[val] = [...getIdx(val), i]; }
    function popIdx(val) {
        const arr = idx[val] ?? [];
        const last = arr[arr.length - 1];
        idx[val] = arr.slice(0, -1);
        return last;
    }
    function removeIdxVal(val, i) { idx[val] = getIdx(val).filter(x => x !== i); }

    steps.push({ activeLine: 3, nums: [...nums], idx: JSON.parse(JSON.stringify(idx)), op: "init", result: null, phase: "init", message: "RandomizedCollection initialized." });

    for (const op of ops) {
        if (op.type === "insert") {
            const isFirst = getIdx(op.val).length === 0;
            addIdx(op.val, nums.length);
            nums.push(op.val);
            steps.push({ activeLine: 8, nums: [...nums], idx: JSON.parse(JSON.stringify(idx)), op: `insert(${op.val})`, result: isFirst, phase: "insert", message: `insert(${op.val}) → nums=[${nums.join(",")}], return ${isFirst}` });
        } else if (op.type === "remove") {
            if (getIdx(op.val).length === 0) {
                steps.push({ activeLine: 10, nums: [...nums], idx: JSON.parse(JSON.stringify(idx)), op: `remove(${op.val})`, result: false, phase: "miss", message: `remove(${op.val}) → not found` });
                continue;
            }
            const i = popIdx(op.val);
            const last = nums[nums.length - 1];
            nums[i] = last;
            if (last !== op.val || getIdx(last).length > 0) {
                removeIdxVal(last, nums.length - 1);
                addIdx(last, i);
            }
            nums.pop();
            steps.push({ activeLine: 14, nums: [...nums], idx: JSON.parse(JSON.stringify(idx)), op: `remove(${op.val})`, result: null, phase: "remove", swapI: i, swapLast: last, message: `remove(${op.val}): swap pos ${i} with last(${last}), pop → nums=[${nums.join(",")}]` });
        } else {
            const pick = nums[Math.floor(Math.random() * nums.length)];
            steps.push({ activeLine: 16, nums: [...nums], idx: JSON.parse(JSON.stringify(idx)), op: "getRandom()", result: pick, phase: "random", message: `getRandom() → ${pick}  (from [${nums.join(",")}])` });
        }
    }

    steps.push({ activeLine: 3, nums: [...nums], idx: JSON.parse(JSON.stringify(idx)), op: "—", result: null, phase: "done", done: true, message: "All operations complete." });
    return steps;
}

export default function RandomizedCollectionVisualizer() {
    const [ex, setEx] = useState(EXAMPLES[0]);
    const steps = useMemo(() => generateSteps(ex.ops), [ex]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

    const nums = step?.nums ?? [];
    const idx = step?.idx ?? {};
    const phase = step?.phase ?? "init";
    const result = step?.result;
    const opStr = step?.op ?? "—";

    return (
        <div className="rc-shell">
            <div className="rc-examples">
                {EXAMPLES.map(e => (
                    <button key={e.label} className={`rc-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
                        {e.label}
                    </button>
                ))}
            </div>

            <div className="rc-row">
                <div className="rc-panel rc-info">
                    <div className="rc-panel-label">Operation</div>
                    <div className="rc-op">{opStr}</div>
                </div>
                <div className="rc-panel rc-info">
                    <div className="rc-panel-label">Return</div>
                    <div className={`rc-ret ${phase === "random" ? "rnd" : result === true ? "ok" : result === false ? "no" : ""}`}>
                        {result === null || result === undefined ? "—" : String(result)}
                    </div>
                </div>
                <div className="rc-panel rc-info">
                    <div className="rc-panel-label">Phase</div>
                    <div className={`rc-phase ${phase}`}>{phase}</div>
                </div>
            </div>

            <div className="rc-panel">
                <div className="rc-panel-label">nums array</div>
                <div className="rc-nums">
                    <AnimatePresence>
                        {nums.map((v, i) => (
                            <motion.div key={`${i}-${v}`}
                                className={`rc-num-cell ${i === step?.swapI ? "swap" : ""}`}
                                layout
                                initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
                                transition={{ type: "spring", stiffness: 300, damping: 22 }}>
                                <span className="rc-ci">{i}</span>
                                <span className="rc-cv">{v}</span>
                            </motion.div>
                        ))}
                        {nums.length === 0 && <span className="rc-empty">empty</span>}
                    </AnimatePresence>
                </div>
            </div>

            <div className="rc-panel">
                <div className="rc-panel-label">idx map (val → indices)</div>
                <div className="rc-idx-map">
                    {Object.entries(idx).filter(([, v]) => v.length > 0).map(([k, arr]) => (
                        <div key={k} className="rc-idx-row">
                            <span className="rc-idx-key">{k}</span>
                            <span className="rc-arrow">→</span>
                            <span className="rc-idx-vals">{`{${arr.join(", ")}}`}</span>
                        </div>
                    ))}
                    {Object.values(idx).every(v => v.length === 0) && <span className="rc-empty">empty</span>}
                </div>
            </div>

            <div className="rc-panel">
                <div className="rc-panel-label">Operations log</div>
                <div className="rc-log">
                    {steps.slice(0, stepIndex + 1).filter(s => s.phase !== "init" && s.phase !== "done").map((s, i) => (
                        <span key={i} className={`rc-log-entry ${s.phase}`}>{s.op}{s.result !== null && s.result !== undefined ? ` → ${s.result}` : ""}</span>
                    ))}
                </div>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="rc-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={e => setSpeed(Number(e.target.value))}
            />
        </div>
    );
}
