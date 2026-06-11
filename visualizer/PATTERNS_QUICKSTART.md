# Patterns Quick Start

Apply algorithm step patterns to your visualizer in 5 minutes.

## Step 1: Identify Your Pattern(s)

Look at your algorithm and pick which pattern(s) fit:

| Your Algorithm | Pattern | Example |
|---|---|---|
| Make binary choices (include/exclude, buy/sell) | `createDPStep()` | Knapsack |
| Traverse a tree (left, right, visit) | `createTreeStep()` | DFS |
| Traverse tree + update DP arrays | `createTreeDPStep()` | Tree DP |
| Search or divide an interval | `createRangeStep()` | Binary Search |
| Iterate through array | `createPositionStep()` | Sorting |
| Use a call stack or explicit stack | `createStackStep()` | Backtracking |
| Divide → solve → merge | `createDACStep()` | Merge Sort |

## Step 2: Import Pattern Builders

```js
import { 
  createDPStep, 
  createTreeStep,
  createPositionStep,
  // ... whatever patterns your algorithm uses
} from '../../utils/stepBuilder';
```

## Step 3: Replace Manual Step Objects

**Before:**
```js
steps.push({
  activeLine: 5,
  relatedLines: [5],
  message: "Include item 3",
  dpSnapshot: { dp: dp.slice() },
  decision: "take",
});
```

**After:**
```js
steps.push(
  createDPStep(
    5,
    "take",
    "Include item 3",
    { dp: dp.slice() }
  )
);
```

## Step 4: Use useAlgorithmState in Components

**Before:**
```js
function MyComponent({ step }) {
  if (step?.decision === "take") {
    return <div>Take</div>;
  }
}
```

**After:**
```js
import { useAlgorithmState } from '../../hooks/useAlgorithmState';

function MyComponent({ step }) {
  const { dpDecision } = useAlgorithmState(step);
  
  if (dpDecision?.decision === "take") {
    return <div>Take</div>;
  }
}
```

## Step 5: Test & Done

Run:
```bash
npm run dev
npx vite build
```

Playback should work identically. Patterns are recognized automatically.

---

## Common Patterns by Problem Type

### DP: Knapsack, Coin Change, House Robber

```js
import { createDPStep } from '../../utils/stepBuilder';

// In your step generation loop:
steps.push(
  createDPStep(
    lineNumber,
    "take",  // or "skip"
    `Decided to ${decision} item ${i}`,
    { dp: dp.slice(), memo: memo.slice() }  // snapshots
  )
);
```

### Tree Traversal: DFS, InOrder, LCA

```js
import { createTreeStep } from '../../utils/stepBuilder';

steps.push(
  createTreeStep(
    7,
    "left",  // or "right", "visit", "backtrack"
    currentNode,
    parentNode,
    `Visit left child of ${parentNode}`,
    { highlightNode: currentNode }  // focus
  )
);
```

### Sorting: Merge, Quick Sort

```js
import { createRangeStep, createPositionStep } from '../../utils/stepBuilder';

// When selecting a range
steps.push(
  createRangeStep(
    10,
    4,      // left
    8,      // right
    "partition",
    `Partition range [4, 8]`
  )
);

// When comparing elements
steps.push(
  createPositionStep(
    15,
    i,      // index
    arr[i], // value
    "compare",
    `Compare ${arr[i]} with pivot`
  )
);
```

### Backtracking: Permutations, N-Queens, Subsets

```js
import { createStackStep } from '../../utils/stepBuilder';

// When recursing
steps.push(
  createStackStep(
    20,
    stack.slice(),  // current call stack (array of call info)
    `Push call: explore(remaining=[${remaining}])`,
    "push"
  )
);

// When backtracking
steps.push(
  createStackStep(
    25,
    stack.slice(),
    `Pop: backtrack from ${stack[stack.length - 1].choice}`,
    "pop"
  )
);
```

---

## What If Your Pattern Doesn't Fit?

Use the generic builder:

```js
import { createStepBuilder } from '../../utils/stepBuilder';

const step = createStepBuilder({ phase: 'my-custom-phase' })({
  activeLine: 10,
  message: "Something happens",
  customProperty: value,
});
```

Then open an issue to discuss if this should be a standard pattern!

---

## Component Pattern Recognition

Once you use patterns, components automatically recognize them:

```js
import { useAlgorithmState } from '../../hooks/useAlgorithmState';

function SmartVisualizer({ step }) {
  const {
    dpDecision,        // { decision: "take"|"skip", dpSnapshot }
    treeTraversal,     // { direction: "left"|"right"|..., currentNode, parentNode }
    range,             // { left, right, operation }
    position,          // { index, value, operation }
    stack,             // { items: [...], size, operation }
    divideAndConquer,  // { left, right, midpoint, operation }
  } = useAlgorithmState(step);

  // Render based on what pattern is present
  if (dpDecision) {
    return <DPVisualization decision={dpDecision.decision} />;
  }
  if (treeTraversal?.direction === 'left') {
    return <TreeArrow direction="left" />;
  }
  // ... etc
}
```

---

## Tips

**Shared Context**: For steps that all share common properties (like DP snapshots):

```js
const dpContext = { snapshot, phase: "solve" };

const getDPSnapshot = () => ({ /* ... */ });

for (let i = 0; i < n; i++) {
  const step = createDPStep(5, "take", msg, getDPSnapshot());
  Object.assign(step, dpContext);  // Merge in shared props
  steps.push(step);
}
```

**Helper Functions**: Create helpers to reduce boilerplate:

```js
const captureDP = (line, decision, msg) => {
  steps.push(createDPStep(line, decision, msg, getDPSnapshot()));
  Object.assign(steps[steps.length - 1], dpContext);
};

// Then just:
captureDP(5, "take", "Include item");
captureDP(6, "skip", "Exclude item");
```

**Group Steps**: Use `groupStepsByPattern()` to organize:

```js
import { groupStepsByPattern } from '../../utils/stepPatternComponents';

const { tree, dp, dac } = groupStepsByPattern(allSteps);
console.log(`Tree steps: ${tree.length}, DP steps: ${dp.length}`);
```

---

## Troubleshooting

**Patterns not recognized in component:**
- Did you call `useAlgorithmState(step)` instead of accessing `step.property` directly?
- Check that your step's `phase` matches expected pattern (starts with `dp-`, `tree-`, etc.)

**Build failed:**
- Make sure you imported the builder: `import { createXStep } from '../../utils/stepBuilder'`
- Run `npx vite build` to see full error

**Steps still work but patterns seem wrong:**
- That's fine! Components gracefully handle both pattern and non-pattern steps
- No breaking changes

---

## Next: Contribute a Refactor

If you refactor a problem to use patterns:
1. Open a PR with the changes
2. Add your problem name to the end of `src/utils/REFACTOR_EXAMPLE.md`
3. Include before/after code snippet
4. Mark as "Ready for Review"

Your refactor helps the next developer do the same!

---

**Questions?** See `PATTERNS_SUMMARY.md` for complete reference.
