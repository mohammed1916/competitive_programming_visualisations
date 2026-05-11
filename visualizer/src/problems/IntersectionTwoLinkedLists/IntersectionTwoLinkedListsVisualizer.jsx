import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./IntersectionTwoLinkedListsVisualizer.css";

const SOLUTION_CODE = [
  { line: 1, text: "def getIntersectionNode(headA, headB):" },
  { line: 2, text: "    a, b = headA, headB" },
  { line: 3, text: "    while a != b:" },
  { line: 4, text: "        a = a.next if a else headB" },
  { line: 5, text: "        b = b.next if b else headA" },
  { line: 6, text: "    return a  # intersection or None" },
];

const EXAMPLES = [
  {
    label: "Ex 1",
    listA: [4, 1],
    listB: [5, 6, 1],
    shared: [8, 4, 5],
    intersectVal: 8,
  },
  {
    label: "Ex 2",
    listA: [1, 9, 1],
    listB: [3],
    shared: [2, 4],
    intersectVal: 2,
  },
  {
    label: "No Intersect",
    listA: [2, 6, 4],
    listB: [1, 5],
    shared: [],
    intersectVal: null,
  },
];

// Build flat node list for each pointer traversal
// Total nodes: listA + shared, listB + shared (shared pointer is same index >= listA.length)
function buildNodeSequences(ex) {
  // nodeA: listA[0..] then shared[0..]
  // nodeB: listB[0..] then shared[0..]
  // After end of A, redirect to headB (index m in nodeB), etc.
  const A = [...ex.listA, ...ex.shared];
  const B = [...ex.listB, ...ex.shared];
  const intersectIdxA = ex.shared.length > 0 ? ex.listA.length : -1;
  const intersectIdxB = ex.shared.length > 0 ? ex.listB.length : -1;
  return { A, B, intersectIdxA, intersectIdxB };
}

function generateSteps(ex) {
  const steps = [];
  const { A, B, intersectIdxA, intersectIdxB } = buildNodeSequences(ex);
  // Simulate two-pointer
  // pA: 0..A.length-1 then null then B[0]..B[intersectIdxB] (or end)
  // We'll track as [list, idx] where list is 'A'|'B'|'null'
  let pA = { list: "A", idx: 0 };
  let pB = { list: "B", idx: 0 };
  const maxSteps = (A.length + B.length + 2) * 2;

  const nodeVal = (p) => {
    if (!p) return null;
    if (p.list === "A") return A[p.idx];
    if (p.list === "B") return B[p.idx];
    return null;
  };

  const isIntersect = (p) => {
    if (!p) return false;
    if (p.list === "A" && p.idx >= intersectIdxA && intersectIdxA >= 0) return true;
    if (p.list === "B" && p.idx >= intersectIdxB && intersectIdxB >= 0) return true;
    return false;
  };

  const isSamePos = (p1, p2) => {
    if (!p1 && !p2) return true;
    if (!p1 || !p2) return false;
    const inA1 = p1.list === "A" && p1.idx >= intersectIdxA && intersectIdxA >= 0;
    const inA2 = p2.list === "A" && p2.idx >= intersectIdxA && intersectIdxA >= 0;
    const inB1 = p1.list === "B" && p1.idx >= intersectIdxB && intersectIdxB >= 0;
    const inB2 = p2.list === "B" && p2.idx >= intersectIdxB && intersectIdxB >= 0;
    const sharedIdx1 = inA1 ? p1.idx - intersectIdxA : inB1 ? p1.idx - intersectIdxB : -99;
    const sharedIdx2 = inA2 ? p2.idx - intersectIdxA : inB2 ? p2.idx - intersectIdxB : -99;
    if (ex.shared.length > 0 && sharedIdx1 >= 0 && sharedIdx2 >= 0) return sharedIdx1 === sharedIdx2;
    if (!p1 && !p2) return true;
    return false;
  };

  const noIntersect = ex.shared.length === 0;

  steps.push({ activeLine: 2, pA: { ...pA }, pB: { ...pB }, message: "Init pA=headA, pB=headB" });

  for (let s = 0; s < maxSteps; s++) {
    if (isSamePos(pA, pB)) {
      const val = nodeVal(pA);
      steps.push({
        activeLine: 6, pA: pA ? { ...pA } : null, pB: pB ? { ...pB } : null, found: true,
        message: val !== undefined && val !== null ? `pA == pB → intersection at node ${val}` : "pA == pB == null → no intersection",
      });
      break;
    }
    // Advance pA
    let nextA;
    if (pA === null) {
      nextA = null;
    } else if (pA.idx + 1 < (pA.list === "A" ? A.length : B.length)) {
      nextA = { list: pA.list, idx: pA.idx + 1 };
    } else {
      // redirect
      nextA = pA.list === "A" ? { list: "B", idx: 0 } : null;
    }
    // Advance pB
    let nextB;
    if (pB === null) {
      nextB = null;
    } else if (pB.idx + 1 < (pB.list === "B" ? B.length : A.length)) {
      nextB = { list: pB.list, idx: pB.idx + 1 };
    } else {
      nextB = pB.list === "B" ? { list: "A", idx: 0 } : null;
    }
    pA = nextA;
    pB = nextB;
    steps.push({
      activeLine: 3, pA: pA ? { ...pA } : null, pB: pB ? { ...pB } : null,
      message: `Advance: pA=${pA ? `${pA.list}[${pA.idx}]=${nodeVal(pA)}` : "null"}, pB=${pB ? `${pB.list}[${pB.idx}]=${nodeVal(pB)}` : "null"}`,
    });
  }
  return steps;
}

function renderList(nodes, label, ptrIdx, ptrList, intersectStart, accent) {
  return (
    <div className="itll-list-block">
      <div className="itll-list-label" style={{ color: accent }}>{label}</div>
      <div className="itll-list-row">
        {nodes.map((v, i) => {
          const isPtr = ptrList === (label === "List A" ? "A" : "B") && ptrIdx === i;
          const isShared = i >= intersectStart && intersectStart >= 0;
          return (
            <div key={i} className="itll-node-wrap">
              <motion.div className={`itll-node ${isShared ? "shared" : ""} ${isPtr ? "ptr" : ""}`}
                animate={{ scale: isPtr ? 1.15 : 1, y: isPtr ? -4 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                {v}
              </motion.div>
              {i < nodes.length - 1 && <span className="itll-arrow">→</span>}
              {isPtr && <div className="itll-ptr-label">p{label.includes("A") ? "A" : "B"}</div>}
            </div>
          );
        })}
        <span className="itll-null">→ null</span>
      </div>
    </div>
  );
}

export default function IntersectionTwoLinkedListsVisualizer() {
  const [ex, setEx] = useState(EXAMPLES[0]);
  const steps = useMemo(() => generateSteps(ex), [ex]);
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } =
    usePlaybackState(steps.length);
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const applyEx = useCallback((e) => { setEx(e); handleReset(); }, [handleReset]);
  const { A, B, intersectIdxA, intersectIdxB } = buildNodeSequences(ex);

  return (
    <div className="itll-shell">
      <div className="itll-examples">
        {EXAMPLES.map(e => (
          <button key={e.label} className={`itll-chip ${ex.label === e.label ? "active" : ""}`} onClick={() => applyEx(e)}>{e.label}</button>
        ))}
      </div>

      <div className="itll-panel">
        <div className="itll-panel-label">Linked Lists</div>
        {renderList(A, "List A", step?.pA?.list === "A" ? step.pA.idx : -1, step?.pA?.list, intersectIdxA, "#89b4fa")}
        {renderList(B, "List B", step?.pB?.list === "B" ? step.pB.idx : -1, step?.pB?.list, intersectIdxB, "#fab387")}
        {ex.shared.length > 0 && (
          <div className="itll-shared-note">Shared (intersection): [{ex.shared.join(" → ")}] starting at {ex.intersectVal}</div>
        )}
      </div>

      {step?.found && (
        <div className={`itll-result ${ex.shared.length > 0 ? "ok" : "none"}`}>
          {ex.shared.length > 0 ? `✓ Intersection at node with value ${ex.intersectVal}` : "✗ No intersection (return null)"}
        </div>
      )}

      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      <div className="itll-status">{step?.message ?? "Press Play to begin."}</div>
      <PlaybackControls
        isPlaying={isPlaying} isDone={isDone} speed={speed}
        onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward} onReset={handleReset}
        prevDisabled={stepIndex < 0} nextDisabled={isDone} resetDisabled={stepIndex < 0}
        onSpeedChange={e => setSpeed(Number(e.target.value))}
      />
    </div>
  );
}
