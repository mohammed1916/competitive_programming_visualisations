# Algorithm Step Patterns

Reusable patterns for building visualization steps. Use these to standardize step creation across different problems and enable UI components to recognize and handle common algorithm patterns intelligently.

## Pattern Types

### 1. DP Decision Pattern
For problems with "take/skip" or binary choices at each step.

```js
import { createDPStep } from '../utils/stepBuilder';

// Usage in your step generation:
const steps = [];
steps.push(
  createDPStep(
    3, // activeLine
    "take", // decision: "take" or "skip"
    "Include item 5 (weight=2, value=3)",
    { dp: currentDPArray } // optional snapshot
  )
);
```

**Where to use:** Knapsack, Coin Change, House Robber, etc.

---

### 2. Tree Traversal Pattern
For tree problems with left/right traversal.

```js
import { createTreeStep } from '../utils/stepBuilder';

// Usage:
steps.push(
  createTreeStep(
    5, // activeLine
    "left", // direction: "left", "right", "visit", "backtrack"
    3, // currentNode
    1, // parentNode
    "Traverse left to node 3",
    { sourceNode: 3, targetNode: null, phase: "traverse" } // focus
  )
);
```

**Where to use:** Tree DFS, BST operations, Path problems, etc.

---

### 3. Interval/Range Pattern
For divide-and-conquer, binary search, sliding window.

```js
import { createRangeStep } from '../utils/stepBuilder';

// Usage:
steps.push(
  createRangeStep(
    7, // activeLine
    2, // left bound
    8, // right bound
    "search", // operation: "search", "divide", "merge"
    "Binary search in range [2,8]",
    { target: 5, found: false } // extra context
  )
);
```

**Where to use:** Binary Search, Merge Sort, Quick Sort, etc.

---

### 4. Position/Index Pattern
For iteration and element-by-element processing.

```js
import { createPositionStep } from '../utils/stepBuilder';

// Usage in a loop:
for (let i = 0; i < arr.length; i++) {
  steps.push(
    createPositionStep(
      4, // activeLine
      i, // index
      arr[i], // value
      "read", // operation: "read", "write", "compare", "swap"
      `Read element ${arr[i]} at index ${i}`
    )
  );
}
```

**Where to use:** Sorting, Array traversal, Search, etc.

---

### 5. Stack/Recursion Pattern
For tracking function call stack or explicit stack operations.

```js
import { createStackStep } from '../utils/stepBuilder';

// Usage:
const callStack = [{ func: 'dfs', node: 3 }, { func: 'dfs', node: 1 }];
steps.push(
  createStackStep(
    6, // activeLine
    callStack, // stack array
    "Push dfs(3) to call stack",
    "push" // operation: "push", "pop", "peek"
  )
);
```

**Where to use:** DFS, Backtracking, Topological Sort, etc.

---

## Using useAlgorithmState Hook

Components can automatically extract pattern-specific data:

```js
import { useAlgorithmState } from '../hooks/useAlgorithmState';

function MyVisualizer({ step }) {
  const { dpDecision, treeTraversal, range, position, stack } = useAlgorithmState(step);

  if (dpDecision) {
    // Highlight the decision: was it "take" or "skip"?
    return <div>Decision: {dpDecision.decision}</div>;
  }

  if (treeTraversal?.direction === 'left') {
    // Animate traversal to the left
    return <div>Going left to node {treeTraversal.currentNode}</div>;
  }

  if (range) {
    // Highlight the search range
    return <div>Searching in [{range.left}, {range.right}]</div>;
  }

  return null;
}
```

---

## Migration Example

**Before (unstructured):**
```js
const steps = [];
steps.push({
  activeLine: 3,
  message: "Choose to take item 5",
  // ... lots of custom properties
});
```

**After (using patterns):**
```js
import { createDPStep } from '../utils/stepBuilder';

const steps = [];
steps.push(createDPStep(3, "take", "Choose to take item 5", dpSnapshot));
```

Benefits:
- Clear, consistent structure
- UI components recognize patterns automatically
- Easier to refactor visualizations across problems
- New developers understand the step format immediately

---

## Custom Step Builders

For problems that don't fit existing patterns, extend or compose:

```js
import { createStepBuilder, withSnapshot, withFocus } from '../utils/stepBuilder';

const myStep = createStepBuilder({ phase: 'custom-phase' })({
  activeLine: 5,
  message: "Custom step",
  customProperty: value,
});

// Add snapshots and focus:
const enhanced = withFocus(
  withSnapshot(myStep, { data: snapshot }),
  { highlight: nodeId }
);
```
