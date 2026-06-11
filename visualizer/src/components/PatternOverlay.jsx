import { useMemo } from 'react';
import { useAlgorithmState } from '../hooks/useAlgorithmState';
import './PatternOverlay.css';

const PatternLabels = {
  'dp-take': { icon: '✓', label: 'Take', color: '#10b981' },
  'dp-skip': { icon: '✗', label: 'Skip', color: '#ef4444' },
  'tree-left': { icon: '←', label: 'Go Left', color: '#3b82f6' },
  'tree-right': { icon: '→', label: 'Go Right', color: '#3b82f6' },
  'tree-visit': { icon: '●', label: 'Visit', color: '#8b5cf6' },
  'tree-backtrack': { icon: '⤴', label: 'Backtrack', color: '#6b7280' },
  'tree-dp-up': { icon: '↑', label: 'Tree-DP Up', color: '#06b6d4' },
  'tree-dp-down': { icon: '↓', label: 'Tree-DP Down', color: '#ec4899' },
  'dac-divide': { icon: '÷', label: 'Divide', color: '#f59e0b' },
  'dac-conquer': { icon: '⚔', label: 'Conquer', color: '#d97706' },
  'dac-merge': { icon: '⇄', label: 'Merge', color: '#c084fc' },
  'pos-read': { icon: '📖', label: 'Read', color: '#6366f1' },
  'pos-write': { icon: '✏', label: 'Write', color: '#f97316' },
  'pos-compare': { icon: '⚖', label: 'Compare', color: '#14b8a6' },
  'pos-swap': { icon: '⇄', label: 'Swap', color: '#a855f7' },
  'stack-push': { icon: '↑', label: 'Push', color: '#22c55e' },
  'stack-pop': { icon: '↓', label: 'Pop', color: '#ef4444' },
  'stack-peek': { icon: '👀', label: 'Peek', color: '#8b5cf6' },
  'range-search': { icon: '🔍', label: 'Search', color: '#3b82f6' },
  'range-divide': { icon: '÷', label: 'Divide', color: '#f59e0b' },
  'range-merge': { icon: '⇄', label: 'Merge', color: '#c084fc' },
};

export default function PatternOverlay({ step, activeLineDom }) {
  const algorithmState = useAlgorithmState(step);

  const patternInfo = useMemo(() => {
    if (!step?.phase) return null;

    // Try to find exact match first
    if (PatternLabels[step.phase]) {
      return PatternLabels[step.phase];
    }

    // Try to infer from pattern type
    if (algorithmState.dpDecision) {
      const decision = algorithmState.dpDecision.decision;
      return PatternLabels[`dp-${decision}`] || {
        icon: '?',
        label: decision ? decision.toUpperCase() : 'DP',
        color: '#94a3b8',
      };
    }

    if (algorithmState.treeTraversal) {
      const dir = algorithmState.treeTraversal.direction;
      return PatternLabels[`tree-${dir}`] || {
        icon: '?',
        label: dir ? dir.toUpperCase() : 'Tree',
        color: '#3b82f6',
      };
    }

    if (algorithmState.treeDP) {
      const dir = algorithmState.treeDP.direction;
      return PatternLabels[`tree-dp-${dir}`] || {
        icon: '?',
        label: `Tree-DP ${dir?.toUpperCase()}`,
        color: '#06b6d4',
      };
    }

    if (algorithmState.divideAndConquer) {
      const op = algorithmState.divideAndConquer.operation;
      return PatternLabels[`dac-${op}`] || {
        icon: '?',
        label: op ? op.toUpperCase() : 'DAC',
        color: '#f59e0b',
      };
    }

    if (algorithmState.position) {
      const op = algorithmState.position.operation;
      return PatternLabels[`pos-${op}`] || {
        icon: '?',
        label: op ? op.toUpperCase() : 'Position',
        color: '#6366f1',
      };
    }

    if (algorithmState.stack) {
      const op = algorithmState.stack.operation;
      return PatternLabels[`stack-${op}`] || {
        icon: '?',
        label: op ? op.toUpperCase() : 'Stack',
        color: '#22c55e',
      };
    }

    if (algorithmState.range) {
      const op = algorithmState.range.operation;
      return PatternLabels[`range-${op}`] || {
        icon: '?',
        label: op ? op.toUpperCase() : 'Range',
        color: '#3b82f6',
      };
    }

    return null;
  }, [step, algorithmState]);

  if (!patternInfo || !activeLineDom) {
    return null;
  }

  // Get position of the active line element
  const lineRect = activeLineDom.getBoundingClientRect();

  return (
    <div
      className="pattern-overlay"
      style={{
        top: `${lineRect.top + window.scrollY}px`,
        left: `${lineRect.right + 12}px`,
        '--pattern-color': patternInfo.color,
      }}
    >
      <div className="pattern-badge">
        <span className="pattern-icon">{patternInfo.icon}</span>
        <span className="pattern-label">{patternInfo.label}</span>
      </div>
    </div>
  );
}
