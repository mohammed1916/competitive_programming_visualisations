import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./SkylineProblemVisualizer.css";

const SOLUTION_CODE = [
  { line: 1,  text: "def getSkyline(buildings):" },
  { line: 2,  text: "    events = []" },
  { line: 3,  text: "    for l, r, h in buildings:" },
  { line: 4,  text: "        events.append((l, -h))  # start" },
  { line: 5,  text: "        events.append((r,  h))  # end" },
  { line: 6,  text: "    events.sort()" },
  { line: 7,  text: "    heap = [0]; result = []" },
  { line: 8,  text: "    prev = 0" },
  { line: 9,  text: "    for x, h in events:" },
  { line: 10, text: "        if h < 0: heappush(heap, h)   # start" },
  { line: 11, text: "        else:     heap.remove(h)       # end" },
  { line: 12, text: "        cur = -heap[0]" },
  { line: 13, text: "        if cur != prev:" },
  { line: 14, text: "            result.append([x, cur])" },
  { line: 15, text: "            prev = cur" },
];

const EXAMPLES = [
  { label: "Ex 1", buildings: [[2,9,10],[3,7,15],[5,12,12],[15,20,10],[19,24,8]] },
  { label: "Ex 2", buildings: [[0,2,3],[2,5,3]] },
  { label: "Ex 3", buildings: [[1,2,1],[1,2,2],[1,2,3]] },
];

function generateSteps(buildings) {
  const steps = [];

  // Build events
  const events = [];
  for (const [l, r, h] of buildings) {
    events.push([l, -h]);
    events.push([r, h]);
  }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  steps.push({ activeLine: 6, events: [...events], heap: [0], result: [], prev: 0, evtIdx: -1, phase: "sort", message: `${events.length} events sorted.` });

  const heap = [0];
  const result = [];
  let prev = 0;

  // Helper: max-heap via sorted array simulation
  function heapPush(h) { heap.push(-h); heap.sort((a, b) => b - a); }
  function heapRemove(h) { const idx = heap.indexOf(-h); if (idx >= 0) heap.splice(idx, 1); }
  function heapMax() { return heap.length > 0 ? -heap[0] : 0; }

  for (let i = 0; i < events.length; i++) {
    const [x, h] = events[i];
    const isStart = h < 0;
    steps.push({
      activeLine: 9, events, heap: [...heap], result: [...result], prev, evtIdx: i, phase: "process",
      message: `Event (x=${x}, h=${isStart ? "start -" + (-h) : "end " + h})`,
    });
    if (isStart) {
      heapPush(-h);
      steps.push({ activeLine: 10, events, heap: [...heap], result: [...result], prev, evtIdx: i, phase: "push", message: `Push height ${-h} to heap. Max=${heapMax()}` });
    } else {
      heapRemove(h);
      steps.push({ activeLine: 11, events, heap: [...heap], result: [...result], prev, evtIdx: i, phase: "remove", message: `Remove height ${h} from heap. Max=${heapMax()}` });
    }
    const cur = heapMax();
    if (cur !== prev) {
      result.push([x, cur]);
      prev = cur;
      steps.push({ activeLine: 14, events, heap: [...heap], result: [...result], prev, evtIdx: i, phase: "emit", message: `Height changed → emit [${x}, ${cur}]` });
    }
  }

  steps.push({ activeLine: 14, events, heap: [...heap], result: [...result], prev, evtIdx: -1, phase: "done", done: true, message: `Skyline: ${result.map(p => "[" + p + "]").join(", ")}` });
  return steps;
}

export default function SkylineProblemVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex.buildings), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

  const events = step?.events ?? [];
  const heap = step?.heap ?? [0];
  const result = step?.result ?? [];
  const evtIdx = step?.evtIdx ?? -1;
  const phase = step?.phase ?? "init";

  // Derive skyline drawing params
  const buildings = ex.buildings;
  const maxX = Math.max(...buildings.map(b => b[1]), 0) + 2;
  const maxH = Math.max(...buildings.map(b => b[2]), 1);
  const SVG_W = 320, SVG_H = 100;
  const xScale = (SVG_W - 20) / maxX;
  const hScale = (SVG_H - 10) / maxH;

  // Build skyline polyline from result points
  const pts = result;
  let skylinePoints = [];
  for (let i = 0; i < pts.length; i++) {
    const [x, h] = pts[i];
    const px = 10 + x * xScale;
    const py = SVG_H - h * hScale;
    if (i === 0) skylinePoints.push(`${px},${SVG_H}`);
    skylinePoints.push(`${px},${py}`);
    const nextX = i + 1 < pts.length ? pts[i + 1][0] : maxX;
    skylinePoints.push(`${10 + nextX * xScale},${py}`);
  }
  if (skylinePoints.length > 0) skylinePoints.push(`${10 + maxX * xScale},${SVG_H}`);

  return (
    <div className="sk-shell">
      <div className="sk-examples">
        {EXAMPLES.map(e => (
          <button key={e.label} className={`sk-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
            {e.label} ({e.buildings.length}b)
          </button>
        ))}
      </div>

      <div className="sk-panel">
        <div className="sk-panel-label">Skyline Visualization</div>
        <svg width={SVG_W} height={SVG_H + 4} className="sk-svg">
          {/* Buildings */}
          {buildings.map(([l, r, h], i) => (
            <rect key={i} x={10 + l * xScale} y={SVG_H - h * hScale}
              width={(r - l) * xScale} height={h * hScale}
              className="sk-building" />
          ))}
          {/* Skyline */}
          {skylinePoints.length > 0 && (
            <polyline points={skylinePoints.join(" ")} className="sk-skyline" />
          )}
          {/* X axis */}
          <line x1={10} y1={SVG_H} x2={10 + maxX * xScale} y2={SVG_H} className="sk-axis" />
        </svg>
      </div>

      <div className="sk-panel">
        <div className="sk-panel-label">Events (sorted by x)</div>
        <div className="sk-events">
          {events.map(([x, h], i) => (
            <motion.div key={i} className={`sk-event ${i === evtIdx ? "active-evt" : ""} ${h < 0 ? "start-evt" : "end-evt"}`}
              animate={{ scale: i === evtIdx ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              ({x},{h < 0 ? "−" + (-h) : "+" + h})
            </motion.div>
          ))}
        </div>
      </div>

      <div className="sk-row">
        <div className="sk-panel sk-half">
          <div className="sk-panel-label">Max Heap (negated)</div>
          <div className="sk-heap">
            {heap.map((v, i) => (
              <div key={i} className={`sk-heap-val ${i === 0 ? "top" : ""}`}>{-v}</div>
            ))}
          </div>
        </div>
        <div className="sk-panel sk-half">
          <div className="sk-panel-label">Result Points</div>
          <div className="sk-result">
            <AnimatePresence>
              {result.map(([x, h], i) => (
                <motion.div key={i} className="sk-pt" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                  [{x},{h}]
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="sk-trackers">
        <div className="sk-tracker">
          <span className="sk-tracker-label">Phase</span>
          <span className={`sk-tracker-val sk-phase ${phase}`}>{phase}</span>
        </div>
        <div className="sk-tracker">
          <span className="sk-tracker-label">Heap Max</span>
          <span className="sk-tracker-val">{heap.length > 0 ? -heap[0] : 0}</span>
        </div>
        <div className="sk-tracker">
          <span className="sk-tracker-label">Result pts</span>
          <span className="sk-tracker-val">{result.length}</span>
        </div>
      </div>

      {step?.done && <div className="sk-result-box">✓ {result.length} skyline points emitted</div>}

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
      <div className="sk-status">{step?.message ?? "Press Play to begin."}</div>
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
