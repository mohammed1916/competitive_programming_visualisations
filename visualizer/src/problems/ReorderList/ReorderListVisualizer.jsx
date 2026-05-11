import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./ReorderListVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def reorderList(head):" },
    { line: 2, text: "    # Find middle" },
    { line: 3, text: "    slow, fast = head, head.next" },
    { line: 4, text: "    while fast and fast.next:" },
    { line: 5, text: "        slow = slow.next; fast = fast.next.next" },
    { line: 6, text: "    second = slow.next; slow.next = None" },
    { line: 7, text: "    # Reverse second half" },
    { line: 8, text: "    prev, curr = None, second" },
    { line: 9, text: "    while curr:" },
    { line: 10, text: "        nxt = curr.next" },
    { line: 11, text: "        curr.next = prev; prev = curr; curr = nxt" },
    { line: 12, text: "    # Merge" },
    { line: 13, text: "    first, second = head, prev" },
    { line: 14, text: "    while second:" },
    { line: 15, text: "        tmp1, tmp2 = first.next, second.next" },
    { line: 16, text: "        first.next = second; second.next = tmp1" },
    { line: 17, text: "        first, second = tmp1, tmp2" },
];

function generateSteps(arr) {
    const steps = [];

    // Build linked list as array of values
    let list = [...arr];

    function snap(activeLine, message, extra = {}) {
        steps.push({ activeLine, list: [...list], message, ...extra });
    }

    snap(3, "Find middle with slow/fast pointers.", { slow: 0, fast: 1, phase: "find_mid" });

    let si = 0, fi = 1;
    while (fi < list.length && fi + 1 < list.length) {
        si++; fi += 2;
        snap(5, `slow→${si} (val=${list[si]}), fast→${fi}`, { slow: si, fast: fi, phase: "find_mid" });
    }
    // si is mid index
    const mid = si;
    snap(6, `Middle is index ${mid}. Split list into two halves.`, { slow: mid, fast: -1, phase: "split" });

    const firstHalf = list.slice(0, mid + 1);
    const secondHalf = list.slice(mid + 1);

    snap(8, `Reverse second half: [${secondHalf.join("→")}]`, { firstHalf: [...firstHalf], secondHalf: [...secondHalf], phase: "reverse_start" });

    const reversed = [...secondHalf].reverse();
    for (let i = 0; i < reversed.length; i++) {
        snap(11, `Reversed so far: [${reversed.slice(0, i + 1).join("→")}]`, { firstHalf: [...firstHalf], secondHalf: reversed.slice(0, i + 1), phase: "reversing" });
    }

    snap(13, `Merge first=[${firstHalf.join("→")}] and reversed=[${reversed.join("→")}]`, { firstHalf: [...firstHalf], secondHalf: [...reversed], phase: "merge_start" });

    // Merge
    const result = [];
    let f = 0, s = 0;
    while (s < reversed.length) {
        result.push(firstHalf[f]);
        snap(16, `Take from first: ${firstHalf[f]}`, { result: [...result, ...firstHalf.slice(f + 1), ...reversed.slice(s)], mergeF: f, mergeS: s, phase: "merging" });
        f++;
        result.push(reversed[s]);
        snap(16, `Take from second: ${reversed[s]}`, { result: [...result, ...firstHalf.slice(f), ...reversed.slice(s + 1)], mergeF: f, mergeS: s, phase: "merging" });
        s++;
    }
    if (f < firstHalf.length) result.push(firstHalf[f]);

    list = [...result];
    snap(17, `Done! Reordered: [${list.join("→")}]`, { phase: "done" });
    return steps;
}

const EXAMPLES = [
    { label: "[1,2,3,4]", arr: [1, 2, 3, 4] },
    { label: "[1,2,3,4,5]", arr: [1, 2, 3, 4, 5] },
    { label: "[1,2,3,4,5,6]", arr: [1, 2, 3, 4, 5, 6] },
];

export default function ReorderListVisualizer() {
    const [sel, setSel] = useState(0);

    const { arr } = EXAMPLES[sel];
    const steps = useMemo(() => generateSteps(arr), [arr]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : steps[0];

    const applyExample = useCallback((i) => { setSel(i); handleReset(); }, [handleReset]);

    const displayList = step?.list ?? arr;
    const slow = step?.slow ?? -1, fast = step?.fast ?? -1;

    return (
        <div className="rl-shell">
            <div className="rl-controls-row">
                <div className="rl-examples">
                    {EXAMPLES.map((ex, i) => (
                        <button key={ex.label} className={`rl-chip ${sel === i ? "active" : ""}`} onClick={() => applyExample(i)}>{ex.label}</button>
                    ))}
                </div>
            </div>

            {/* Linked list */}
            <div className="rl-panel">
                <div className="rl-panel-label">Linked list</div>
                <div className="rl-list-row">
                    {displayList.map((v, i) => (
                        <div key={i} className="rl-node-wrap">
                            <motion.div className={`rl-node ${i === slow ? "slow" : ""} ${i === fast ? "fast" : ""}`}
                                animate={{ scale: i === slow || i === fast ? 1.15 : 1 }}
                                transition={{ type: "spring", stiffness: 380, damping: 20 }}>
                                {v}
                            </motion.div>
                            {i < displayList.length - 1 && <span className="rl-arrow">→</span>}
                            {i === slow && step?.phase === "find_mid" && <span className="rl-ptr-label slow">S</span>}
                            {i === fast && step?.phase === "find_mid" && <span className="rl-ptr-label fast">F</span>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Halves */}
            {step?.firstHalf && (
                <div className="rl-halves-row">
                    <div className="rl-half-box">
                        <div className="rl-half-label">First half</div>
                        <div className="rl-half-nodes">
                            {step.firstHalf.map((v, i) => <div key={i} className="rl-half-node first">{v}</div>)}
                        </div>
                    </div>
                    <div className="rl-half-box">
                        <div className="rl-half-label">Second half {step.phase?.includes("revers") ? "(reversed)" : ""}</div>
                        <div className="rl-half-nodes">
                            {step.secondHalf.map((v, i) => <div key={i} className="rl-half-node second">{v}</div>)}
                        </div>
                    </div>
                </div>
            )}

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="rl-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex <= 0} nextDisabled={isDone} resetDisabled={stepIndex <= 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
            />
        </div>
    );
}
