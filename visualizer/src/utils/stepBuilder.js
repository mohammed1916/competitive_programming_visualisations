/**
 * Utility functions for building step objects in algorithm visualizers.
 * Provides structured patterns for common algorithmic states.
 */

export function createStepBuilder(initialState = {}) {
  return (overrides = {}) => ({
    activeLine: null,
    relatedLines: [],
    message: "",
    phase: null,
    ...initialState,
    ...overrides,
  });
}

/**
 * DP Decision pattern: Track which choice was made at each step
 * Usage: dpDecision(activeLine, "skip" | "take", message, dpSnapshot)
 */
export function createDPStep(activeLine, decision, message, dpSnapshot = {}) {
  return {
    activeLine,
    relatedLines: [activeLine],
    message,
    phase: decision === "take" ? "dp-take" : "dp-skip",
    decision, // "take" or "skip"
    dpSnapshot,
  };
}

/**
 * Tree Traversal pattern: Track node visits and edge traversals
 * Usage: treeVisit(activeLine, "left" | "right" | "visit", nodeId, parentId)
 */
export function createTreeStep(activeLine, direction, currentNode, parentNode, message, focus = null) {
  return {
    activeLine,
    relatedLines: [activeLine],
    message,
    phase: `tree-${direction}`,
    direction, // "left", "right", "visit", "backtrack"
    currentNode,
    parentNode,
    focus,
  };
}

/**
 * Tree DP pattern: Combines tree traversal with DP array snapshots
 * Common in tree DP problems (tree heights, subtree sums, etc.)
 * Usage: treeDP(activeLine, "up" | "down", sourceNode, targetNode, message, dpSnapshot, focus)
 */
export function createTreeDPStep(
  activeLine,
  direction,
  sourceNode,
  targetNode,
  message,
  dpSnapshot = {},
  focus = null,
  relatedLines = [activeLine],
) {
  return {
    activeLine,
    relatedLines,
    message,
    phase: `tree-dp-${direction}`,
    direction, // "up", "down"
    sourceNode,
    targetNode,
    dpSnapshot,
    focus,
  };
}

/**
 * Interval/Range pattern: For divide-and-conquer, binary search, etc.
 * Usage: rangeStep(activeLine, left, right, operation, message)
 */
export function createRangeStep(activeLine, left, right, operation, message, detail = {}) {
  return {
    activeLine,
    relatedLines: [activeLine],
    message,
    phase: `range-${operation}`,
    operation, // "search", "divide", "merge"
    intervalLeft: left,
    intervalRight: right,
    ...detail,
  };
}

/**
 * Index/Position pattern: Track iteration through a sequence
 * Usage: positionStep(activeLine, index, value, operation, message)
 */
export function createPositionStep(activeLine, index, value, operation, message, context = {}) {
  return {
    activeLine,
    relatedLines: [activeLine],
    message,
    phase: `pos-${operation}`,
    operation, // "read", "write", "compare", "swap"
    currentIndex: index,
    currentValue: value,
    ...context,
  };
}

/**
 * Stack/Recursion pattern: Track function call stack
 * Usage: stackStep(activeLine, stack, message)
 */
export function createStackStep(activeLine, stack, message, operation = "push") {
  return {
    activeLine,
    relatedLines: [activeLine],
    message,
    phase: `stack-${operation}`,
    operation, // "push", "pop", "peek"
    stack: [...stack],
    stackSize: stack.length,
  };
}

/**
 * Batch step creation with common context
 * Useful for creating many similar steps in a loop
 */
export function createStepSequence(templateFn, count, context = {}) {
  const steps = [];
  for (let i = 0; i < count; i++) {
    const step = templateFn(i, context);
    if (step) steps.push(step);
  }
  return steps;
}

/**
 * Helper to add snapshot data to any step
 */
export function withSnapshot(step, snapshotData = {}) {
  return {
    ...step,
    snapshot: snapshotData,
  };
}

/**
 * Helper to add focus/highlight data
 */
export function withFocus(step, focus = {}) {
  return {
    ...step,
    focus,
  };
}

/**
 * Divide-and-conquer with recursion pattern
 * For problems like merge sort, quick sort, divide-and-conquer optimization
 */
export function createDACStep(
  activeLine,
  operation,
  intervalLeft,
  intervalRight,
  message,
  detail = {},
  relatedLines = [activeLine],
) {
  return {
    activeLine,
    relatedLines,
    message,
    phase: `dac-${operation}`,
    operation, // "divide", "conquer", "merge"
    intervalLeft,
    intervalRight,
    ...detail,
  };
}

/**
 * Enhanced step builder with shared context
 * Useful when building a sequence of steps that share state
 */
export function createContextualStepBuilder(sharedContext = {}) {
  return (overrides = {}) => ({
    ...sharedContext,
    activeLine: null,
    relatedLines: [],
    message: "",
    ...overrides,
  });
}
