import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./FlattenBinaryTreeVisualizer.css";

const SOLUTION_CODE = [
  { line: 1, text: "def flatten(root):" },
  { line: 2, text: "    cur = root" },
  { line: 3, text: "    while cur:" },
  { line: 4, text: "        if cur.left:" },
  { line: 5, text: "            # find rightmost of left subtree" },
  { line: 6, text: "            pre = cur.left" },
  { line: 7, text: "            while pre.right: pre = pre.right" },
  { line: 8, text: "            # rewire: pre.right = cur.right" },
  { line: 9, text: "            pre.right = cur.right" },
  { line: 10, text: "            # cur.right = cur.left; cur.left = None" },
  { line: 11, text: "            cur.right = cur.left" },
  { line: 12, text: "            cur.left = None" },
  { line: 13, text: "        cur = cur.right" },
];

// Tree represented as flat array (1-indexed), -1 = null
const EXAMPLES = {
  ex1: { label: "[1,2,5,3,4,null,6]", tree: [null, 1, 2, 5, 3, 4, null, 6] },
  ex2: { label: "[1,2,3,4,5,6,7]", tree: [null, 1, 2, 3, 4, 5, 6, 7] },
};

// Build adjacency from 1-indexed array
function buildTree(arr) {
  // arr[1] = root, arr[2*i]=left, arr[2*i+1]=right
  const nodes = {};
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] != null) {
      nodes[i] = { val: arr[i], left: arr[2 * i] != null ? 2 * i : null, right: arr[2 * i + 1] != null ? 2 * i + 1 : null };
    }
  }
  return nodes;
}

// Position nodes for SVG rendering
function layoutTree(arr) {
  const positions = {};
  const W = 340, startY = 30, levelH = 56;
  function place(i, depth, lo, hi) {
    if (i >= arr.length || arr[i] == null) return;
    const x = (lo + hi) / 2;
    positions[i] = { x, y: startY + depth * levelH };
    place(2 * i, depth + 1, lo, x);
    place(2 * i + 1, depth + 1, x, hi);
  }
  place(1, 0, 0, W);
  return positions;
}

function generateSteps(arr) {
  // Work with mutable copy of left/right links by index
  const n = arr.length;
  const left = Array(n).fill(null);
  const right = Array(n).fill(null);
  const val = Array(n).fill(null);
  for (let i = 1; i < n; i++) {
    if (arr[i] != null) {
      val[i] = arr[i];
      left[i] = (2 * i < n && arr[2 * i] != null) ? 2 * i : null;
      right[i] = (2 * i + 1 < n && arr[2 * i + 1] != null) ? 2 * i + 1 : null;
    }
  }

  const steps = [];
  const snap = (aL, aR) => ({ activeLine: 2, left: [...aL], right: [...aR], cur: null, pre: null, message: "Start" });

  let cur = 1;
  steps.push({ activeLine: 2, left: [...left], right: [...right], cur, pre: null, message: `cur = root (${val[cur]})` });

  while (cur != null && val[cur] != null) {
    if (left[cur] != null) {
      steps.push({ activeLine: 4, left: [...left], right: [...right], cur, pre: null, message: `cur=${val[cur]} has left child → find rightmost of left subtree` });
      let pre = left[cur];
      while (right[pre] != null) {
        steps.push({ activeLine: 7, left: [...left], right: [...right], cur, pre, message: `Walk right: pre=${val[pre]}` });
        pre = right[pre];
      }
      steps.push({ activeLine: 8, left: [...left], right: [...right], cur, pre, message: `Rightmost predecessor: pre=${val[pre]}. Rewire pre.right = cur.right` });
      right[pre] = right[cur];
      right[cur] = left[cur];
      left[cur] = null;
      steps.push({ activeLine: 12, left: [...left], right: [...right], cur, pre, message: `cur.right=cur.left, cur.left=null. List growing.` });
    }
    cur = right[cur];
    if (cur != null && val[cur] != null) {
      steps.push({ activeLine: 13, left: [...left], right: [...right], cur, pre: null, message: `Advance cur → ${val[cur]}` });
    }
  }
  steps.push({ activeLine: 13, left: [...left], right: [...right], cur: null, pre: null, message: `Done! Tree flattened to linked list.` });
  return steps;
}

const SVG_W = 340, SVG_H = 200;
const NODE_R = 16;

export default function FlattenBinaryTreeVisualizer() {
  const [exKey, setExKey] = useState("ex1");
  const ex = EXAMPLES[exKey];
  const arr = ex.tree;
  const origPositions = useMemo(() => layoutTree(arr), [arr]);
  const steps = useMemo(() => generateSteps(arr), [arr]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((k) => { setExKey(k); handleReset(); }, [handleReset]);

  // Compute linked-list order from current right-chain
  const listOrder = useMemo(() => {
    if (!step) return [];
    const right = step.right;
    const val = arr.map((v, i) => v);
    const result = [];
    let i = 1;
    while (i != null && arr[i] != null) { result.push({ i, v: arr[i] }); i = right[i]; }
    return result;
  }, [step, arr]);

  return (
    <div className="fbt-shell">
      <div className="fbt-examples">
        {Object.entries(EXAMPLES).map(([k, e]) => (
          <button key={k} className={`fbt-chip ${exKey === k ? "active" : ""}`} onClick={() => applyEx(k)}>{e.label}</button>
        ))}
      </div>

      {/* Tree SVG */}
      <div className="fbt-panel">
        <div className="fbt-panel-label">Tree (current state)</div>
        <svg width={SVG_W} height={SVG_H} className="fbt-svg">
          {/* Draw right edges */}
          {arr.map((_, i) => {
            if (i < 1 || arr[i] == null || !origPositions[i]) return null;
            const ri = step ? step.right[i] : (2*i+1 < arr.length && arr[2*i+1] != null ? 2*i+1 : null);
            const li = step ? step.left[i] : (2*i < arr.length && arr[2*i] != null ? 2*i : null);
            const rp = ri && origPositions[ri];
            const lp = li && origPositions[li];
            const p = origPositions[i];
            return (
              <g key={`edges-${i}`}>
                {rp && <line x1={p.x} y1={p.y} x2={rp.x} y2={rp.y} stroke="#89b4fa" strokeWidth={1.5} />}
                {lp && <line x1={p.x} y1={p.y} x2={lp.x} y2={lp.y} stroke="#45475a" strokeWidth={1.5} strokeDasharray="4 3" />}
              </g>
            );
          })}
          {/* Draw nodes */}
          {arr.map((v, i) => {
            if (i < 1 || v == null || !origPositions[i]) return null;
            const p = origPositions[i];
            const isCur = step?.cur === i;
            const isPre = step?.pre === i;
            return (
              <g key={`node-${i}`}>
                <circle cx={p.x} cy={p.y} r={NODE_R}
                  fill={isCur ? "#0d2a1a" : isPre ? "#2a1200" : "#313244"}
                  stroke={isCur ? "#a6e3a1" : isPre ? "#fab387" : "#45475a"}
                  strokeWidth={2} />
                <text x={p.x} y={p.y} dominantBaseline="middle" textAnchor="middle"
                  fill={isCur ? "#a6e3a1" : isPre ? "#fab387" : "#cdd6f4"} fontSize={13} fontWeight="bold">{v}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Linked list so far */}
      <div className="fbt-panel">
        <div className="fbt-panel-label">Right-chain (flattened so far)</div>
        <div className="fbt-list-row">
          {listOrder.map(({ i, v }, idx) => (
            <div key={idx} className="fbt-list-node-wrap">
              <div className={`fbt-list-node ${step?.cur === i ? "cur" : ""}`}>{v}</div>
              {idx < listOrder.length - 1 && <div className="fbt-list-arrow">→</div>}
            </div>
          ))}
          {listOrder.length === 0 && <span className="fbt-empty">—</span>}
        </div>
      </div>

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      <div className="fbt-status">{step?.message ?? "Press Play to begin."}</div>
      <PlaybackControls
        isPlaying={isPlaying} isDone={isDone} speed={speed}
        onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
        prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
        onSpeedChange={(e) => setSpeed(Number(e.target.value))}
      />
    </div>
  );
}
