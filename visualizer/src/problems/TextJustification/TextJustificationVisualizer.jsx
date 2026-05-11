import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./TextJustificationVisualizer.css";

const SOLUTION_CODE = [
  { line: 1,  text: "def fullJustify(words, maxWidth):" },
  { line: 2,  text: "    lines, cur, cur_len = [], [], 0" },
  { line: 3,  text: "    for word in words:" },
  { line: 4,  text: "        if cur_len + len(word) + len(cur) > maxWidth:" },
  { line: 5,  text: "            lines.append(cur); cur, cur_len = [], 0" },
  { line: 6,  text: "        cur.append(word); cur_len += len(word)" },
  { line: 7,  text: "    lines.append(cur)  # last line" },
  { line: 8,  text: "    for i, line in enumerate(lines):" },
  { line: 9,  text: "        if i == len(lines)-1 or len(line)==1:" },
  { line: 10, text: "            result.append(left_justify(line))" },
  { line: 11, text: "        else:" },
  { line: 12, text: "            result.append(full_justify(line, maxWidth))" },
];

const EXAMPLES = [
  { label: "Ex 1", words: ["This","is","an","example","of","text","justification"], maxWidth: 16 },
  { label: "Ex 2", words: ["What","must","be","acknowledgment","shall","be"], maxWidth: 16 },
  { label: "Ex 3", words: ["the","quick","brown","fox","jumps","over","the","lazy","dog"], maxWidth: 12 },
];

function fullJustify(words, maxWidth) {
  // Pack words into lines
  const lines = [];
  let cur = [], curLen = 0;
  for (const word of words) {
    if (curLen + word.length + cur.length > maxWidth) {
      lines.push(cur);
      cur = []; curLen = 0;
    }
    cur.push(word);
    curLen += word.length;
  }
  lines.push(cur);

  // Format each line
  return lines.map((line, i) => {
    const isLast = i === lines.length - 1;
    const wordLen = line.reduce((a, w) => a + w.length, 0);
    if (isLast || line.length === 1) {
      return line.join(" ").padEnd(maxWidth, " ");
    }
    const gaps = line.length - 1;
    const totalSpaces = maxWidth - wordLen;
    const base = Math.floor(totalSpaces / gaps);
    const extra = totalSpaces % gaps;
    let result = "";
    for (let j = 0; j < line.length; j++) {
      result += line[j];
      if (j < gaps) result += " ".repeat(base + (j < extra ? 1 : 0));
    }
    return result;
  });
}

function generateSteps(words, maxWidth) {
  const steps = [];
  const lines = [];
  let cur = [], curLen = 0;

  steps.push({ activeLine: 2, lines: [], cur: [], curLen: 0, wordIdx: -1, phase: "init", message: `Pack words into lines of width ≤ ${maxWidth}` });

  for (let wi = 0; wi < words.length; wi++) {
    const word = words[wi];
    const wouldFit = curLen + word.length + cur.length <= maxWidth;
    steps.push({
      activeLine: 4, lines: lines.map(l => [...l]), cur: [...cur], curLen, wordIdx: wi, phase: "check",
      message: `"${word}" (len=${word.length}): cur_len=${curLen}+gaps=${cur.length}+word=${word.length}=${curLen+cur.length+word.length} ${wouldFit ? "≤" : ">"} ${maxWidth}`,
    });
    if (!wouldFit) {
      lines.push([...cur]);
      steps.push({
        activeLine: 5, lines: lines.map(l => [...l]), cur: [...cur], curLen, wordIdx: wi, phase: "newline",
        message: `Line ${lines.length - 1} full → [${cur.join(", ")}]`,
      });
      cur = []; curLen = 0;
    }
    cur.push(word); curLen += word.length;
    steps.push({
      activeLine: 6, lines: lines.map(l => [...l]), cur: [...cur], curLen, wordIdx: wi, phase: "add",
      message: `Add "${word}" to current line. cur=[${cur.join(", ")}]`,
    });
  }
  lines.push([...cur]);
  steps.push({
    activeLine: 7, lines: lines.map(l => [...l]), cur: [...cur], curLen, wordIdx: -1, phase: "last",
    message: `Last line: [${cur.join(", ")}]`,
  });

  // Format phase
  const justified = fullJustify(words, maxWidth);
  for (let i = 0; i < lines.length; i++) {
    const isLast = i === lines.length - 1;
    steps.push({
      activeLine: isLast || lines[i].length === 1 ? 10 : 12,
      lines: lines.map(l => [...l]), justified: justified.slice(0, i + 1),
      wordIdx: -1, phase: isLast ? "left-justify" : "full-justify", lineIdx: i,
      message: `Line ${i}: "${justified[i]}"`,
    });
  }

  steps.push({
    activeLine: 8, lines: lines.map(l => [...l]), justified, wordIdx: -1, phase: "done", done: true,
    message: `Done! ${justified.length} justified line(s).`,
  });
  return steps;
}

export default function TextJustificationVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.words, ex.maxWidth), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

  const lines = step?.lines ?? [];
  const cur = step?.cur ?? [];
  const wordIdx = step?.wordIdx ?? -1;
  const justified = step?.justified ?? [];
  const phase = step?.phase ?? "init";
  const lineIdx = step?.lineIdx ?? -1;
  const maxWidth = ex.maxWidth;

  return (
    <div className="tj-shell">
      <div className="tj-examples">
        {EXAMPLES.map(e => (
          <button key={e.label} className={`tj-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
            {e.label} (w={e.maxWidth})
          </button>
        ))}
      </div>

      <div className="tj-panel">
        <div className="tj-panel-label">Words</div>
        <div className="tj-words">
          {ex.words.map((w, idx) => (
            <motion.span
              key={idx}
              className={`tj-word ${idx === wordIdx ? "active-word" : ""}`}
              animate={{ scale: idx === wordIdx ? 1.12 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              {w}
            </motion.span>
          ))}
        </div>
      </div>

      {(lines.length > 0 || cur.length > 0) && (
        <div className="tj-panel">
          <div className="tj-panel-label">Lines packed</div>
          {lines.map((line, i) => (
            <div key={i} className={`tj-line-row ${i === lineIdx ? "active-line" : ""}`}>
              <span className="tj-line-num">{i}</span>
              <div className="tj-line-box">{line.join(" ")}</div>
            </div>
          ))}
          {cur.length > 0 && (
            <div className="tj-line-row current">
              <span className="tj-line-num">cur</span>
              <div className="tj-line-box current-box">{cur.join(" ")}</div>
            </div>
          )}
        </div>
      )}

      {justified.length > 0 && (
        <div className="tj-panel">
          <div className="tj-panel-label">Justified Output (width={maxWidth})</div>
          <AnimatePresence>
            {justified.map((line, i) => (
              <motion.div key={i} className="tj-justified-line"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0 }}>
                <span className="tj-line-num">{i}</span>
                <code className="tj-justified-text">|{line}|</code>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="tj-trackers">
        <div className="tj-tracker">
          <span className="tj-tracker-label">Phase</span>
          <span className={`tj-tracker-val tj-phase ${phase.split("-")[0]}`}>{phase.replace("-", " ")}</span>
        </div>
        <div className="tj-tracker">
          <span className="tj-tracker-label">Lines</span>
          <span className="tj-tracker-val">{lines.length + (cur.length > 0 ? 1 : 0)}</span>
        </div>
        <div className="tj-tracker">
          <span className="tj-tracker-label">maxWidth</span>
          <span className="tj-tracker-val">{maxWidth}</span>
        </div>
      </div>

      {step?.done && <div className="tj-result">✓ {justified.length} justified lines</div>}

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      <div className="tj-status">{step?.message ?? "Press Play to begin."}</div>
      <PlaybackControls
        isPlaying={isPlaying} isDone={isDone} speed={speed}
        onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
        prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
        onSpeedChange={e => setSpeed(Number(e.target.value))}
      />
    </div>
  );
}
