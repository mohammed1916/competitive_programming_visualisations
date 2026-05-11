import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./LFUCacheVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "class LFUCache:" },
    { line: 2, text: "    def __init__(self, capacity):" },
    { line: 3, text: "        self.cap = capacity; self.min_freq = 0" },
    { line: 4, text: "        self.key_val = {}  # key -> val" },
    { line: 5, text: "        self.key_freq = {}  # key -> freq" },
    { line: 6, text: "        self.freq_list = {}  # freq -> OrderedDict" },
    { line: 7, text: "    def get(self, key):" },
    { line: 8, text: "        if key not in self.key_val: return -1" },
    { line: 9, text: "        self._increment_freq(key)" },
    { line: 10, text: "        return self.key_val[key]" },
    { line: 11, text: "    def put(self, key, value):" },
    { line: 12, text: "        if key in self.key_val:" },
    { line: 13, text: "            self.key_val[key] = value" },
    { line: 14, text: "            self._increment_freq(key)" },
    { line: 15, text: "        else:" },
    { line: 16, text: "            if len == cap: evict(min_freq)" },
    { line: 17, text: "            add key with freq=1" },
    { line: 18, text: "            self.min_freq = 1" },
];

const EXAMPLES = [
    {
        label: "LFU(2)",
        capacity: 2,
        ops: [
            { type: "put", key: 1, val: 1 },
            { type: "put", key: 2, val: 2 },
            { type: "get", key: 1 },
            { type: "put", key: 3, val: 3 },
            { type: "get", key: 2 },
            { type: "get", key: 3 },
            { type: "put", key: 4, val: 4 },
            { type: "get", key: 1 },
            { type: "get", key: 3 },
            { type: "get", key: 4 },
        ],
    },
    {
        label: "LFU(3)",
        capacity: 3,
        ops: [
            { type: "put", key: 1, val: 1 },
            { type: "put", key: 2, val: 2 },
            { type: "put", key: 3, val: 3 },
            { type: "get", key: 1 },
            { type: "get", key: 2 },
            { type: "put", key: 4, val: 4 },
            { type: "get", key: 3 },
            { type: "get", key: 4 },
        ],
    },
];

function generateSteps(capacity, ops) {
    const steps = [];
    const keyVal = {};
    const keyFreq = {};
    const freqList = {}; // freq -> array of keys (oldest first)
    let minFreq = 0;

    function getState() {
        return {
            cache: Object.keys(keyVal).map(k => ({ key: Number(k), val: keyVal[k], freq: keyFreq[k] })),
            minFreq,
        };
    }

    function incrementFreq(key) {
        const f = keyFreq[key];
        freqList[f] = (freqList[f] || []).filter(k => k !== key);
        if (freqList[f].length === 0 && f === minFreq) minFreq++;
        keyFreq[key] = f + 1;
        freqList[f + 1] = [...(freqList[f + 1] || []), key];
    }

    steps.push({ activeLine: 3, ...getState(), activeKey: null, result: null, op: "init", phase: "init", evicted: null, message: `LFUCache(capacity=${capacity})` });

    for (const op of ops) {
        if (op.type === "get") {
            if (!(op.key in keyVal)) {
                steps.push({ activeLine: 8, ...getState(), activeKey: op.key, result: -1, op: `get(${op.key})`, phase: "miss", evicted: null, message: `get(${op.key}) → miss, return -1` });
            } else {
                incrementFreq(op.key);
                steps.push({ activeLine: 10, ...getState(), activeKey: op.key, result: keyVal[op.key], op: `get(${op.key})`, phase: "hit", evicted: null, message: `get(${op.key}) → hit, val=${keyVal[op.key]}, freq now ${keyFreq[op.key]}` });
            }
        } else {
            if (op.key in keyVal) {
                keyVal[op.key] = op.val;
                incrementFreq(op.key);
                steps.push({ activeLine: 14, ...getState(), activeKey: op.key, result: null, op: `put(${op.key},${op.val})`, phase: "update", evicted: null, message: `put(${op.key},${op.val}) → update existing, freq now ${keyFreq[op.key]}` });
            } else {
                let evicted = null;
                if (Object.keys(keyVal).length >= capacity) {
                    const oldest = freqList[minFreq][0];
                    freqList[minFreq] = freqList[minFreq].slice(1);
                    delete keyVal[oldest];
                    delete keyFreq[oldest];
                    evicted = oldest;
                }
                keyVal[op.key] = op.val;
                keyFreq[op.key] = 1;
                freqList[1] = [...(freqList[1] || []), op.key];
                minFreq = 1;
                steps.push({ activeLine: 17, ...getState(), activeKey: op.key, result: null, op: `put(${op.key},${op.val})`, phase: evicted !== null ? "evict" : "insert", evicted, message: evicted !== null ? `put(${op.key},${op.val}) → evict key ${evicted}, insert key ${op.key}` : `put(${op.key},${op.val}) → insert key ${op.key}` });
            }
        }
    }

    steps.push({ activeLine: 3, ...getState(), activeKey: null, result: null, op: "—", phase: "done", evicted: null, done: true, message: "All operations done." });
    return steps;
}

export default function LFUCacheVisualizer() {
    const [ex, setEx] = useState(EXAMPLES[0]);
    const steps = useMemo(() => generateSteps(ex.capacity, ex.ops), [ex]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

    const cache = step?.cache ?? [];
    const minFreq = step?.minFreq ?? 0;
    const activeKey = step?.activeKey ?? null;
    const result = step?.result ?? null;
    const phase = step?.phase ?? "init";
    const evicted = step?.evicted ?? null;
    const opStr = step?.op ?? "—";

    return (
        <div className="lfu-shell">
            <div className="lfu-examples">
                {EXAMPLES.map(e => (
                    <button key={e.label} className={`lfu-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
                        {e.label}
                    </button>
                ))}
            </div>

            <div className="lfu-row">
                <div className="lfu-panel lfu-info">
                    <div className="lfu-panel-label">Operation</div>
                    <div className="lfu-op">{opStr}</div>
                </div>
                <div className="lfu-panel lfu-info">
                    <div className="lfu-panel-label">Result</div>
                    <div className={`lfu-result-val ${result === -1 ? "miss" : result !== null ? "hit" : ""}`}>{result !== null ? String(result) : "—"}</div>
                </div>
                <div className="lfu-panel lfu-info">
                    <div className="lfu-panel-label">min_freq</div>
                    <div className="lfu-mf">{minFreq}</div>
                </div>
                <div className="lfu-panel lfu-info">
                    <div className="lfu-panel-label">Phase</div>
                    <div className={`lfu-phase ${phase}`}>{phase}</div>
                </div>
            </div>

            <div className="lfu-panel">
                <div className="lfu-panel-label">Cache state — capacity {ex.capacity}</div>
                <AnimatePresence>
                    {cache.length === 0 && <div className="lfu-empty">empty</div>}
                    {cache.map(item => (
                        <motion.div key={item.key}
                            className={`lfu-entry ${item.key === activeKey ? `active-${phase}` : ""} ${item.key === evicted ? "evicted" : ""}`}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 24 }}>
                            <span className="lfu-key">key={item.key}</span>
                            <span className="lfu-val">val={item.val}</span>
                            <span className="lfu-freq">freq={item.freq}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="lfu-panel">
                <div className="lfu-panel-label">Operations log</div>
                <div className="lfu-log">
                    {steps.slice(0, stepIndex + 1).filter(s => s.op !== "init" && s.op !== "—").map((s, i) => (
                        <span key={i} className={`lfu-log-entry ${s.phase}`}>{s.op} → {s.result !== null ? String(s.result) : s.phase}</span>
                    ))}
                </div>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="lfu-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={e => setSpeed(Number(e.target.value))}
            />
        </div>
    );
}
