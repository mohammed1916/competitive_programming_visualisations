import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CodeTracePanel from "../../components/CodeTracePanel";
import PlaybackControls from "../../components/PlaybackControls";
import FloatingPanel from "../../components/shared/FloatingPanel";
import { usePlaybackState } from "../../hooks/usePlaybackState";
import "./GameOnGrowingTreeVisualizer.css";
import { Stack3D } from "../../components/viz3d";
import PartialAnswersPanel from "../../components/PartialAnswersPanel";
import TreeStatePanel from "./TreeStatePanel";
import DockableWorkspace from "../../components/shared/DockableWorkspace";

const MAX_TREE_NODES_TO_RENDER = 120;

const SOLUTION_CODE = [
  { line: 1, text: "n = int(input())" },
  {
    line: 2,
    text: "parent = [0] + [x - 1 for x in map(int, input().split())]",
  },
  { line: 3, text: "if n == 1: print(1); exit()" },
  { line: 4, text: "" },
  { line: 5, text: "def solve(size):" },
  { line: 6, text: "    first = [0] * size" },
  { line: 7, text: "    second = [0] * size" },
  { line: 8, text: "    third = [0] * size" },
  { line: 9, text: "    for node in range(size - 1, 0, -1):" },
  { line: 10, text: "        p = parent[node]" },
  { line: 11, text: "        depth = second[node] + 1" },
  {
    line: 12,
    text: "        if depth > first[p]: first[p], second[p], third[p] = depth, first[p], second[p]",
  },
  {
    line: 13,
    text: "        elif depth > second[p]: second[p], third[p] = depth, second[p]",
  },
  { line: 14, text: "        elif depth > third[p]: third[p] = depth" },
  { line: 15, text: "    for node in range(1, size):" },
  { line: 16, text: "        p = parent[node]" },
  { line: 17, text: "        if second[p] <= second[node] + 1:" },
  { line: 18, text: "            depth = third[p] + 1" },
  { line: 19, text: "        else:" },
  { line: 20, text: "            depth = second[p] + 1" },
  {
    line: 21,
    text: "        if depth > first[node]: first[node], second[node], third[node] = depth, first[node], second[node]",
  },
  {
    line: 22,
    text: "        elif depth > second[node]: second[node], third[node] = depth, second[node]",
  },
  { line: 23, text: "        elif depth > third[node]: third[node] = depth" },
  { line: 24, text: "    return max(second) + 1" },
  { line: 25, text: "" },
  { line: 26, text: "ans = [0, 1, 1, 2] + [0] * n" },
  { line: 27, text: "ans[n + 2] = 17" },
  { line: 28, text: "stack = [(3, n + 2)]" },
  { line: 29, text: "while stack:" },
  { line: 30, text: "    left, right = stack.pop()" },
  { line: 31, text: "    mid = (left + right) >> 1" },
  { line: 32, text: "    value = solve(mid)" },
  { line: 33, text: "    ans[mid] = value" },
  { line: 34, text: "    if ans[left] == ans[mid]:" },
  { line: 35, text: "        for i in range(left + 1, mid): ans[i] = value" },
  { line: 36, text: "    elif left + 1 < mid:" },
  { line: 37, text: "        stack.append((left, mid))" },
  { line: 38, text: "    if ans[mid] == ans[right]:" },
  { line: 39, text: "        for i in range(mid + 1, right): ans[i] = value" },
  { line: 40, text: "    elif mid + 1 < right:" },
  { line: 41, text: "        stack.append((mid, right))" },
  { line: 42, text: "print(*ans[2:n + 2])" },
];

const EXAMPLES = [
  {
    label: "Sample",
    q: "9",
    parents: "1 1 3 3 1 2 1 2 8",
  },
  {
    label: "Chain",
    q: "8",
    parents: "1 2 3 4 5 6 7 8",
  },
  {
    label: "Star",
    q: "8",
    parents: "1 1 1 1 1 1 1 1",
  },
];

function insertTop3(first, second, third, idx, value) {
  if (value > first[idx]) {
    third[idx] = second[idx];
    second[idx] = first[idx];
    first[idx] = value;
    return 1;
  }
  if (value > second[idx]) {
    third[idx] = second[idx];
    second[idx] = value;
    return 2;
  }
  if (value > third[idx]) {
    third[idx] = value;
    return 3;
  }
  return 0;
}

function scoreForPrefix(parentZeroBased, size) {
  const first = new Array(size).fill(0);
  const second = new Array(size).fill(0);
  const third = new Array(size).fill(0);

  for (let node = size - 1; node >= 1; node -= 1) {
    const parent = parentZeroBased[node];
    const depth = second[node] + 1;
    insertTop3(first, second, third, parent, depth);
  }

  for (let node = 1; node < size; node += 1) {
    const parent = parentZeroBased[node];
    const depth =
      second[parent] <= second[node] + 1
        ? third[parent] + 1
        : second[parent] + 1;
    insertTop3(first, second, third, node, depth);
  }

  let best = 0;
  for (let i = 0; i < size; i += 1) {
    if (second[i] > best) best = second[i];
  }
  return best + 1;
}

function createParentParseSteps(raw) {
  const parsed = [];
  const steps = [];

  raw.forEach((value, idx) => {
    const zeroBased = value - 1;
    parsed.push(zeroBased);
    steps.push({
      phase: "parse-parent",
      activeLine: 2,
      relatedLines: [2],
      message: `Read parent ${value} for node ${idx + 1} and store ${zeroBased}.`,
      parsedParents: [...parsed],
      currentParentIndex: idx,
      currentParentValue: zeroBased,
    });
  });

  return steps;
}

function solveWithTrace(parentZeroBased, size, answersSnapshot) {
  const first = new Array(size).fill(0);
  const second = new Array(size).fill(0);
  const third = new Array(size).fill(0);
  const steps = [];
  const snapshotLimit = Math.min(size, MAX_TREE_NODES_TO_RENDER);

  const capture = (
    activeLine,
    message,
    relatedLines = [activeLine],
    focus = null,
  ) => {
    steps.push({
      activeLine,
      relatedLines,
      message,
      subproblemSize: size,
      stackSize: 0,
      focus,
      dpSnapshot: {
        first: first.slice(0, snapshotLimit),
        second: second.slice(0, snapshotLimit),
        third: third.slice(0, snapshotLimit),
      },
      answers: answersSnapshot,
    });
  };

  capture(6, `Initialize top-3 arrays for size ${size}.`, [6, 7, 8]);

  for (let node = size - 1; node >= 1; node -= 1) {
    const parent = parentZeroBased[node];
    const depth = second[node] + 1;
    capture(
      9,
      `Bottom-up: node ${node} contributes depth ${depth} to parent ${parent}.`,
      [9, 10, 11],
      {
        sourceNode: node,
        targetNode: parent,
        direction: "up",
        phase: "bottom-up",
      },
    );

    const which = insertTop3(first, second, third, parent, depth);
    if (which === 1) {
      capture(
        12,
        `depth ${depth} becomes first[${parent}] and shifts the previous values right.`,
        [12, 13, 14],
        {
          sourceNode: node,
          targetNode: parent,
          direction: "up",
          phase: "bottom-up",
        },
      );
    } else if (which === 2) {
      capture(
        13,
        `depth ${depth} becomes second[${parent}] and shifts third.`,
        [13, 14],
        {
          sourceNode: node,
          targetNode: parent,
          direction: "up",
          phase: "bottom-up",
        },
      );
    } else if (which === 3) {
      capture(14, `depth ${depth} becomes third[${parent}].`, [14], {
        sourceNode: node,
        targetNode: parent,
        direction: "up",
        phase: "bottom-up",
      });
    }
  }

  for (let node = 1; node < size; node += 1) {
    const parent = parentZeroBased[node];
    const useThird = second[parent] <= second[node] + 1;
    const depth = useThird ? third[parent] + 1 : second[parent] + 1;
    capture(
      15,
      `Top-down: node ${node} receives depth ${depth} from parent ${parent}.`,
      [15, 16, 17, 18, 19, 20],
      {
        sourceNode: parent,
        targetNode: node,
        direction: "down",
        phase: "top-down",
      },
    );

    const which = insertTop3(first, second, third, node, depth);
    if (which === 1) {
      capture(
        21,
        `depth ${depth} becomes first[${node}] and shifts the previous values right.`,
        [21, 22, 23],
        {
          sourceNode: parent,
          targetNode: node,
          direction: "down",
          phase: "top-down",
        },
      );
    } else if (which === 2) {
      capture(
        22,
        `depth ${depth} becomes second[${node}] and shifts third.`,
        [22, 23],
        {
          sourceNode: parent,
          targetNode: node,
          direction: "down",
          phase: "top-down",
        },
      );
    } else if (which === 3) {
      capture(23, `depth ${depth} becomes third[${node}].`, [23], {
        sourceNode: parent,
        targetNode: node,
        direction: "down",
        phase: "top-down",
      });
    }
  }

  const value = Math.max(...second) + 1;
  capture(24, `Return max(second) + 1 = ${value}.`, [24]);

  return { value, steps };
}

function solveAndBuildSteps(q, parentInput) {
  const raw = parentInput
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((x) => Number(x));

  if (!Number.isInteger(q) || q < 1 || q > 200000) {
    throw new Error("q must be an integer in [1, 200000].");
  }
  if (raw.length !== q) {
    throw new Error(`Expected ${q} parent values but got ${raw.length}.`);
  }

  const parentZeroBased = [0];
  for (let i = 0; i < q; i += 1) {
    const v = raw[i];
    if (!Number.isInteger(v) || v < 1 || v > i + 1) {
      throw new Error(
        `Invalid parent v_${i + 1} = ${v}. Must satisfy 1 <= v_i <= i.`,
      );
    }
    parentZeroBased.push(v - 1);
  }

  const steps = createParentParseSteps(raw);
  if (q === 1) {
    const answers = [1];
    steps.push({
      activeLine: 3,
      relatedLines: [3],
      message: "Only one node, answer is 1.",
      intervalLeft: null,
      intervalRight: null,
      midpoint: null,
      computedValue: null,
      stackSize: 0,
      answers,
    });
    return { answers, steps };
  }

  steps.push({
    activeLine: 2,
    relatedLines: [2],
    message: "Parent list parsed. Build the tree and continue.",
    phase: "parse-parent-done",
    parsedParents: parentZeroBased.slice(1),
    currentParentIndex: q - 1,
    currentParentValue: parentZeroBased[q],
  });

  const ans = new Array(q + 4).fill(0);
  ans[1] = 1;
  ans[2] = 1;
  ans[3] = 2;
  ans[q + 2] = 17;

  const stack = [[3, q + 2]];

  steps.push({
    activeLine: 26,
    relatedLines: [26, 27, 28],
    message:
      "Initialize answer array, sentinel value, and divide-and-conquer stack.",
    intervalLeft: 3,
    intervalRight: q + 2,
    midpoint: null,
    computedValue: null,
    stackSize: stack.length,
    stack: stack.slice(),
    answers: ans.slice(2, q + 2),
  });

  const capture = (
    activeLine,
    message,
    l,
    r,
    m,
    c,
    relatedLines = [activeLine],
  ) => {
    steps.push({
      activeLine,
      relatedLines,
      message,
      intervalLeft: l,
      intervalRight: r,
      midpoint: m,
      computedValue: c,
      stackSize: stack.length,
      stack: stack.slice(),
      answers: ans.slice(2, q + 2),
    });
  };

  while (stack.length > 0) {
    const [left, right] = stack.pop();
    capture(
      29,
      `Pop interval [${left}, ${right}] from the stack.`,
      left,
      right,
      null,
      null,
      [29, 30],
    );

    const mid = (left + right) >> 1;
    capture(31, `Midpoint is ${mid}.`, left, right, mid, null, [31]);

    capture(
      32,
      `Run solve(${mid}) and trace its two DP passes.`,
      left,
      right,
      mid,
      null,
      [5, 6, 9, 15, 24],
    );
    const solved = solveWithTrace(parentZeroBased, mid, ans.slice(2, q + 2));
    steps.push(...solved.steps);

    ans[mid] = solved.value;
    capture(
      33,
      `ans[${mid}] = ${solved.value}.`,
      left,
      right,
      mid,
      solved.value,
      [33],
    );

    if (ans[left] === ans[mid]) {
      for (let i = left + 1; i < mid; i += 1) ans[i] = solved.value;
      capture(
        34,
        `Left endpoint matches midpoint, so fill [${left + 1}, ${mid - 1}] with ${solved.value}.`,
        left,
        right,
        mid,
        solved.value,
        [34, 35],
      );
    } else if (left + 1 < mid) {
      stack.push([left, mid]);
      capture(
        36,
        `Left half still needs work, push [${left}, ${mid}].`,
        left,
        right,
        mid,
        solved.value,
        [36, 37],
      );
    }

    if (ans[mid] === ans[right]) {
      for (let i = mid + 1; i < right; i += 1) ans[i] = solved.value;
      capture(
        38,
        `Midpoint matches right endpoint, so fill [${mid + 1}, ${right - 1}] with ${solved.value}.`,
        left,
        right,
        mid,
        solved.value,
        [38, 39],
      );
    } else if (mid + 1 < right) {
      stack.push([mid, right]);
      capture(
        40,
        `Right half still needs work, push [${mid}, ${right}].`,
        left,
        right,
        mid,
        solved.value,
        [40, 41],
      );
    }
  }

  capture(
    42,
    "All intervals are resolved. Print the final answers from 2 to n + 1.",
    null,
    null,
    null,
    null,
    [42],
  );

  return { answers: ans.slice(2, q + 2), steps };
}

function buildTreeData(parentZeroBased, m) {
  const renderCount = Math.min(m, MAX_TREE_NODES_TO_RENDER);
  const adj = Array.from({ length: renderCount }, () => []);

  for (let node = 1; node < renderCount; node += 1) {
    const p = parentZeroBased[node];
    if (p >= renderCount) continue;
    adj[p].push(node);
    adj[node].push(p);
  }

  const parent = new Array(renderCount).fill(-1);
  const depth = new Array(renderCount).fill(0);
  const levels = [];
  const queue = [0];
  parent[0] = 0;

  for (let qi = 0; qi < queue.length; qi += 1) {
    const u = queue[qi];
    const d = depth[u];
    if (!levels[d]) levels[d] = [];
    levels[d].push(u);

    for (const v of adj[u]) {
      if (parent[v] !== -1) continue;
      parent[v] = u;
      depth[v] = d + 1;
      queue.push(v);
    }
  }

  const positions = new Map();
  levels.forEach((nodes, levelIdx) => {
    const y = 44 + levelIdx * 74;
    const count = nodes.length;
    const width = Math.max(1, count);
    nodes.forEach((node, idx) => {
      const x = ((idx + 1) * 1000) / (width + 1);
      positions.set(node, { x, y });
    });
  });

  const edges = [];
  for (let node = 1; node < renderCount; node += 1) {
    const p = parent[node];
    if (p > -1 && p !== node) edges.push({ from: p, to: node });
  }

  return {
    renderCount,
    adj,
    depth,
    positions,
    edges,
    truncated: m > renderCount,
  };
}

function pickBobNode(adj, states, chip) {
  let best = -1;
  let bestScore = -1;

  for (let node = 0; node < states.length; node += 1) {
    if (states[node] !== "white") continue;
    let whiteDeg = 0;
    for (const v of adj[node]) {
      if (states[v] === "white") whiteDeg += 1;
    }

    const score = whiteDeg * 1000 - Math.abs(node - chip);
    if (score > bestScore) {
      bestScore = score;
      best = node;
    }
  }

  return best;
}

function pickAliceMove(adj, states, chip) {
  let best = -1;
  let bestScore = -1;

  for (const next of adj[chip]) {
    if (states[next] !== "white") continue;

    let onward = 0;
    for (const v of adj[next]) {
      if (states[v] === "white") onward += 1;
    }

    const score = onward * 1000 - next;
    if (score > bestScore) {
      bestScore = score;
      best = next;
    }
  }

  return best;
}

function simulateTreeGameWithTrace(treeData) {
  const { renderCount, adj } = treeData;
  const states = new Array(renderCount).fill("white");
  const chipPath = [];
  const moves = [];
  const stateHierarchy = {
    overallPhase: "game-simulation",
    overallMessage: "Simulating Alice vs Bob game on tree",
    substates: [],
  };

  let start = 0;
  let startDegree = -1;
  for (let node = 0; node < renderCount; node += 1) {
    const deg = adj[node].length;
    if (deg > startDegree) {
      startDegree = deg;
      start = node;
    }
  }

  states[start] = "red";
  chipPath.push(start);
  let chip = start;

  stateHierarchy.substates.push({
    level: "initialization",
    message: `Game initialized: Alice starts at node ${start + 1} (degree ${startDegree})`,
  });

  moves.push({
    type: "game-start",
    message: `Alice starts at node ${start + 1} (highest degree).`,
    states: states.slice(),
    chip,
    chipPath: chipPath.slice(),
    hierarchyLevel: "detail",
  });

  let roundNum = 1;
  while (true) {
    const bob = pickBobNode(adj, states, chip);
    if (bob !== -1) {
      states[bob] = "blue";
      const whiteNeighbors = adj[bob].filter(v => states[v] === "white").length;

      stateHierarchy.substates.push({
        level: "round-bob",
        roundNum,
        message: `Round ${roundNum}: Bob blocks node ${bob + 1} (${whiteNeighbors} white neighbors)`,
      });

      moves.push({
        type: "bob-block",
        message: `Bob blocks node ${bob + 1} (closest white node with most white neighbors).`,
        states: states.slice(),
        chip,
        chipPath: chipPath.slice(),
        blockNode: bob,
        hierarchyLevel: "detail",
        round: roundNum,
      });
    }

    const next = pickAliceMove(adj, states, chip);
    if (next === -1) {
      stateHierarchy.substates.push({
        level: "game-end",
        message: `Game ended: Alice trapped at node ${chip + 1}, no valid moves`,
        finalChipPosition: chip + 1,
        pathLength: chipPath.length,
      });

      moves.push({
        type: "game-end",
        message: `Alice has no moves. Game ends.`,
        states: states.slice(),
        chip,
        chipPath: chipPath.slice(),
        hierarchyLevel: "detail",
      });
      break;
    }

    states[next] = "red";
    chip = next;
    chipPath.push(chip);
    const onwardOptions = adj[next].filter(v => states[v] === "white").length;

    stateHierarchy.substates.push({
      level: "round-alice",
      roundNum,
      message: `Round ${roundNum}: Alice moves to node ${next + 1} (${onwardOptions} onward options)`,
    });

    moves.push({
      type: "alice-move",
      message: `Alice moves to node ${next + 1} (neighbor with most onward options).`,
      states: states.slice(),
      chip,
      chipPath: chipPath.slice(),
      moveNode: next,
      hierarchyLevel: "detail",
      round: roundNum,
    });

    roundNum++;
  }

  const blockedEdges = new Set();
  for (const v of adj[chip]) {
    if (states[v] !== "white") {
      const a = Math.min(chip, v);
      const b = Math.max(chip, v);
      blockedEdges.add(`${a}-${b}`);
    }
  }

  return {
    states,
    chip,
    chipPath,
    blockedEdges,
    moves,
    stateHierarchy,
  };
}

export default function GameOnGrowingTreeVisualizer() {
  const [qInput, setQInput] = useState("9");
  const [parentsInput, setParentsInput] = useState("1 1 3 3 1 2 1 2 8");
  const [previewSize, setPreviewSize] = useState(null);
  const [parsedParentSnapshot, setParsedParentSnapshot] = useState([]);

  const { answers, steps, inputError } = useMemo(() => {
    try {
      const q = Number(qInput.trim());
      const result = solveAndBuildSteps(q, parentsInput);
      return { answers: result.answers, steps: result.steps, inputError: "" };
    } catch (error) {
      return {
        answers: [],
        steps: [],
        inputError: error?.message || "Invalid input",
      };
    }
  }, [qInput, parentsInput]);

  const {
    stepIndex,
    stepForward,
    stepBack,
    togglePlay,
    handleReset,
    isPlaying,
    speed,
    setSpeed,
    isDone,
  } = usePlaybackState(steps.length, 650);

  const step = stepIndex >= 0 ? steps[stepIndex] : null;

  // track previous answers to detect per-index changes
  const prevAnswersRef = useRef(null);
  useEffect(() => {
    prevAnswersRef.current = step?.answers ?? null;
  }, [step?.answers]);

  const prevParsedParentsRef = useRef(null);
  useEffect(() => {
    prevParsedParentsRef.current = parsedParentSnapshot;
  }, [parsedParentSnapshot]);

  useEffect(() => {
    if (!step) {
      setPreviewSize(null);
      setParsedParentSnapshot([]);
      return;
    }

    if (Array.isArray(step.parsedParents) && step.parsedParents.length > 0) {
      setParsedParentSnapshot(step.parsedParents);
    }

    if (step.subproblemSize != null) {
      setPreviewSize(step.subproblemSize);
      return;
    }

    if (step.midpoint != null) {
      setPreviewSize(step.midpoint);
    }
  }, [step]);

  const currentTree = useMemo(() => {
    const size = previewSize;
    if (!Number.isInteger(size) || size < 1 || size > answers.length + 1)
      return null;

    const raw = parentsInput
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((x) => Number(x));

    if (raw.length === 0) return null;

    const parentZeroBased = [0];
    for (let i = 0; i < raw.length; i += 1) {
      parentZeroBased.push(raw[i] - 1);
    }

    const treeData = buildTreeData(parentZeroBased, size);
    const game = simulateTreeGameWithTrace(treeData);
    return { ...treeData, ...game, size };
  }, [answers.length, parentsInput, previewSize]);

  const treeFocus = useMemo(() => {
    if (!currentTree?.positions || !step?.focus) return null;

    const { sourceNode, targetNode, direction, phase } = step.focus;
    const sourcePosition = currentTree.positions.get(sourceNode);
    const targetPosition = currentTree.positions.get(targetNode);

    if (!sourcePosition || !targetPosition) return null;

    return {
      sourceNode,
      targetNode,
      sourcePosition,
      targetPosition,
      direction,
      phase,
    };
  }, [currentTree?.positions, step?.focus]);

  const stepKey = step
    ? `${stepIndex}-${step.activeLine}-${step.subproblemSize ?? "root"}-${step.midpoint ?? "none"}`
    : "idle";
  const dpSnapshot = step?.dpSnapshot ?? null;
  const currentPhase = step?.phase
    ? step.phase
    : step?.subproblemSize != null
      ? "solve-prefix"
      : step?.midpoint != null
        ? "divide-and-conquer"
        : "idle";

  const summaryCards = [
    { label: "Queries", value: qInput.trim() || "0" },
    { label: "Rendered prefix", value: currentTree?.size ?? "—" },
    { label: "Playback steps", value: steps.length },
    { label: "Final scores", value: answers.length || "—" },
  ];

  const dockPanels = [
    {
      id: "input",
      title: "Input Playground",
      subtitle: inputError ? "Fix the input to resume playback." : "Edit the tree and replay the solver.",
      defaultZone: "left",
      content: (
        <div className="gogt-panel-body">
          <div className="gogt-examples">
            {EXAMPLES.map((example) => (
              <button
                key={example.label}
                type="button"
                className="gogt-example-btn"
                onClick={() => {
                  setQInput(example.q);
                  setParentsInput(example.parents);
                }}
              >
                {example.label}
              </button>
            ))}
          </div>

          <label className="gogt-field">
            <span>q insertions</span>
            <input
              className="gogt-input"
              value={qInput}
              onChange={(event) => setQInput(event.target.value)}
            />
          </label>

          <label className="gogt-field">
            <span>Parent list</span>
            <textarea
              className="gogt-textarea"
              value={parentsInput}
              onChange={(event) => setParentsInput(event.target.value)}
            />
          </label>

          {inputError ? (
            <div className="gogt-error">{inputError}</div>
          ) : (
            <div className="gogt-output-wrap">
              <div className="gogt-output-label">Final answers</div>
              <div className="gogt-output mono">{answers.join(" ")}</div>
            </div>
          )}

          <div className="gogt-parent-strip">
            <div className="gogt-output-label">Parent parsing preview</div>
            <div className="gogt-parent-grid">
              {(parsedParentSnapshot.length > 0
                ? parsedParentSnapshot
                : parentsInput
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((value) => Number(value) - 1)
              ).map((value, idx) => {
                const isActive = step?.currentParentIndex === idx;
                const prevValue = prevParsedParentsRef.current?.[idx];
                const wasRevealed = prevValue != null;

                return (
                  <div key={`parent-${idx}`} className="gogt-parent-column">
                    <div className="gogt-parent-column-label">node {idx + 2}</div>
                    <div
                      className={`gogt-parent-cell ${isActive ? "active" : ""} ${wasRevealed ? "revealed" : ""}`}
                    >
                      <span>{Number.isFinite(value) ? value + 1 : "?"}</span>
                      <small>parent</small>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="gogt-parent-note">
              Input is 1-indexed. The solver immediately stores parents in 0-based
              form for the DP passes.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "storyboard",
      title: "Playback Storyboard",
      subtitle: step ? `Step ${stepIndex + 1} of ${steps.length}` : "Press play to start.",
      defaultZone: "right",
      content: (
        <div className="gogt-panel-body">
          <div className="gogt-step-overview">
            <div className="gogt-step-pill">{currentPhase}</div>
            <div className="gogt-step-copy">
              <strong>
                {step ? `Line ${step.activeLine}` : "Playback not started"}
              </strong>
              <p>
                {step
                  ? step.message
                  : "Start playback to see the parent parsing, midpoint selection, DP propagation, and answer filling."}
              </p>
            </div>
          </div>

          <div className="gogt-metrics">
            <div className="gogt-metric-card">
              <span>Interval</span>
              <strong>
                {step?.intervalLeft != null && step?.intervalRight != null
                  ? `[${step.intervalLeft}, ${step.intervalRight}]`
                  : "—"}
              </strong>
            </div>
            <div className="gogt-metric-card">
              <span>Midpoint</span>
              <strong>{step?.midpoint ?? "—"}</strong>
            </div>
            <div className="gogt-metric-card">
              <span>Computed value</span>
              <strong>{step?.computedValue ?? "—"}</strong>
            </div>
            <div className="gogt-metric-card">
              <span>Stack size</span>
              <strong>{step?.stackSize ?? 0}</strong>
            </div>
          </div>

          <div className="gogt-stack-row">
            <Stack3D
              label="interval stack"
              items={step?.stack?.map(([left, right]) => `[${left} — ${right}]`) ?? []}
              emptyText="empty"
              topBadge="top"
              highlightIndex={step?.stack ? step.stack.length - 1 : -1}
            />
          </div>

          <div className="gogt-output-wrap">
            <div className="gogt-output-label">Partial answers at this step</div>
            <PartialAnswersPanel
              label=""
              answers={step?.answers ?? []}
              prevAnswers={prevAnswersRef.current}
              labelPrefix="a"
            />
          </div>
        </div>
      ),
    },
    {
      id: "code",
      title: "Simplified Solution Trace",
      subtitle: step ? `Active line ${step.activeLine}` : "Line-by-line solution view.",
      defaultZone: "full",
      content: (
        <CodeTracePanel
          step={step}
          codeLines={SOLUTION_CODE}
          title="Simplified Solution Trace"
          subtitle={
            step
              ? `Active line ${step.activeLine}: ${step.message}`
              : "Trace your simplified Codeforces solution line-by-line."
          }
        />
      ),
    },
    {
      id: "tree",
      title: "Tree State Preview",
      subtitle: currentTree?.size ? `Prefix size ${currentTree.size}` : "Waiting for a rendered prefix.",
      defaultZone: "full",
      content: (
        <TreeStatePanel
          currentTree={currentTree}
          treeFocus={treeFocus}
          stepKey={stepKey}
          dpSnapshot={dpSnapshot}
          maxTreeNodesToRender={MAX_TREE_NODES_TO_RENDER}
        />
      ),
    },
  ];

  return (
    <div className="gogt-shell">
      <section className="gogt-hero">
        <div className="gogt-hero-copy">
          <span className="gogt-kicker">Codeforces F • Tree game + DP</span>
          <h2>See how each prefix of the growing tree gets solved.</h2>
          <p>
            This walkthrough combines the divide-and-conquer outer loop, the
            `first/second/third` DP arrays, and a live tree preview so the score
            update is easier to follow at every step.
          </p>
        </div>

        <div className="gogt-summary-grid">
          {summaryCards.map((card) => (
            <div key={card.label} className="gogt-summary-card">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          ))}
        </div>
      </section>
      <DockableWorkspace
        title="Game On Growing Tree Workspace"
        panels={dockPanels}
        initialLayout={{
          left: ["input"],
          right: ["storyboard"],
          full: ["tree", "code"],
          minimized: [],
        }}
      />

      <FloatingPanel title="Playback Controls">
        <PlaybackControls
          onReset={handleReset}
          onPrev={stepBack}
          onPlayToggle={togglePlay}
          onNext={stepForward}
          resetDisabled={steps.length === 0}
          prevDisabled={stepIndex <= 0}
          nextDisabled={steps.length === 0 || isDone}
          isPlaying={isPlaying}
          isDone={isDone}
          speed={speed}
          onSpeedChange={(event) => setSpeed(Number(event.target.value))}
          speedIndicator={`${speed}ms`}
        />
      </FloatingPanel>
    </div>
  );
}
