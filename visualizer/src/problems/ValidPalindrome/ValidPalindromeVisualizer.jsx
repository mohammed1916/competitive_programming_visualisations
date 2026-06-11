import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { useCodeVisualConnectivity } from "../../hooks/useCodeVisualConnectivity";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./ValidPalindromeVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def isPalindrome(s):" },
    { line: 2, text: "    s = ''.join(c.lower() for c in s" },
    { line: 3, text: "                if c.isalnum())" },
    { line: 4, text: "    l, r = 0, len(s) - 1" },
    { line: 5, text: "    while l < r:" },
    { line: 6, text: "        if s[l] != s[r]: return False" },
    { line: 7, text: "        l += 1; r -= 1" },
    { line: 8, text: "    return True" },
];

function generateSteps(raw) {
    const steps = [];
    const cleaned = raw
        .split("")
        .filter((c) => /[a-z0-9]/i.test(c))
        .map((c) => c.toLowerCase())
        .join("");

    steps.push({
        phase: "clean",
        activeLine: 2,
        cleaned,
        l: 0,
        r: cleaned.length - 1,
        result: null,
        message: `Cleaned string: "${cleaned}" (${cleaned.length} chars)`,
    });

    let l = 0,
        r = cleaned.length - 1;

    steps.push({
        phase: "init",
        activeLine: 4,
        cleaned,
        l,
        r,
        result: null,
        message: `l=0, r=${r}`,
    });

    while (l < r) {
        const match = cleaned[l] === cleaned[r];
        steps.push({
            phase: match ? "match" : "mismatch",
            activeLine: match ? 7 : 6,
            cleaned,
            l,
            r,
            result: match ? null : false,
            message: match
                ? `s[${l}]='${cleaned[l]}' == s[${r}]='${cleaned[r]}' ✓ — move pointers`
                : `s[${l}]='${cleaned[l]}' != s[${r}]='${cleaned[r]}' ✗ — return False`,
        });
        if (!match) return steps;
        l++;
        r--;
    }

    steps.push({
        phase: "done",
        activeLine: 8,
        cleaned,
        l,
        r,
        result: true,
        message: "Pointers crossed — return True",
    });
    return steps;
}

const EXAMPLES = [
    { label: "A man a plan", s: "A man, a plan, a canal: Panama" },
    { label: "race a car", s: "race a car" },
    { label: `" "`, s: " " },
    { label: "Was it a car", s: "Was it a car or a cat I saw?" },
];

export default function ValidPalindromeVisualizer() {
    const [input, setInput] = useState("A man, a plan, a canal: Panama");
    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

    const steps = useMemo(
        () =>
            generateSteps(input).map((current) => ({
                ...current,
                relatedLines: current.relatedLines ?? (current.activeLine != null ? [current.activeLine] : []),
            })),
        [input]
    );
    const {
        stepIndex,
        setStepIndex,
        stepForward,
        stepBack,
        togglePlay,
        handleReset,
        isPlaying,
        speed,
        setSpeed,
        isDone,
    } = usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;

    const connectivity = useCodeVisualConnectivity({
        steps,
        stepIndex,
        onStepJump: setStepIndex,
    });

    const applyExample = useCallback(
        (ex) => {
            setInput(ex.s);
            handleReset();
        },
        [handleReset]
    );

    const cleaned = step?.cleaned ?? "";

    return (
        <div className="vp-shell">
            <div className="vp-controls-row">
                <div className="vp-examples">
                    {EXAMPLES.map((ex) => (
                        <button
                            key={ex.label}
                            className="vp-chip"
                            onClick={() => applyExample(ex)}
                        >
                            {ex.label}
                        </button>
                    ))}
                </div>
                <input
                    className="vp-input"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        handleReset();
                    }}
                />
            </div>

            {/* Cleaned string with two-pointer highlights */}
            <div className="vp-panel">
                <div className="vp-panel-label">Cleaned string (alphanumeric, lowercase)</div>
                <div className="vp-chars-row">
                    {cleaned.split("").map((c, i) => {
                        const isL = i === step?.l;
                        const isR = i === step?.r;
                        const between =
                            step?.l != null && i > step.l && i < step.r;
                        const done = step?.result === true;
                        return (
                            <motion.div
                                key={i}
                                className={`vp-char ${isL ? "ptr-l" : ""} ${isR ? "ptr-r" : ""} ${between ? "between" : ""
                                    } ${done ? "palindrome" : ""} ${step?.result === false && (isL || isR) ? "bad" : ""
                                    }`}
                                animate={{ scale: isL || isR ? 1.18 : 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                            >
                                {c}
                                {isL && <span className="vp-ptr-label">L</span>}
                                {isR && <span className="vp-ptr-label">R</span>}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {step?.result != null && (
                <div className={`vp-result ${step.result ? "true" : "false"}`}>
                    {step.result ? "✓ isPalindrome = true" : "✗ isPalindrome = false"}
                </div>
            )}

            <CodeTracePanel
                step={step}
                codeLines={SOLUTION_CODE}
                highlightedLines={connectivity.highlightedLines}
                onLineSelect={connectivity.handleLineSelect}
                onActiveLineDomChange={setActiveLineDom}
            />
            <div className="vp-status">{step?.message ?? "Press Play to begin."}</div>
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
