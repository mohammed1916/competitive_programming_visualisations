# Refactoring Example: GameOnGrowingTree

This document shows how **GameOnGrowingTree** was refactored to use the modular step patterns, and how you can apply the same approach to other visualizers.

## Before: Manual Step Construction

```js
function solveWithTrace(parentZeroBased, size, answersSnapshot) {
  const first = new Array(size).fill(0);
  const second = new Array(size).fill(0);
  const third = new Array(size).fill(0);
  const steps = [];

  const capture = (activeLine, message, relatedLines, focus) => {
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

  for (let node = size - 1; node >= 1; node--) {
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
    // ... more manual step building
  }
}
```

**Problems:**
- Repetitive, error-prone manual object construction
- Hard to refactor across 100+ problems
- No standard pattern recognition
- Difficult to add new visualizations

## After: Using Pattern Builders

```js
import { createTreeDPStep, createPositionStep } from '../../utils/stepBuilder';

function solveWithTrace(parentZeroBased, size, answersSnapshot) {
  const first = new Array(size).fill(0);
  const second = new Array(size).fill(0);
  const third = new Array(size).fill(0);
  const steps = [];
  const snapshotLimit = Math.min(size, MAX_TREE_NODES_TO_RENDER);

  // Shared context for all DP steps
  const dpContext = {
    subproblemSize: size,
    stackSize: 0,
    answers: answersSnapshot,
  };

  const getDPSnapshot = () => ({
    first: first.slice(0, snapshotLimit),
    second: second.slice(0, snapshotLimit),
    third: third.slice(0, snapshotLimit),
  });

  for (let node = size - 1; node >= 1; node--) {
    const parent = parentZeroBased[node];
    const depth = second[node] + 1;

    // Use pattern builder
    steps.push(
      createTreeDPStep(
        9,
        "up",
        node,
        parent,
        `Bottom-up: node ${node} contributes depth ${depth} to parent ${parent}.`,
        getDPSnapshot(),
        { sourceNode: node, targetNode: parent },
        [9, 10, 11],
      )
    );
    // Merge in shared context
    Object.assign(steps[steps.length - 1], dpContext);
    
    // ... rest of logic
  }
}
```

**Benefits:**
- Clear, intent-driven step creation
- Reusable patterns across problems
- Easy to recognize patterns in UI components
- Standardized structure enables automation

## Pattern Usage by Type

### 1. Position/Index Pattern (Reading parents)

**Before:**
```js
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
```

**After:**
```js
import { createPositionStep } from '../../utils/stepBuilder';

raw.forEach((value, idx) => {
  const zeroBased = value - 1;
  parsed.push(zeroBased);
  steps.push(
    createPositionStep(
      2,                    // activeLine
      idx,                  // index
      value,                // value (1-based for display)
      "read",               // operation: "read" | "write" | "compare" | "swap"
      `Read parent ${value} for node ${idx + 1} and store ${zeroBased}.`,
      {
        phase: "parse-parent",
        parsedParents: [...parsed],
        currentParentValue: zeroBased,
      }
    )
  );
});
```

**UI Component Can Now Recognize:**
```js
import { useAlgorithmState } from '../../hooks/useAlgorithmState';

function ParentViewer({ step }) {
  const { position } = useAlgorithmState(step);
  
  if (position?.operation === "read") {
    return <div>Reading index {position.index}, value: {position.value}</div>;
  }
}
```

### 2. Tree DP Pattern (Up and Down Passes)

**Before:**
```js
steps.push({
  activeLine: 9,
  relatedLines: [9, 10, 11],
  message: `Bottom-up: node ${node} contributes depth ${depth} to parent ${parent}.`,
  subproblemSize: size,
  stackSize: 0,
  focus: { sourceNode: node, targetNode: parent, direction: "up", phase: "bottom-up" },
  dpSnapshot: {
    first: first.slice(0, snapshotLimit),
    second: second.slice(0, snapshotLimit),
    third: third.slice(0, snapshotLimit),
  },
  answers: answersSnapshot,
});
```

**After:**
```js
import { createTreeDPStep } from '../../utils/stepBuilder';

steps.push(
  createTreeDPStep(
    9,                              // activeLine
    "up",                           // direction: "up" | "down"
    node,                           // sourceNode
    parent,                         // targetNode
    `Bottom-up: node ${node}...`,   // message
    getDPSnapshot(),                // dpSnapshot
    { sourceNode: node, targetNode: parent },  // focus
    [9, 10, 11],                    // relatedLines
  )
);
Object.assign(steps[steps.length - 1], dpContext); // Merge shared context
```

**UI Component Can Now Recognize:**
```js
import { useAlgorithmState } from '../../hooks/useAlgorithmState';

function TreeDPVisualizer({ step }) {
  const { treeDP } = useAlgorithmState(step);
  
  if (treeDP?.direction === "up") {
    return <TreeArrow from={treeDP.sourceNode} to={treeDP.targetNode} color="blue" />;
  }
  if (treeDP?.direction === "down") {
    return <TreeArrow from={treeDP.sourceNode} to={treeDP.targetNode} color="green" />;
  }
}
```

### 3. Divide-and-Conquer Pattern (Interval Processing)

**Before:**
```js
const capture = (activeLine, message, l, r, m, c, relatedLines) => {
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

capture(31, `Midpoint is ${mid}.`, left, right, mid, null, [31]);
```

**After:**
```js
import { createDACStep } from '../../utils/stepBuilder';

const captureDACStep = (activeLine, message, l, r, m, c, relatedLines) => {
  steps.push(
    createDACStep(
      activeLine,
      m ? "conquer" : "divide",  // operation auto-inferred
      l,
      r,
      message,
      {
        midpoint: m,
        computedValue: c,
        stackSize: stack.length,
        stack: stack.slice(),
        answers: ans.slice(2, q + 2),
      },
      relatedLines,
    )
  );
};

captureDACStep(31, `Midpoint is ${mid}.`, left, right, mid, null, [31]);
```

**UI Component Can Now Recognize:**
```js
import { useAlgorithmState } from '../../hooks/useAlgorithmState';

function IntervalVisualizer({ step }) {
  const { divideAndConquer } = useAlgorithmState(step);
  
  if (divideAndConquer) {
    return (
      <Range
        left={divideAndConquer.left}
        right={divideAndConquer.right}
        operation={divideAndConquer.operation}
        color={divideAndConquer.operation === 'divide' ? 'red' : 'green'}
      />
    );
  }
}
```

## Migration Checklist

When refactoring a visualizer:

- [ ] Identify which patterns your algorithm uses (DP, Tree, Interval, Position, Stack, etc.)
- [ ] Import the appropriate pattern builders: `import { createXStep } from '../../utils/stepBuilder'`
- [ ] Replace manual step construction with pattern builders
- [ ] Extract shared context (like `dpContext`) for repeated properties
- [ ] Create helper functions (like `captureDACStep`) to reduce boilerplate
- [ ] Update components to use `useAlgorithmState` to extract pattern-specific data
- [ ] Test that playback still works and step data is correct
- [ ] Update documentation with the new pattern(s)

## Multi-Problem Example: Refactoring Tree Problems

If you have tree problems using the same pattern, you could even extract a shared hook:

```js
// hooks/useTreeTraversal.js
export function useTreeTraversal(steps) {
  const treeSteps = steps.filter(s => s.phase?.startsWith('tree-'));
  
  return {
    steps: treeSteps,
    upward: treeSteps.filter(s => s.direction === 'up'),
    downward: treeSteps.filter(s => s.direction === 'down'),
  };
}

// Components can now do:
function TreeVisualizer({ allSteps }) {
  const { upward, downward } = useTreeTraversal(allSteps);
  // Render both passes in parallel
}
```

## Performance Note

Pattern builders are lightweight — they just return plain objects. No performance cost over manual construction. The real benefit is **consistency and maintainability** across 100+ problems.
