import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import PatternOverlay from "../../components/PatternOverlay";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import { usePatternOverlay } from "../../hooks/usePatternOverlay";
import "./SerializeDeserializeVisualizer.css";

const SOLUTION_CODE = [
  { line: 1,  text: "def serialize(root):" },
  { line: 2,  text: "    res = []" },
  { line: 3,  text: "    def dfs(node):" },
  { line: 4,  text: "        if not node:" },
  { line: 5,  text: "            res.append('N'); return" },
  { line: 6,  text: "        res.append(str(node.val))" },
  { line: 7,  text: "        dfs(node.left); dfs(node.right)" },
  { line: 8,  text: "    dfs(root); return ','.join(res)" },
  { line: 9,  text: "def deserialize(data):" },
  { line: 10, text: "    vals = data.split(',')" },
  { line: 11, text: "    i = 0" },
  { line: 12, text: "    def dfs():" },
  { line: 13, text: "        nonlocal i" },
  { line: 14, text: "        if vals[i] == 'N': i += 1; return None" },
  { line: 15, text: "        node = TreeNode(int(vals[i])); i += 1" },
  { line: 16, text: "        node.left = dfs(); node.right = dfs()" },
  { line: 17, text: "        return node" },
  { line: 18, text: "    return dfs()" },
];

const EXAMPLES = [
  { label: "Ex 1", tree: [1, 2, 3, null, null, 4, 5] },
  { label: "Ex 2", tree: [1, 2, null, 3, null, null, null, 4] },
  { label: "Ex 3", tree: [1, null, 2, null, null, null, 3] },
];

// Build preorder (serialize) steps
function serializeSteps(treeArr) {
  const steps = [];
  const serialized = [];

  function dfs(idx) {
    if (idx >= treeArr.length || treeArr[idx] === null || treeArr[idx] === undefined) {
      serialized.push("N");
      steps.push({
        activeLine: 5, phase: "serialize",
        serialized: [...serialized], highlightIdx: idx,
        message: `Node idx=${idx}: null → append 'N'`,
      });
      return;
    }
    serialized.push(String(treeArr[idx]));
    steps.push({
      activeLine: 6, phase: "serialize",
      serialized: [...serialized], highlightIdx: idx,
      message: `Visit node val=${treeArr[idx]} → append '${treeArr[idx]}'`,
    });
    dfs(2 * idx + 1);
    dfs(2 * idx + 2);
  }

  steps.push({ activeLine: 2, phase: "serialize", serialized: [], highlightIdx: -1, message: "Start serialize (preorder DFS)" });
  dfs(0);
  const joined = serialized.join(",");
  steps.push({ activeLine: 8, phase: "serialize-done", serialized: [...serialized], highlightIdx: -1, message: `Serialized: "${joined}"` });

  // Deserialize steps
  const vals = [...serialized];
  let ptr = 0;
  const rebuilt = [];

  steps.push({ activeLine: 10, phase: "deserialize", serialized: vals, ptr: 0, rebuilt: [], message: `Start deserialize. vals=[${vals.join(",")}]` });

  function dfsDeser(parentLabel) {
    if (ptr >= vals.length) return;
    const curPtr = ptr;
    if (vals[curPtr] === "N") {
      ptr++;
      steps.push({
        activeLine: 14, phase: "deserialize",
        serialized: vals, ptr, rebuilt: [...rebuilt],
        message: `vals[${curPtr}]='N' → null, ptr++ → ${ptr}`,
      });
      return;
    }
    const val = vals[curPtr];
    ptr++;
    rebuilt.push(val);
    steps.push({
      activeLine: 15, phase: "deserialize",
      serialized: vals, ptr, rebuilt: [...rebuilt],
      message: `Create node(${val}), ptr++ → ${ptr}`,
    });
    dfsDeser(val);
    dfsDeser(val);
  }

  dfsDeser(null);
  steps.push({
    activeLine: 18, phase: "done", done: true,
    serialized: vals, ptr, rebuilt: [...rebuilt],
    message: `Done! Tree rebuilt successfully. "${joined}"`,
  });
  return steps;
}

// Simple tree layout for visual
function buildLayout(treeArr) {
  const nodes = [];
  const maxDepth = Math.floor(Math.log2(treeArr.length || 1)) + 1;
  for (let i = 0; i < treeArr.length; i++) {
    if (treeArr[i] == null) continue;
    const depth = Math.floor(Math.log2(i + 1));
    const posInRow = i - (Math.pow(2, depth) - 1);
    const totalInRow = Math.pow(2, depth);
    const x = ((posInRow + 0.5) / totalInRow) * 100;
    const y = (depth / (maxDepth)) * 80 + 5;
    nodes.push({ idx: i, val: treeArr[i], x, y, depth });
  }
  return nodes;
}

export default function SerializeDeserializeVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => serializeSteps(ex.tree), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
  const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay();

  const layout = useMemo(() => buildLayout(ex.tree), [ex]);
  const serialized = step?.serialized ?? [];
  const phase = step?.phase ?? "init";
  const highlightIdx = step?.highlightIdx ?? -1;
  const ptr = step?.ptr ?? 0;

  return (
    <div className="sd-shell">
      <div className="sd-examples">
        {EXAMPLES.map(e => (
          <button key={e.label} className={`sd-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>
            {e.label}
          </button>
        ))}
      </div>

      <div className="sd-panel">
        <div className="sd-panel-label">Binary Tree</div>
        <div className="sd-tree">
          {layout.map(node => {
            const isHL = node.idx === highlightIdx;
            const inRebuilt = phase === "deserialize" && step?.rebuilt?.includes(String(node.val));
            return (
              <motion.div
                key={node.idx}
                className={`sd-node ${isHL ? "hl" : ""} ${inRebuilt ? "rebuilt" : ""}`}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                animate={{ scale: isHL ? 1.25 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                {node.val}
              </motion.div>
            );
          })}
          {/* Edges */}
          <svg className="sd-edges" viewBox="0 0 100 100" preserveAspectRatio="none">
            {layout.map(node => {
              const parentIdx = Math.floor((node.idx - 1) / 2);
              if (node.idx === 0) return null;
              const parent = layout.find(n => n.idx === parentIdx);
              if (!parent) return null;
              return <line key={`e-${node.idx}`} x1={`${parent.x}%`} y1={`${parent.y}%`} x2={`${node.x}%`} y2={`${node.y}%`} className="sd-edge" />;
            })}
          </svg>
        </div>
      </div>

      <div className="sd-panel">
        <div className="sd-panel-label">Serialized String (preorder)</div>
        <div className="sd-tokens">
          {serialized.map((t, idx) => (
            <motion.span
              key={idx}
              className={`sd-token ${t === "N" ? "null-token" : "val-token"} ${phase === "deserialize" && idx === ptr - 1 ? "ptr-token" : ""}`}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {t}
            </motion.span>
          ))}
        </div>
        {phase === "deserialize" && (
          <div className="sd-ptr-row">
            {serialized.map((_, idx) => (
              <div key={idx} className="sd-ptr-cell">
                {idx === ptr && <span className="sd-ptr-marker">↑</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sd-trackers">
        <div className="sd-tracker">
          <span className="sd-tracker-label">Phase</span>
          <span className={`sd-tracker-val sd-phase ${phase.split("-")[0]}`}>{phase.replace("-done", " ✓").replace("-", " ")}</span>
        </div>
        <div className="sd-tracker">
          <span className="sd-tracker-label">Tokens</span>
          <span className="sd-tracker-val">{serialized.length}</span>
        </div>
        {phase === "deserialize" && (
          <div className="sd-tracker">
            <span className="sd-tracker-label">ptr</span>
            <span className="sd-tracker-val" style={{ color: "#f9e2af" }}>{ptr}</span>
          </div>
        )}
      </div>

      {step?.done && <div className="sd-result">✓ Serialize → Deserialize complete!</div>}

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />
      <div className="sd-status">{step?.message ?? "Press Play to begin."}</div>
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
