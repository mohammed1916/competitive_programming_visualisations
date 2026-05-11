import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./CopyListRandomVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def copyRandomList(head):" },
    { line: 2, text: "    oldToNew = {None: None}" },
    { line: 3, text: "    cur = head" },
    { line: 4, text: "    while cur:  # Pass 1: create nodes" },
    { line: 5, text: "        oldToNew[cur] = Node(cur.val)" },
    { line: 6, text: "        cur = cur.next" },
    { line: 7, text: "    cur = head" },
    { line: 8, text: "    while cur:  # Pass 2: wire pointers" },
    { line: 9, text: "        oldToNew[cur].next = oldToNew[cur.next]" },
    { line: 10, text: "        oldToNew[cur].random = oldToNew[cur.random]" },
    { line: 11, text: "        cur = cur.next" },
    { line: 12, text: "    return oldToNew[head]" },
];

function generateSteps(nodes) {
    // nodes: [{val, random}] where random is index or null
    const steps = [];
    const n = nodes.length;

    steps.push({ activeLine: 2, phase: "init", cur: -1, cloned: new Set(), message: "Init map {None: None}." });

    // Pass 1: create clone nodes
    steps.push({ activeLine: 4, phase: "pass1", cur: 0, cloned: new Set(), message: "Pass 1: create clone nodes." });
    const cloned = new Set();
    for (let i = 0; i < n; i++) {
        cloned.add(i);
        steps.push({ activeLine: 5, phase: "pass1", cur: i, cloned: new Set(cloned), message: `Clone node ${i} (val=${nodes[i].val})` });
    }

    // Pass 2: wire pointers
    steps.push({ activeLine: 7, phase: "pass2", cur: 0, cloned: new Set(cloned), message: "Pass 2: wire next and random pointers." });
    for (let i = 0; i < n; i++) {
        const nxtIdx = i + 1 < n ? i + 1 : null;
        const rndIdx = nodes[i].random;
        steps.push({
            activeLine: 9, phase: "pass2", cur: i, cloned: new Set(cloned),
            wireNext: nxtIdx, wireRandom: rndIdx,
            message: `Node ${i}: next→${nxtIdx ?? "null"}, random→${rndIdx ?? "null"}`,
        });
        steps.push({
            activeLine: 10, phase: "pass2", cur: i, cloned: new Set(cloned),
            wireNext: nxtIdx, wireRandom: rndIdx, showWire: true,
            message: `Wired clone[${i}].next=${nxtIdx ?? "null"}, .random=${rndIdx ?? "null"}`,
        });
    }

    steps.push({ activeLine: 12, phase: "done", cur: -1, cloned: new Set(cloned), message: "Done. Return head of cloned list." });
    return steps;
}

const EXAMPLES = [
    { label: "Ex1", nodes: [{ val: 7, random: null }, { val: 13, random: 0 }, { val: 11, random: 4 }, { val: 10, random: 2 }, { val: 1, random: 0 }] },
    { label: "Ex2", nodes: [{ val: 1, random: 1 }, { val: 2, random: 1 }] },
    { label: "Ex3", nodes: [{ val: 3, random: null }, { val: 3, random: 0 }, { val: 3, random: null }] },
];

export default function CopyListRandomVisualizer() {
    const [sel, setSel] = useState(0);

    const { nodes } = EXAMPLES[sel];
    const steps = useMemo(() => generateSteps(nodes), [nodes]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : steps[0];

    const applyExample = useCallback((i) => { setSel(i); handleReset(); }, [handleReset]);

    const cur = step?.cur ?? -1;
    const cloned = step?.cloned ?? new Set();

    return (
        <div className="clr-shell">
            <div className="clr-controls-row">
                <div className="clr-examples">
                    {EXAMPLES.map((ex, i) => (
                        <button key={ex.label} className={`clr-chip ${sel === i ? "active" : ""}`} onClick={() => applyExample(i)}>{ex.label}</button>
                    ))}
                </div>
            </div>

            <div className="clr-panel">
                <div className="clr-panel-label">Original list</div>
                <div className="clr-list-col">
                    <div className="clr-row-label">next →</div>
                    <div className="clr-nodes-row">
                        {nodes.map((nd, i) => (
                            <div key={i} className="clr-node-group">
                                <motion.div className={`clr-node orig ${i === cur ? "active" : ""}`}
                                    animate={{ scale: i === cur ? 1.12 : 1 }}
                                    transition={{ type: "spring", stiffness: 380, damping: 20 }}>
                                    <span className="clr-node-idx">[{i}]</span>
                                    <span className="clr-node-val">{nd.val}</span>
                                    <span className="clr-node-rnd">r→{nd.random ?? "∅"}</span>
                                </motion.div>
                                {i < nodes.length - 1 && <span className="clr-arrow">→</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Clone list */}
            {cloned.size > 0 && (
                <div className="clr-panel">
                    <div className="clr-panel-label">Clone list</div>
                    <div className="clr-nodes-row">
                        {[...cloned].sort((a, b) => a - b).map((i) => {
                            const nd = nodes[i];
                            const showWire = step?.showWire && i === cur;
                            return (
                                <div key={i} className="clr-node-group">
                                    <motion.div className={`clr-node clone ${i === cur ? "active" : ""} ${showWire ? "wired" : ""}`}
                                        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ type: "spring", stiffness: 350, damping: 22 }}>
                                        <span className="clr-node-idx">[{i}]</span>
                                        <span className="clr-node-val">{nd.val}</span>
                                        {showWire && <span className="clr-node-rnd">r→{step.wireRandom ?? "∅"}</span>}
                                    </motion.div>
                                    {i < nodes.length - 1 && cloned.has(i + 1) && <span className="clr-arrow clone-arrow">→</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="clr-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex <= 0} nextDisabled={isDone} resetDisabled={stepIndex <= 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
            />
        </div>
    );
}
