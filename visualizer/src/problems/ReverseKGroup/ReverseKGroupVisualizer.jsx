import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./ReverseKGroupVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def reverseKGroup(head, k):" },
    { line: 2, text: "    dummy = ListNode(0, head)" },
    { line: 3, text: "    groupPrev = dummy" },
    { line: 4, text: "    while True:" },
    { line: 5, text: "        kth = getKth(groupPrev, k)  # find k-th node" },
    { line: 6, text: "        if not kth: break" },
    { line: 7, text: "        groupNext = kth.next" },
    { line: 8, text: "        # reverse k nodes" },
    { line: 9, text: "        prev, curr = groupNext, groupPrev.next" },
    { line: 10, text: "        while curr != groupNext:" },
    { line: 11, text: "            tmp = curr.next" },
    { line: 12, text: "            curr.next = prev" },
    { line: 13, text: "            prev = curr" },
    { line: 14, text: "            curr = tmp" },
    { line: 15, text: "        groupPrev.next = kth" },
    { line: 16, text: "        groupPrev = head  # head becomes last of group" },
    { line: 17, text: "    return dummy.next" },
];

const EXAMPLES = [
    { label: "Ex 1", list: [1, 2, 3, 4, 5], k: 2 },
    { label: "Ex 2", list: [1, 2, 3, 4, 5], k: 3 },
    { label: "Ex 3", list: [1, 2, 3, 4, 5, 6], k: 2 },
];

function generateSteps(listIn, k) {
    const steps = [];
    // Work on array representation
    const arr = [...listIn];
    const result = [];
    let pos = 0;

    steps.push({
        activeLine: 3,
        arr: [...arr], result: [],
        groupStart: 0, groupEnd: -1, kthIdx: -1, phase: "init",
        message: `Input: [${arr.join(" → ")}], k=${k}. groupPrev at dummy.`,
    });

    while (pos < arr.length) {
        const groupStart = pos;
        const groupEnd = pos + k - 1;

        steps.push({
            activeLine: 5,
            arr: [...arr], result: [...result],
            groupStart, groupEnd: Math.min(groupEnd, arr.length - 1), kthIdx: -1, phase: "find",
            message: `Find k-th (${k}th) node from position ${groupStart}`,
        });

        if (groupEnd >= arr.length) {
            // not enough nodes — append remainder as-is
            for (let i = pos; i < arr.length; i++) result.push(arr[i]);
            steps.push({
                activeLine: 6,
                arr: [...arr], result: [...result],
                groupStart, groupEnd: arr.length - 1, kthIdx: -1, phase: "short",
                message: `Less than k nodes remaining → keep as-is`,
                done: true,
            });
            break;
        }

        steps.push({
            activeLine: 7,
            arr: [...arr], result: [...result],
            groupStart, groupEnd, kthIdx: groupEnd, phase: "found",
            message: `kth node = arr[${groupEnd}]=${arr[groupEnd]}. groupNext = arr[${groupEnd + 1} ?? null]`,
        });

        // reverse the k nodes in place
        const group = arr.slice(groupStart, groupEnd + 1);
        steps.push({
            activeLine: 9,
            arr: [...arr], result: [...result],
            groupStart, groupEnd, kthIdx: groupEnd, phase: "reverse",
            message: `Reverse group [${group.join(", ")}]`,
        });

        group.reverse();
        for (let i = 0; i < k; i++) arr[groupStart + i] = group[i];

        steps.push({
            activeLine: 15,
            arr: [...arr], result: [...result],
            groupStart, groupEnd, kthIdx: groupEnd, phase: "reversed",
            message: `Group reversed → [${group.join(", ")}]. Re-link groupPrev → kth`,
        });

        for (let i = groupStart; i <= groupEnd; i++) result.push(arr[i]);
        pos = groupEnd + 1;

        steps.push({
            activeLine: 16,
            arr: [...arr], result: [...result],
            groupStart: pos, groupEnd: -1, kthIdx: -1, phase: "advance",
            message: `Group appended to result. Advance groupPrev. pos=${pos}`,
        });
    }

    if (!steps[steps.length - 1].done) {
        steps.push({
            activeLine: 17,
            arr: [...arr], result: [...result],
            groupStart: -1, groupEnd: -1, kthIdx: -1, phase: "done", done: true,
            message: `Done: [${result.join(" → ")}]`,
        });
    }
    return steps;
}

export default function ReverseKGroupVisualizer() {
    const [ex, setEx] = useState(EXAMPLES[0]);
    const steps = useMemo(() => generateSteps(ex.list, ex.k), [ex]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

    const arr = step?.arr ?? ex.list;
    const result = step?.result ?? [];
    const groupStart = step?.groupStart ?? -1;
    const groupEnd = step?.groupEnd ?? -1;

    const renderList = (nodes, highlights) => (
        <div className="rkg-list">
            {nodes.map((v, idx) => {
                const hl = highlights?.(idx);
                return (
                    <div key={idx} className="rkg-node-row">
                        <motion.div
                            className={`rkg-node ${hl ? hl : ""}`}
                            animate={{ scale: hl ? 1.12 : 1, y: hl === "kth" ? -6 : 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 22 }}
                        >
                            {v}
                        </motion.div>
                        {idx < nodes.length - 1 && <div className="rkg-arrow">→</div>}
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="rkg-shell">
            <div className="rkg-examples">
                {EXAMPLES.map(e => (
                    <button key={e.label} className={`rkg-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
                        {e.label}: [{e.list.join("→")}] k={e.k}
                    </button>
                ))}
            </div>

            <div className="rkg-panel">
                <div className="rkg-panel-label">Working Array</div>
                {renderList(arr, (idx) => {
                    if (idx >= groupStart && idx <= groupEnd) {
                        if (idx === groupEnd && step?.kthIdx === groupEnd) return "kth";
                        return "in-group";
                    }
                    return "";
                })}
            </div>

            <AnimatePresence>
                {result.length > 0 && (
                    <motion.div className="rkg-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="rkg-panel-label">Result (built so far)</div>
                        {renderList(result, () => "res")}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="rkg-trackers">
                <div className="rkg-tracker">
                    <span className="rkg-tracker-label">Phase</span>
                    <span className={`rkg-tracker-val rkg-phase ${step?.phase ?? "init"}`}>{step?.phase ?? "—"}</span>
                </div>
                <div className="rkg-tracker">
                    <span className="rkg-tracker-label">Group [start,end]</span>
                    <span className="rkg-tracker-val rkg-small">{groupStart < 0 ? "—" : `[${groupStart}, ${groupEnd < 0 ? "?" : groupEnd}]`}</span>
                </div>
                <div className="rkg-tracker">
                    <span className="rkg-tracker-label">k</span>
                    <span className="rkg-tracker-val">{ex.k}</span>
                </div>
            </div>

            {step?.done && <div className="rkg-result">✓ Result: [{result.join(" → ")}]</div>}

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="rkg-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={e => setSpeed(Number(e.target.value))}
            />
        </div>
    );
}
