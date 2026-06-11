import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./PalindromeLinkedListVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def isPalindrome(head):" },
    { line: 2, text: "    # Phase 1: find middle with slow/fast" },
    { line: 3, text: "    slow, fast = head, head" },
    { line: 4, text: "    while fast and fast.next:" },
    { line: 5, text: "        slow = slow.next; fast = fast.next.next" },
    { line: 6, text: "    # Phase 2: reverse second half" },
    { line: 7, text: "    prev, cur = None, slow" },
    { line: 8, text: "    while cur:" },
    { line: 9, text: "        nxt = cur.next" },
    { line: 10, text: "        cur.next = prev; prev = cur; cur = nxt" },
    { line: 11, text: "    # Phase 3: compare both halves" },
    { line: 12, text: "    left, right = head, prev" },
    { line: 13, text: "    while right:" },
    { line: 14, text: "        if left.val != right.val: return False" },
    { line: 15, text: "        left = left.next; right = right.next" },
    { line: 16, text: "    return True" },
];

const EXAMPLES = [
    { label: "1→2→2→1", nums: [1, 2, 2, 1] },
    { label: "1→2→1", nums: [1, 2, 1] },
    { label: "1→2", nums: [1, 2] },
    { label: "1→2→3→2→1", nums: [1, 2, 3, 2, 1] },
];

function generateSteps(nums) {
    const steps = [];
    const n = nums.length;

    // Phase 1: find middle
    let slow = 0, fast = 0;
    steps.push({ activeLine: 3, phase: 1, slow, fast, message: `Phase 1: slow=0, fast=0` });
    while (fast < n && fast + 1 < n) {
        slow++;
        fast += 2;
        steps.push({ activeLine: 5, phase: 1, slow, fast: Math.min(fast, n - 1), message: `slow→${slow}, fast→${Math.min(fast, n - 1)}` });
    }
    const midIdx = slow;

    // Phase 2: reverse second half — track reversed order
    const secondHalf = nums.slice(midIdx);
    const reversed = [...secondHalf].reverse();
    steps.push({ activeLine: 7, phase: 2, slow, fast, reversed: [], midIdx, message: `Phase 2: reverse from index ${midIdx}` });
    for (let i = 0; i < reversed.length; i++) {
        steps.push({ activeLine: 10, phase: 2, slow, fast, reversed: reversed.slice(0, i + 1), midIdx, message: `Reversed so far: [${reversed.slice(0, i + 1).join("→")}]` });
    }

    // Phase 3: compare
    const firstHalf = nums.slice(0, midIdx + (n % 2 === 0 ? 0 : 1)); // for odd, include middle in left only
    // Actually canonical: left starts at head, right starts at reversed head
    // reversed list has length = secondHalf.length
    steps.push({ activeLine: 12, phase: 3, cmpL: 0, cmpR: 0, reversed, midIdx, message: `Phase 3: compare left half vs reversed right half` });
    let ok = true;
    for (let i = 0; i < reversed.length; i++) {
        const lv = nums[i];
        const rv = reversed[i];
        const match = lv === rv;
        if (!match) ok = false;
        steps.push({
            activeLine: match ? 15 : 14, phase: 3, cmpL: i, cmpR: i, reversed, midIdx, match,
            message: match ? `nums[${i}]=${lv} == reversed[${i}]=${rv} ✓` : `nums[${i}]=${lv} != reversed[${i}]=${rv} → return False`,
        });
        if (!match) {
            steps.push({ activeLine: 14, phase: 3, cmpL: i, cmpR: i, reversed, midIdx, result: false, message: `Not a palindrome → return False` });
            return steps;
        }
    }
    steps.push({ activeLine: 16, phase: 3, cmpL: -1, cmpR: -1, reversed, midIdx, result: true, message: `All match → return True (palindrome!)` });
    return steps;
}

export default function PalindromeLinkedListVisualizer() {
    const [ex, setEx] = useState(EXAMPLES[0]);
    const steps = useMemo(() => generateSteps(ex.nums), [ex]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;
    const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

    const nums = ex.nums;
    const n = nums.length;
    const slow = step?.slow ?? 0;
    const fast = step?.fast ?? 0;
    const midIdx = step?.midIdx ?? -1;
    const phase = step?.phase ?? 1;

    return (
        <div className="pll-shell">
            <div className="pll-examples">
                {EXAMPLES.map(e => (
                    <button key={e.label} className={`pll-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>{e.label}</button>
                ))}
            </div>

            {/* Original list */}
            <div className="pll-panel">
                <div className="pll-panel-label">
                    {phase === 1 ? "Phase 1 — Find Middle (slow/fast pointers)" : phase === 2 ? "Phase 2 — Reverse Second Half" : "Phase 3 — Compare"}
                </div>
                <div className="pll-list">
                    {nums.map((v, i) => {
                        const isSlow = phase === 1 && i === slow;
                        const isFast = phase === 1 && i === fast;
                        const isSecond = midIdx >= 0 && i >= midIdx;
                        const isCmpL = phase === 3 && i === step?.cmpL;
                        const isCmpMismatch = isCmpL && step?.match === false;
                        return (
                            <div key={i} className="pll-node-wrap">
                                <motion.div
                                    className={`pll-node ${isSlow ? "slow" : ""} ${isFast ? "fast" : ""} ${isSecond && phase >= 2 ? "second" : ""} ${isCmpL ? (isCmpMismatch ? "mismatch" : "cmp") : ""}`}
                                    animate={{ scale: (isSlow || isFast || isCmpL) ? 1.15 : 1, y: (isSlow || isFast) ? -4 : 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                                    {v}
                                </motion.div>
                                {i < n - 1 && <span className="pll-arrow">→</span>}
                                <div className="pll-ptrs">
                                    {isSlow && <span className="pll-ptr slow">slow</span>}
                                    {isFast && <span className="pll-ptr fast">fast</span>}
                                </div>
                            </div>
                        );
                    })}
                    <span className="pll-null">→ null</span>
                </div>
            </div>

            {/* Reversed half (phases 2-3) */}
            {phase >= 2 && step?.reversed?.length > 0 && (
                <div className="pll-panel">
                    <div className="pll-panel-label">Reversed second half</div>
                    <div className="pll-list">
                        {step.reversed.map((v, i) => {
                            const isCmpR = phase === 3 && i === step?.cmpR;
                            const isMismatch = isCmpR && step?.match === false;
                            return (
                                <div key={i} className="pll-node-wrap">
                                    <motion.div className={`pll-node reversed ${isCmpR ? (isMismatch ? "mismatch" : "cmp") : ""}`}
                                        initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                                        {v}
                                    </motion.div>
                                    {i < step.reversed.length - 1 && <span className="pll-arrow">→</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {step?.result != null && (
                <div className={`pll-result ${step.result ? "ok" : "fail"}`}>
                    {step.result ? `✓ [${nums.join("→")}] is a palindrome` : `✗ [${nums.join("→")}] is NOT a palindrome`}
                </div>
            )}

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
            {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
            <div className="pll-status">{step?.message ?? "Press Play to begin."}</div>
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
        </div>
    );
}
