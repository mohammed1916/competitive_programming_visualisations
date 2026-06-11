/**
 * Utility to build components that recognize and react to algorithm patterns.
 * Reduces boilerplate when creating pattern-aware visualizations.
 */

export function createPatternSwitch(patterns = {}) {
  return (step) => {
    if (!step) return null;

    // Try to match phase patterns in priority order
    const phasePrefix = step.phase?.split('-')[0];

    if (step.phase?.startsWith('tree-dp-') && patterns.treeDP) {
      return patterns.treeDP({ direction: step.direction, ...step });
    }
    if (step.phase?.startsWith('dac-') && patterns.dac) {
      return patterns.dac({ operation: step.operation, ...step });
    }
    if (step.phase?.startsWith('dp-') && patterns.dp) {
      return patterns.dp({ decision: step.decision, ...step });
    }
    if (step.phase?.startsWith('pos-') && patterns.position) {
      return patterns.position({ operation: step.operation, ...step });
    }
    if (step.phase?.startsWith('tree-') && patterns.tree) {
      return patterns.tree({ direction: step.direction, ...step });
    }
    if (step.phase?.startsWith('stack-') && patterns.stack) {
      return patterns.stack({ operation: step.operation, ...step });
    }
    if (step.phase?.startsWith('range-') && patterns.range) {
      return patterns.range({ operation: step.operation, ...step });
    }

    // Fallback to catch-all handler
    if (patterns.default) {
      return patterns.default(step);
    }

    return null;
  };
}

/**
 * Filter and group steps by pattern type
 */
export function groupStepsByPattern(steps) {
  return {
    treeDP: steps.filter((s) => s.phase?.startsWith('tree-dp-')),
    dac: steps.filter((s) => s.phase?.startsWith('dac-')),
    dp: steps.filter((s) => s.phase?.startsWith('dp-')),
    position: steps.filter((s) => s.phase?.startsWith('pos-')),
    tree: steps.filter((s) => s.phase?.startsWith('tree-')),
    stack: steps.filter((s) => s.phase?.startsWith('stack-')),
    range: steps.filter((s) => s.phase?.startsWith('range-')),
  };
}

/**
 * Create a step summary showing what patterns are present
 */
export function analyzeStepPatterns(steps) {
  const grouped = groupStepsByPattern(steps);
  const summary = {};

  Object.entries(grouped).forEach(([pattern, patternSteps]) => {
    if (patternSteps.length > 0) {
      summary[pattern] = {
        count: patternSteps.length,
        lineRange: [
          Math.min(...patternSteps.map((s) => s.activeLine || Infinity)),
          Math.max(...patternSteps.map((s) => s.activeLine || -Infinity)),
        ],
      };
    }
  });

  return summary;
}

/**
 * Common pattern renderers for reuse
 */
export const PatternRenderers = {
  /**
   * Render tree traversal indicator (up/down)
   */
  treeDirection: (direction) => {
    if (direction === 'up') return '↑ Up';
    if (direction === 'down') return '↓ Down';
    if (direction === 'left') return '← Left';
    if (direction === 'right') return '→ Right';
    if (direction === 'visit') return '● Visit';
    if (direction === 'backtrack') return '⤴ Back';
    return '?';
  },

  /**
   * Render DP decision (take/skip)
   */
  dpDecision: (decision) => {
    if (decision === 'take') return '✓ Take';
    if (decision === 'skip') return '✗ Skip';
    return '?';
  },

  /**
   * Render DAC operation
   */
  dacOperation: (operation) => {
    if (operation === 'divide') return '÷ Divide';
    if (operation === 'conquer') return '⚔ Conquer';
    if (operation === 'merge') return '⇄ Merge';
    return '?';
  },

  /**
   * Render position operation
   */
  posOperation: (operation) => {
    if (operation === 'read') return '📖 Read';
    if (operation === 'write') return '✏️ Write';
    if (operation === 'compare') return '⚖️ Compare';
    if (operation === 'swap') return '⇄ Swap';
    return '?';
  },

  /**
   * Render stack operation
   */
  stackOperation: (operation) => {
    if (operation === 'push') return '↑ Push';
    if (operation === 'pop') return '↓ Pop';
    if (operation === 'peek') return '👀 Peek';
    return '?';
  },
};
