import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./WordLadderVisualizer.css";

const SOLUTION_CODE = [
  { line: 1, text: "def ladderLength(beginWord, endWord, wordList):" },
  { line: 2, text: "    wordSet = set(wordList)" },
  { line: 3, text: "    if endWord not in wordSet: return 0" },
  { line: 4, text: "    queue = deque([(beginWord, 1)])" },
  { line: 5, text: "    visited = {beginWord}" },
  { line: 6, text: "    while queue:" },
  { line: 7, text: "        word, steps = queue.popleft()" },
  { line: 8, text: "        for i in range(len(word)):" },
  { line: 9, text: "            for c in 'abcdefghijklmnopqrstuvwxyz':" },
  { line: 10, text: "                nw = word[:i] + c + word[i+1:]" },
  { line: 11, text: "                if nw == endWord: return steps+1" },
  { line: 12, text: "                if nw in wordSet and nw not in visited:" },
  { line: 13, text: "                    visited.add(nw)" },
  { line: 14, text: "                    queue.append((nw, steps+1))" },
  { line: 15, text: "    return 0" },
];

const EXAMPLES = [
  {
    label: "hit→cog",
    beginWord: "hit", endWord: "cog",
    wordList: ["hot", "dot", "dog", "lot", "log", "cog"],
  },
  {
    label: "hit→dog",
    beginWord: "hit", endWord: "dog",
    wordList: ["hot", "dot", "dog", "lot"],
  },
];

function oneAway(a, b) {
  let diff = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
  return diff === 1;
}

function generateSteps(beginWord, endWord, wordList) {
  const steps = [];
  const wordSet = new Set(wordList);

  if (!wordSet.has(endWord)) {
    steps.push({ activeLine: 3, queue: [], visited: new Set([beginWord]), curWord: null, path: [], result: 0, message: `endWord "${endWord}" not in wordList → return 0` });
    return steps;
  }

  const queue = [{ word: beginWord, steps: 1, path: [beginWord] }];
  const visited = new Set([beginWord]);
  // For visualization: store BFS layers
  const layers = [[beginWord]];
  let layerMap = { [beginWord]: 0 };

  steps.push({ activeLine: 4, queue: [...queue], visited: new Set(visited), curWord: beginWord, layers: layers.map(l => [...l]), layerMap: { ...layerMap }, result: null, message: `Init queue with "${beginWord}" (step 1)` });

  while (queue.length > 0) {
    const { word, steps: s, path } = queue.shift();
    steps.push({ activeLine: 7, queue: [...queue], visited: new Set(visited), curWord: word, layers: layers.map(l => [...l]), layerMap: { ...layerMap }, result: null, message: `Dequeue "${word}" (step ${s})` });

    // Try all one-letter mutations that are in wordSet
    for (const candidate of wordList) {
      if (!visited.has(candidate) && oneAway(word, candidate)) {
        if (candidate === endWord) {
          steps.push({ activeLine: 11, queue: [...queue], visited: new Set(visited), curWord: word, layers: layers.map(l => [...l]), layerMap: { ...layerMap }, result: s + 1, message: `"${candidate}" == endWord! Return ${s + 1}` });
          return steps;
        }
        visited.add(candidate);
        queue.push({ word: candidate, steps: s + 1, path: [...path, candidate] });
        const layer = s; // layer index = steps-1
        if (!layers[layer]) layers[layer] = [];
        layers[layer].push(candidate);
        layerMap[candidate] = layer;
        steps.push({ activeLine: 14, queue: [...queue], visited: new Set(visited), curWord: word, layers: layers.map(l => [...l]), layerMap: { ...layerMap }, result: null, message: `"${candidate}" one-away, not visited → enqueue (step ${s + 1})` });
      }
    }
    // Also check endWord directly
    if (oneAway(word, endWord) && !visited.has(endWord)) {
      steps.push({ activeLine: 11, queue: [...queue], visited: new Set(visited), curWord: word, layers: layers.map(l => [...l]), layerMap: { ...layerMap }, result: s + 1, message: `"${endWord}" is one-away! Return ${s + 1}` });
      return steps;
    }
  }

  steps.push({ activeLine: 15, queue: [], visited: new Set(visited), curWord: null, layers: layers.map(l => [...l]), layerMap: { ...layerMap }, result: 0, message: `Queue empty — no path found. Return 0.` });
  return steps;
}

export default function WordLadderVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.beginWord, ex.endWord, ex.wordList), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);

  const allWords = [ex.beginWord, ...ex.wordList];

  return (
    <div className="wl-shell">
      <div className="wl-examples">
        {EXAMPLES.map((e) => (
          <button key={e.label} className={`wl-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>{e.label}</button>
        ))}
      </div>

      <div className="wl-strings">
        <span className="wl-lbl begin">begin:</span><span className="wl-val">{ex.beginWord}</span>
        <span className="wl-lbl end">end:</span><span className="wl-val">{ex.endWord}</span>
        <span className="wl-lbl list">list:</span><span className="wl-val">[{ex.wordList.join(", ")}]</span>
      </div>

      {/* BFS layers */}
      <div className="wl-panel">
        <div className="wl-panel-label">BFS layers</div>
        <div className="wl-layers">
          {(step?.layers ?? [[ex.beginWord]]).map((layer, li) => (
            <div key={li} className="wl-layer">
              <span className="wl-layer-num">step {li + 1}</span>
              <div className="wl-layer-words">
                {layer.map((w) => {
                  const isCur = step?.curWord === w;
                  const isVisited = step?.visited?.has(w);
                  const isEnd = w === ex.endWord;
                  return (
                    <motion.div key={w} className={`wl-word ${isCur ? "cur" : isEnd ? "end" : isVisited ? "visited" : "pending"}`}
                      animate={{ scale: isCur ? 1.15 : 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                      {w}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
          {/* Show endWord if found */}
          {step?.result != null && step.result > 0 && (
            <div className="wl-layer">
              <span className="wl-layer-num">step {step.result}</span>
              <div className="wl-layer-words">
                <motion.div className="wl-word end" initial={{ scale: 0 }} animate={{ scale: 1 }}>{ex.endWord}</motion.div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Queue */}
      <div className="wl-panel">
        <div className="wl-panel-label">Queue</div>
        <div className="wl-queue-row">
          <AnimatePresence mode="popLayout">
            {(step?.queue ?? []).slice(0, 8).map(({ word, steps: s }, i) => (
              <motion.div key={`${word}-${s}`} className="wl-q-item"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <span className="wl-q-word">{word}</span>
                <span className="wl-q-step">s={s}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          {(step?.queue?.length ?? 0) === 0 && <span className="wl-empty">empty</span>}
        </div>
      </div>

      {step?.result != null && (
        <div className={`wl-result ${step.result > 0 ? "found" : "notfound"}`}>
          {step.result > 0 ? `✓ Shortest path length: ${step.result}` : "✗ No path found (return 0)"}
        </div>
      )}

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
      <div className="wl-status">{step?.message ?? "Press Play to begin."}</div>
      <PlaybackControls
        isPlaying={isPlaying} isDone={isDone} speed={speed}
        onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
        prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
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
