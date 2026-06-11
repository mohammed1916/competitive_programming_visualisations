import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./LengthOfLastWordVisualizer.css";

const SOLUTION_CODE = [
  { line: 1, text: "def lengthOfLastWord(s):" },
  { line: 2, text: "    i = len(s) - 1" },
  { line: 3, text: "    while s[i] == ' ':  # skip trailing spaces" },
  { line: 4, text: "        i -= 1" },
  { line: 5, text: "    length = 0" },
  { line: 6, text: "    while i >= 0 and s[i] != ' ':" },
  { line: 7, text: "        length += 1" },
  { line: 8, text: "        i -= 1" },
  { line: 9, text: "    return length" },
];

const EXAMPLES = [
  { label: "Ex 1", s: "Hello World" },
  { label: "Ex 2", s: "   fly me   to   the moon  " },
  { label: "Ex 3", s: "luffy is still joyboy" },
];

function generateSteps(sIn) {
  const steps = [];
  const chars = sIn.split("");
  let i = chars.length - 1;
  steps.push({ activeLine: 2, i, length: 0, phase: "init", message: `Start at i=${i} (rightmost char)` });

  // skip trailing spaces
  while (i >= 0 && chars[i] === " ") {
    steps.push({ activeLine: 3, i, length: 0, phase: "skip", message: `s[${i}]=' ' (space) — skip` });
    i--;
    steps.push({ activeLine: 4, i, length: 0, phase: "skip", message: `i-- → i=${i}` });
  }
  steps.push({ activeLine: 5, i, length: 0, phase: "count", message: `First non-space at i=${i}: '${chars[i] ?? ""}'. Init length=0` });

  let length = 0;
  while (i >= 0 && chars[i] !== " ") {
    steps.push({ activeLine: 6, i, length, phase: "count", message: `s[${i}]='${chars[i]}' ≠ space → count` });
    length++;
    steps.push({ activeLine: 7, i, length, phase: "count", message: `length++ → ${length}` });
    i--;
    steps.push({ activeLine: 8, i, length, phase: "count", message: `i-- → ${i}` });
  }
  steps.push({ activeLine: 9, i, length, phase: "done", done: true, message: `Return ${length}` });
  return steps;
}

export default function LengthOfLastWordVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.s), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

  const chars = ex.s.split("");
  const i = step?.i ?? chars.length - 1;
  const length = step?.length ?? 0;
  const phase = step?.phase ?? "init";

  // determine which chars are part of the last word (for done highlight)
  const lastWordEnd = (() => {
    let j = chars.length - 1;
    while (j >= 0 && chars[j] === " ") j--;
    let end = j;
    while (j >= 0 && chars[j] !== " ") j--;
    return { start: j + 1, end };
  })();

  return (
    <div className="lw-shell">
      <div className="lw-examples">
        {EXAMPLES.map(e => (
          <button key={e.label} className={`lw-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
            {e.label}: "{e.s.trim().slice(-10)}{e.s.trim().length > 10 ? "…" : ""}"
          </button>
        ))}
      </div>

      <div className="lw-panel">
        <div className="lw-panel-label">String Characters</div>
        <div className="lw-chars">
          {chars.map((ch, idx) => {
            const isActive = idx === i;
            const inWord = phase === "count" && idx >= i && idx <= lastWordEnd.end;
            const isDoneHighlight = phase === "done" && idx >= lastWordEnd.start && idx <= lastWordEnd.end;
            const isSpace = ch === " ";
            return (
              <div key={idx} className="lw-char-col">
                <motion.div
                  className={`lw-char ${isSpace ? "space" : ""} ${isActive ? (phase === "skip" ? "skip-cell" : "count-cell") : ""} ${inWord ? "word-cell" : ""} ${isDoneHighlight ? "done-cell" : ""}`}
                  animate={{ scale: isActive ? 1.18 : 1, y: isActive ? -5 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  {isSpace ? "·" : ch}
                </motion.div>
                <div className="lw-idx">{idx}</div>
                {isActive && <div className={`lw-ptr ${phase === "skip" ? "skip-ptr" : "count-ptr"}`}>i</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="lw-trackers">
        <div className="lw-tracker">
          <span className="lw-tracker-label">i</span>
          <span className="lw-tracker-val">{i < 0 ? "-1" : i}</span>
        </div>
        <div className="lw-tracker">
          <span className="lw-tracker-label">length</span>
          <motion.span key={length} className="lw-tracker-val lw-len" initial={{ scale: 1.4 }} animate={{ scale: 1 }}>
            {length}
          </motion.span>
        </div>
        <div className="lw-tracker">
          <span className="lw-tracker-label">Phase</span>
          <span className={`lw-tracker-val lw-phase ${phase}`}>{phase}</span>
        </div>
      </div>

      {step?.done && <div className="lw-result">✓ Length of last word = {length}</div>}

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
      <div className="lw-status">{step?.message ?? "Press Play to begin."}</div>
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

      {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
    </div>
  );
}
