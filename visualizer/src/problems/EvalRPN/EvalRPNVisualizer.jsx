import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./EvalRPNVisualizer.css";

const SOLUTION_CODE = [
    { line: 1, text: "def evalRPN(tokens):" },
    { line: 2, text: "    stack = []" },
    { line: 3, text: "    for t in tokens:" },
    { line: 4, text: "        if t in '+-*/':" },
    { line: 5, text: "            b, a = stack.pop(), stack.pop()" },
    { line: 6, text: "            if t == '+': stack.append(a + b)" },
    { line: 7, text: "            elif t == '-': stack.append(a - b)" },
    { line: 8, text: "            elif t == '*': stack.append(a * b)" },
    { line: 9, text: "            else: stack.append(int(a / b))" },
    { line: 10, text: "        else:" },
    { line: 11, text: "            stack.append(int(t))" },
    { line: 12, text: "    return stack[0]" },
];

function generateSteps(tokens) {
    const steps = [];
    const stack = [];
    steps.push({ activeLine: 2, ti: -1, stack: [], message: "Initialize empty stack." });

    for (let ti = 0; ti < tokens.length; ti++) {
        const t = tokens[ti];
        if (["+", "-", "*", "/"].includes(t)) {
            steps.push({ activeLine: 4, ti, stack: [...stack], message: `Token "${t}" is an operator.` });
            const b = stack.pop(), a = stack.pop();
            steps.push({ activeLine: 5, ti, stack: [...stack], a, b, op: t, message: `Pop b=${b}, a=${a}` });
            let result;
            if (t === "+") { result = a + b; steps.push({ activeLine: 6, ti, stack: [...stack], a, b, op: t, message: `${a} + ${b} = ${result}` }); }
            else if (t === "-") { result = a - b; steps.push({ activeLine: 7, ti, stack: [...stack], a, b, op: t, message: `${a} - ${b} = ${result}` }); }
            else if (t === "*") { result = a * b; steps.push({ activeLine: 8, ti, stack: [...stack], a, b, op: t, message: `${a} * ${b} = ${result}` }); }
            else { result = Math.trunc(a / b); steps.push({ activeLine: 9, ti, stack: [...stack], a, b, op: t, message: `trunc(${a} / ${b}) = ${result}` }); }
            stack.push(result);
            steps.push({ activeLine: t === "+" ? 6 : t === "-" ? 7 : t === "*" ? 8 : 9, ti, stack: [...stack], message: `Push ${result}. Stack: [${stack.join(",")}]` });
        } else {
            steps.push({ activeLine: 11, ti, stack: [...stack], message: `Token "${t}" is a number — push ${parseInt(t, 10)}` });
            stack.push(parseInt(t, 10));
            steps.push({ activeLine: 11, ti, stack: [...stack], message: `Stack: [${stack.join(",")}]` });
        }
    }
    steps.push({ activeLine: 12, ti: tokens.length, stack: [...stack], message: `Result = ${stack[0]}` });
    return steps;
}

const EXAMPLES = [
    { label: '["2","1","+","3","*"]', tokens: ["2", "1", "+", "3", "*"] },
    { label: '["4","13","5","/","+"]', tokens: ["4", "13", "5", "/", "+"] },
    { label: '["10","6","9","3","+","-11","*","/","*","17","+","5","+"]', tokens: ["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"] },
];

function parseTokens(str) {
    try { const p = JSON.parse(str); if (!Array.isArray(p)) throw new Error(); return { tokens: p.map(String), err: "" }; }
    catch { return { tokens: [], err: "Invalid JSON array" }; }
}

export default function EvalRPNVisualizer() {
    const [input, setInput] = useState('["2","1","+","3","*"]');

    const { tokens, err } = useMemo(() => parseTokens(input), [input]);
    const steps = useMemo(() => (tokens.length ? generateSteps(tokens) : []), [tokens]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;

    const applyExample = useCallback(
        (ex) => { setInput(JSON.stringify(ex.tokens)); handleReset(); },
        [handleReset]
    );

    return (
        <div className="rpn-shell">
            <div className="rpn-controls-row">
                <div className="rpn-examples">
                    {EXAMPLES.map((ex) => (
                        <button key={ex.label} className="rpn-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input className="rpn-input" value={input} onChange={(e) => { setInput(e.target.value); handleReset(); }} />
                    {err && <span className="rpn-error">{err}</span>}
                </div>
            </div>

            {/* Tokens */}
            <div className="rpn-panel">
                <div className="rpn-panel-label">Tokens</div>
                <div className="rpn-tokens-row">
                    {tokens.map((t, i) => {
                        const isOp = ["+", "-", "*", "/"].includes(t);
                        const isCurrent = step?.ti === i;
                        return (
                            <motion.div key={i}
                                className={`rpn-token ${isOp ? "op" : "num"} ${isCurrent ? "current" : ""}`}
                                animate={{ scale: isCurrent ? 1.2 : 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                                {t}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Stack */}
            <div className="rpn-panel">
                <div className="rpn-panel-label">Stack (top on right)</div>
                <div className="rpn-stack-row">
                    <AnimatePresence mode="popLayout">
                        {(step?.stack ?? []).map((v, i) => (
                            <motion.div key={`${i}-${v}`}
                                className={`rpn-stack-cell ${i === (step?.stack?.length ?? 0) - 1 ? "top" : ""}`}
                                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                                transition={{ type: "spring", stiffness: 380, damping: 22 }}>
                                {v}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {(step?.stack?.length ?? 0) === 0 && <span className="rpn-empty">empty</span>}
                </div>
                {step?.a != null && (
                    <div className="rpn-op-display">
                        <span className="rpn-op-a">{step.a}</span>
                        <span className="rpn-op-sym">{step.op}</span>
                        <span className="rpn-op-b">{step.b}</span>
                    </div>
                )}
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
            <div className="rpn-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
            />
        </div>
    );
}
