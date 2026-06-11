# Algorithm Pattern System — Complete Summary

This system provides modular, reusable step builders and hooks for standardizing how algorithm visualizations are structured across all problem types.

## Files Added

### Core Utilities

**[stepBuilder.js](./stepBuilder.js)**
- `createDPStep()` — Binary choice patterns (take/skip, yes/no)
- `createTreeStep()` — Tree traversal patterns (left, right, visit, backtrack)
- `createTreeDPStep()` — Combined tree + DP patterns (up/down with snapshots)
- `createRangeStep()` — Interval/range patterns (binary search, divide-and-conquer)
- `createPositionStep()` — Index iteration patterns (read, write, compare, swap)
- `createStackStep()` — Recursion/stack patterns (push, pop, peek)
- `createDACStep()` — Divide-and-conquer patterns (divide, conquer, merge)
- `createContextualStepBuilder()` — For building sequences with shared context
- Helper functions: `withSnapshot()`, `withFocus()`

**[useAlgorithmState.js](../../hooks/useAlgorithmState.js)**
- Hook that extracts pattern-specific data from any step
- Returns objects with pattern-specific accessors
- Patterns: `dpDecision`, `treeTraversal`, `range`, `position`, `stack`, `treeDP`, `divideAndConquer`
- Safe: returns `null` if pattern doesn't apply to current step

**[stepPatternComponents.js](./stepPatternComponents.js)**
- `createPatternSwitch()` — Build pattern-aware components with minimal boilerplate
- `groupStepsByPattern()` — Organize steps by algorithm pattern
- `analyzeStepPatterns()` — Get summary of patterns in a step sequence
- `PatternRenderers` — Common symbols/icons for rendering each pattern type

### Documentation

**[STEP_PATTERNS.md](./STEP_PATTERNS.md)**
- Detailed guide for each pattern type
- Code examples for step creation
- Component usage examples
- Migration instructions

**[REFACTOR_EXAMPLE.md](./REFACTOR_EXAMPLE.md)**
- Before/after examples from GameOnGrowingTree refactor
- Shows exact patterns used in tree-DP problems
- Demonstrates component integration
- Migration checklist

## How It Works

### 1. Step Creation (Algorithm Side)

```js
import { createTreeDPStep, createDACStep } from '../utils/stepBuilder';

// Tree-DP step
steps.push(
  createTreeDPStep(
    9, "up", node, parent, 
    "Bottom-up processing",
    dpSnapshot, focus, [9, 10, 11]
  )
);

// DAC step
steps.push(
  createDACStep(
    31, "divide", left, right,
    "Compute midpoint",
    { midpoint, computedValue }
  )
);
```

### 2. State Access (Component Side)

```js
import { useAlgorithmState } from '../hooks/useAlgorithmState';

function MyVisualizer({ step }) {
  const { treeDP, divideAndConquer, position } = useAlgorithmState(step);
  
  // Component automatically knows what pattern this step uses
  if (treeDP?.direction === 'up') {
    return <TreeArrowUp from={treeDP.sourceNode} to={treeDP.targetNode} />;
  }
  
  if (divideAndConquer) {
    return <IntervalHighlight left={divideAndConquer.left} right={divideAndConquer.right} />;
  }
}
```

### 3. Pattern Recognition (UI Side)

```js
import { createPatternSwitch, PatternRenderers } from '../utils/stepPatternComponents';

const renderer = createPatternSwitch({
  treeDP: (step) => (
    <div>{PatternRenderers.treeDirection(step.direction)}</div>
  ),
  dac: (step) => (
    <div>{PatternRenderers.dacOperation(step.operation)}</div>
  ),
  default: (step) => <div>{step.message}</div>,
});

// Renders appropriate visualization based on step pattern
<div>{renderer(currentStep)}</div>
```

## Pattern Reference

| Pattern | Use Case | Key Properties | Example |
|---------|----------|-----------------|---------|
| **DP** | Binary choices | `decision` ("take"/"skip"), `dpSnapshot` | Knapsack, Coin Change |
| **Tree** | Traversal | `direction` ("left"/"right"/"visit"), `currentNode` | Tree DFS, Path problems |
| **TreeDP** | Tree + DP | `direction`, `sourceNode`, `targetNode`, `dpSnapshot` | **GameOnGrowingTree** |
| **Range** | Intervals | `left`, `right`, `operation` | Binary Search, Merge Sort |
| **Position** | Iteration | `index`, `value`, `operation` | Array traversal, Sorting |
| **Stack** | Recursion | `stack`, `operation` ("push"/"pop"/"peek") | DFS, Backtracking |
| **DAC** | Divide-and-conquer | `left`, `right`, `midpoint`, `operation` | Quick Sort, **GameOnGrowingTree DAC phase** |

## GameOnGrowingTree Refactor

**Before:** 500+ lines of manual step construction with repeated logic  
**After:** Clean pattern-based builders, shared context, DRY code

**Key Changes:**
- `createParentParseSteps()` → uses `createPositionStep()`
- `solveWithTrace()` → uses `createTreeDPStep()` with shared `dpContext`
- `solveAndBuildSteps()` → uses `createDACStep()` with `captureDACStep()` helper

**Result:** 
- Code is more maintainable
- Patterns are explicit and recognizable
- Easier to add new visualizations
- UI components can auto-detect algorithm patterns

## Next Steps: Refactoring Other Problems

### High Priority (Common Patterns)

1. **DP Problems** (Knapsack, Coin Change, House Robber, etc.)
   - Pattern: `createDPStep()` with snapshot
   - Benefit: Reuse across 20+ problems

2. **Tree Problems** (DFS, BST, Path Sum, etc.)
   - Pattern: `createTreeStep()` or `createTreeDPStep()`
   - Benefit: Unified tree visualization logic

3. **Sorting Problems** (Merge Sort, Quick Sort, etc.)
   - Pattern: `createRangeStep()` + `createPositionStep()`
   - Benefit: Animated range visualization

### Medium Priority

- **Binary Search** → `createRangeStep()` with "search" operation
- **Graph DFS/BFS** → `createTreeStep()` extended for graphs
- **Backtracking** → `createStackStep()` with recursion tree

### How to Contribute

For each problem you refactor:
1. Choose the patterns that fit your algorithm
2. Replace manual step construction with pattern builders
3. Update components to use `useAlgorithmState()` 
4. Add an example to `REFACTOR_EXAMPLE.md`
5. Test that playback still works
6. Consider creating shared hooks (like `useTreeTraversal()`) for common patterns

## Performance

- **Zero overhead**: Pattern builders are just factory functions returning plain objects
- **Memory**: Same as before (no extra allocations)
- **Rendering**: No change (components receive same step objects)
- **Benefit**: Maintainability and consistency across codebase

## Testing Pattern Recognition

To verify patterns are working:

```js
import { analyzeStepPatterns } from '../utils/stepPatternComponents';

const analysis = analyzeStepPatterns(steps);
console.log(analysis);
// {
//   treeDP: { count: 24, lineRange: [9, 23] },
//   dac: { count: 18, lineRange: [26, 42] },
//   position: { count: 5, lineRange: [2, 2] },
// }
```

## FAQ

**Q: Do I have to use patterns?**  
A: No, existing visualizers still work. Patterns are optional but encouraged for new work.

**Q: Can I mix patterns in one step?**  
A: Yes! Steps can have multiple pattern properties. `useAlgorithmState()` returns all applicable patterns.

**Q: How do I create a new pattern type?**  
A: Add a `createXStep()` function to `stepBuilder.js`, add recognition logic to `useAlgorithmState.js`, document in `STEP_PATTERNS.md`.

**Q: Will refactoring break existing visualizations?**  
A: No. Pattern builders output standard step objects. Existing components see no difference.

**Q: What if my algorithm doesn't fit any pattern?**  
A: Use `createStepBuilder()` with a custom phase string, or add a new pattern type if it's reusable.
