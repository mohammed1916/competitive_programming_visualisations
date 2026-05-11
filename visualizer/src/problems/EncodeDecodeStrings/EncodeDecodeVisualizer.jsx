import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./EncodeDecodeVisualizer.css";

const ENCODE_CODE = [
    { line: 1, text: "def encode(strs):" },
    { line: 2, text: '    return "".join(' },
    { line: 3, text: "        f\"{len(s)}#{s}\"" },
    { line: 4, text: "        for s in strs)" },
];

const DECODE_CODE = [
    { line: 5, text: "def decode(s):" },
    { line: 6, text: "    res, i = [], 0" },
    { line: 7, text: "    while i < len(s):" },
    { line: 8, text: "        j = s.index('#', i)" },
    { line: 9, text: "        length = int(s[i:j])" },
    { line: 10, text: "        res.append(s[j+1 : j+1+length])" },
    { line: 11, text: "        i = j + 1 + length" },
    { line: 12, text: "    return res" },
];

function generateSteps(strs) {
    const steps = [];

    // ── ENCODE ──
    let encoded = "";
    steps.push({
        phase: "encode_init", activeLine: 1,
        encoded: "", decodeIndex: null, decodedSoFar: [],
        highlightWord: null, highlightEncoded: null,
        message: "Start encoding",
    });

    for (let i = 0; i < strs.length; i++) {
        const s = strs[i];
        const chunk = `${s.length}#${s}`;
        encoded += chunk;
        steps.push({
            phase: "encode_word", activeLine: 3,
            encoded,
            decodeIndex: null, decodedSoFar: [],
            highlightWord: i,
            highlightEncoded: { start: encoded.length - chunk.length, len: chunk.length },
            message: `Encode "${s}": prepend length → "${chunk}"`,
        });
    }

    steps.push({
        phase: "encode_done", activeLine: 4,
        encoded, decodeIndex: null, decodedSoFar: [],
        highlightWord: null, highlightEncoded: null,
        message: `Encoded string: "${encoded}"`,
    });

    // ── DECODE ──
    steps.push({
        phase: "decode_init", activeLine: 6,
        encoded, decodeIndex: 0, decodedSoFar: [],
        highlightWord: null, highlightEncoded: null,
        message: "Start decoding — i=0",
    });

    let i2 = 0;
    const decodedSoFar = [];
    while (i2 < encoded.length) {
        const j = encoded.indexOf("#", i2);
        const length = parseInt(encoded.slice(i2, j), 10);
        steps.push({
            phase: "decode_find_hash", activeLine: 8,
            encoded, decodeIndex: i2, decodedSoFar: [...decodedSoFar],
            highlightEncoded: { start: i2, len: j - i2 + 1 },
            message: `i=${i2}: find '#' at j=${j}, length=${length}`,
        });
        const word = encoded.slice(j + 1, j + 1 + length);
        decodedSoFar.push(word);
        steps.push({
            phase: "decode_extract", activeLine: 10,
            encoded, decodeIndex: j + 1 + length, decodedSoFar: [...decodedSoFar],
            highlightEncoded: { start: j + 1, len: length },
            message: `Extract s[${j + 1}:${j + 1 + length}] = "${word}"`,
        });
        i2 = j + 1 + length;
    }

    steps.push({
        phase: "decode_done", activeLine: 12,
        encoded, decodeIndex: i2, decodedSoFar: [...decodedSoFar],
        highlightEncoded: null,
        message: `Decoded: [${decodedSoFar.map((s) => `"${s}"`).join(", ")}]`,
    });

    return steps;
}

const EXAMPLES = [
    { label: '["lint","code","love","you"]', strs: ["lint", "code", "love", "you"] },
    { label: '["we","say",":","yes"]', strs: ["we", "say", ":", "yes"] },
    { label: '[""]', strs: [""] },
    { label: '["a","b"]', strs: ["a", "b"] },
];

export default function EncodeDecodeVisualizer() {
    const [strsInput, setStrsInput] = useState('["lint","code","love","you"]');

    const { strs, inputErr } = useMemo(() => {
        try {
            const p = JSON.parse(strsInput);
            if (!Array.isArray(p)) throw new Error("Must be array");
            return { strs: p.map(String), inputErr: "" };
        } catch (e) {
            return { strs: ["lint", "code", "love", "you"], inputErr: e.message };
        }
    }, [strsInput]);

    const steps = useMemo(() => generateSteps(strs), [strs]);
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
        usePlaybackState(steps.length);
    const step = stepIndex >= 0 ? steps[stepIndex] : null;

    const applyExample = useCallback(
        (ex) => { setStrsInput(JSON.stringify(ex.strs)); handleReset(); },
        [handleReset]
    );

    const encoded = step?.encoded ?? "";
    const hl = step?.highlightEncoded;

    return (
        <div className="ed-shell">
            <div className="ed-controls-row">
                <div className="ed-examples">
                    {EXAMPLES.map((ex) => (
                        <button key={ex.label} className="ed-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input className="ed-input" value={strsInput}
                        onChange={(e) => { setStrsInput(e.target.value); handleReset(); }} />
                    {inputErr && <span className="ed-error">{inputErr}</span>}
                </div>
            </div>

            <div className="ed-two-col">
                {/* Input words */}
                <div className="ed-panel">
                    <div className="ed-panel-label">Input array</div>
                    <div className="ed-words-row">
                        {strs.map((s, i) => (
                            <div key={i} className={`ed-word ${step?.highlightWord === i ? "active" : ""}`}>
                                {`"${s}"`}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Encoded string */}
                <div className="ed-panel">
                    <div className="ed-panel-label">Encoded string</div>
                    <div className="ed-encoded-row">
                        {encoded.split("").map((c, i) => {
                            const isHl = hl && i >= hl.start && i < hl.start + hl.len;
                            return (
                                <motion.div key={i} className={`ed-enc-char ${isHl ? "hl" : ""}`}
                                    animate={{ scale: isHl ? 1.1 : 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                                    {c === " " ? "\u00a0" : c}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Decoded results */}
            {(step?.decodedSoFar?.length ?? 0) > 0 && (
                <div className="ed-panel">
                    <div className="ed-panel-label">Decoded so far</div>
                    <div className="ed-words-row">
                        <AnimatePresence mode="popLayout">
                            {step.decodedSoFar.map((s, i) => (
                                <motion.div key={i} className="ed-word decoded"
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}>
                                    {`"${s}"`}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            <CodeTracePanel step={step} codeLines={[...ENCODE_CODE, ...DECODE_CODE]} />
            <div className="ed-status">{step?.message ?? "Press Play to begin."}</div>
            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
                prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={(e) => setSpeed(Number(e.target.value))}
            />
        </div>
    );
}
