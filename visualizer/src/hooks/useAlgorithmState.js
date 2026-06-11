import { useMemo } from 'react';

/**
 * Extracts and provides easy access to common algorithmic state patterns
 * from a step object. Works with steps created by stepBuilder utilities.
 */
export function useAlgorithmState(step) {
  // DP pattern
  const dpDecision = useMemo(() => {
    if (!step || step.phase?.startsWith('dp-')) {
      return {
        decision: step?.decision, // "take" or "skip"
        dpSnapshot: step?.dpSnapshot,
      };
    }
    return null;
  }, [step]);

  // Tree pattern
  const treeTraversal = useMemo(() => {
    if (!step || step.phase?.startsWith('tree-')) {
      return {
        direction: step?.direction, // "left", "right", "visit", "backtrack"
        currentNode: step?.currentNode,
        parentNode: step?.parentNode,
      };
    }
    return null;
  }, [step]);

  // Interval/Range pattern (for divide-and-conquer, binary search, etc.)
  const range = useMemo(() => {
    if (!step || step.phase?.startsWith('range-')) {
      return {
        operation: step?.operation, // "search", "divide", "merge"
        left: step?.intervalLeft ?? step?.rangeLeft,
        right: step?.intervalRight ?? step?.rangeRight,
      };
    }
    return null;
  }, [step]);

  // Position/Index pattern
  const position = useMemo(() => {
    if (!step || step.phase?.startsWith('pos-')) {
      return {
        operation: step?.operation, // "read", "write", "compare", "swap"
        index: step?.currentIndex,
        value: step?.currentValue,
      };
    }
    return null;
  }, [step]);

  // Stack/Recursion pattern
  const stack = useMemo(() => {
    if (!step || step.phase?.startsWith('stack-')) {
      return {
        operation: step?.operation, // "push", "pop", "peek"
        items: step?.stack ?? [],
        size: step?.stackSize ?? 0,
      };
    }
    return null;
  }, [step]);

  // Tree DP pattern (combines tree traversal + DP snapshots)
  const treeDP = useMemo(() => {
    if (!step || step.phase?.startsWith('tree-dp-')) {
      return {
        direction: step?.direction, // "up", "down"
        sourceNode: step?.sourceNode,
        targetNode: step?.targetNode,
        dpSnapshot: step?.dpSnapshot,
      };
    }
    return null;
  }, [step]);

  // Divide-and-conquer pattern
  const divideAndConquer = useMemo(() => {
    if (!step || step.phase?.startsWith('dac-')) {
      return {
        operation: step?.operation, // "divide", "conquer", "merge"
        left: step?.intervalLeft,
        right: step?.intervalRight,
      };
    }
    return null;
  }, [step]);

  return {
    phase: step?.phase,
    activeLine: step?.activeLine,
    message: step?.message,
    focus: step?.focus,
    snapshot: step?.snapshot,
    // Pattern-specific accessors
    dpDecision,
    treeTraversal,
    range,
    position,
    stack,
    treeDP,
    divideAndConquer,
  };
}
