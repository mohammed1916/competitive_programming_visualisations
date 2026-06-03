import React, { useState, useEffect } from 'react';
import './BSTIterator.css';

const BSTIterator = () => {
  const [tree, setTree] = useState(null);
  const [stack, setStack] = useState([]);
  const [sequence, setSequence] = useState([]);
  const [animationState, setAnimationState] = useState('idle');
  const [currentStep, setCurrentStep] = useState(-1);
  const [customInput, setCustomInput] = useState('');
  const [hasNextValue, setHasNextValue] = useState(true);

  // Build BST from array (level-order)
  const buildBST = (arr) => {
    if (!arr || arr.length === 0) return null;

    const nodes = arr.map((val, idx) => (val === null ? null : { val, id: idx, left: null, right: null }));

    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i]) {
        const leftIdx = 2 * i + 1;
        const rightIdx = 2 * i + 2;

        if (leftIdx < nodes.length) {
          nodes[i].left = nodes[leftIdx];
        }
        if (rightIdx < nodes.length) {
          nodes[i].right = nodes[rightIdx];
        }
      }
    }

    return nodes[0];
  };

  // Get left spine of a node
  const getLeftSpine = (node, spineStack = []) => {
    let curr = node;
    while (curr) {
      spineStack.push(curr);
      curr = curr.left;
    }
    return spineStack;
  };

  // Initialize stack with left spine
  const initializeStack = (root) => {
    return getLeftSpine(root, []);
  };

  useEffect(() => {
    const exampleTree = [7, 3, 15, null, null, 9, 20];
    const root = buildBST(exampleTree);
    setTree(root);

    if (root) {
      const initialStack = initializeStack(root);
      setStack([...initialStack]);
    }
  }, []);

  const handleLoadExample = () => {
    const exampleTree = [7, 3, 15, null, null, 9, 20];
    const root = buildBST(exampleTree);
    setTree(root);

    if (root) {
      const initialStack = initializeStack(root);
      setStack([...initialStack]);
    }

    setSequence([]);
    setAnimationState('idle');
    setCurrentStep(-1);
  };

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      const input = customInput
        .split(/[,\s]+/)
        .map(x => (x.toLowerCase() === 'null' ? null : parseInt(x)))
        .filter(x => x !== '' && !isNaN(x));

      const root = buildBST(input);
      setTree(root);

      if (root) {
        const initialStack = initializeStack(root);
        setStack([...initialStack]);
      }

      setCustomInput('');
      setSequence([]);
      setAnimationState('idle');
      setCurrentStep(-1);
    }
  };

  const startAnimation = () => {
    if (!tree) return;

    setAnimationState('running');
    setCurrentStep(0);
    setSequence([]);

    let currentStack = initializeStack(tree);
    let result = [];
    let stepCount = 0;

    const animationSteps = [];

    while (currentStack.length > 0) {
      const node = currentStack.pop();
      result.push(node.val);

      if (node.right) {
        const rightSpine = [];
        getLeftSpine(node.right, rightSpine);
        currentStack = currentStack.concat(rightSpine);
      }

      animationSteps.push({
        step: stepCount,
        stackState: [...currentStack],
        sequence: [...result],
        lastNode: node.val,
      });

      stepCount++;
    }

    setSequence(result);

    let stepIdx = 0;
    const stepInterval = setInterval(() => {
      if (stepIdx < animationSteps.length) {
        setCurrentStep(stepIdx);
        setStack([...animationSteps[stepIdx].stackState]);
        stepIdx++;
      } else {
        clearInterval(stepInterval);
        setAnimationState('completed');
      }
    }, 1000);
  };

  const renderTreeNode = (node, x, y, offset) => {
    if (!node) return null;

    const nodeRadius = 25;
    const verticalGap = 80;

    return (
      <g key={node.id}>
        {node.left && (
          <>
            <line
              x1={x}
              y1={y}
              x2={x - offset}
              y2={y + verticalGap}
              className="bsti-edge"
            />
            {renderTreeNode(node.left, x - offset, y + verticalGap, offset / 2)}
          </>
        )}

        {node.right && (
          <>
            <line
              x1={x}
              y1={y}
              x2={x + offset}
              y2={y + verticalGap}
              className="bsti-edge"
            />
            {renderTreeNode(node.right, x + offset, y + verticalGap, offset / 2)}
          </>
        )}

        <circle cx={x} cy={y} r={nodeRadius} className="bsti-node" />
        <text x={x} y={y} className="bsti-node-label">
          {node.val}
        </text>
      </g>
    );
  };

  const getNodeHighlight = (node) => {
    if (!node) return '';
    const inStack = stack.some(n => n && n.val === node.val);
    return inStack ? 'bsti-node-in-stack' : '';
  };

  return (
    <div className="bsti-container">
      <div className="bsti-header">
        <h1>Binary Search Tree Iterator (LC 173)</h1>
        <p className="bsti-subtitle">Controlled in-order traversal using stack</p>
      </div>

      <div className="bsti-controls">
        <div className="bsti-control-group">
          <label>BST Values (level-order, null for missing):</label>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="e.g., 7,3,15,null,null,9,20"
          />
          <button onClick={handleCustomSubmit} className="bsti-btn bsti-btn-primary">
            Set Tree
          </button>
        </div>

        <div className="bsti-control-group">
          <button onClick={handleLoadExample} className="bsti-btn bsti-btn-secondary">
            Load Example
          </button>
          <button
            onClick={startAnimation}
            disabled={animationState === 'running' || !tree}
            className="bsti-btn bsti-btn-accent"
          >
            {animationState === 'running' ? 'Iterating...' : 'Iterate'}
          </button>
        </div>
      </div>

      <div className="bsti-content">
        <div className="bsti-section">
          <h2>Tree Visualization</h2>
          <div className="bsti-tree-container">
            {tree ? (
              <svg className="bsti-tree-svg" viewBox="0 0 600 400">
                {renderTreeNode(tree, 300, 30, 100)}
              </svg>
            ) : (
              <p className="bsti-empty">No tree loaded</p>
            )}
          </div>
        </div>

        <div className="bsti-section">
          <h2>Algorithm State</h2>
          <div className="bsti-state-info">
            <div className="bsti-info-item">
              <span className="bsti-label">Tree Status:</span>
              <span className="bsti-value">{tree ? 'Ready' : 'Empty'}</span>
            </div>
            <div className="bsti-info-item">
              <span className="bsti-label">Current Step:</span>
              <span className="bsti-value">{currentStep >= 0 ? currentStep + 1 : 'Not started'}</span>
            </div>
            <div className="bsti-info-item">
              <span className="bsti-label">Stack Size:</span>
              <span className="bsti-value">{stack.length}</span>
            </div>
            <div className="bsti-info-item">
              <span className="bsti-label">Sequence Length:</span>
              <span className="bsti-value">{sequence.length}</span>
            </div>

            <div className="bsti-next-status">
              <span className="bsti-label">hasNext():</span>
              <span className={`bsti-value ${stack.length > 0 ? 'bsti-true' : 'bsti-false'}`}>
                {stack.length > 0 ? 'true' : 'false'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bsti-section bsti-stack-section">
        <h2>Stack State</h2>
        <div className="bsti-stack-panel">
          {stack.length === 0 ? (
            <p className="bsti-empty">Stack is empty</p>
          ) : (
            <div className="bsti-stack-visual">
              {stack.map((node, idx) => (
                <div
                  key={idx}
                  className={`bsti-stack-item ${idx === stack.length - 1 ? 'bsti-stack-top' : ''}`}
                >
                  <span className="bsti-stack-index">{idx}</span>
                  <span className="bsti-stack-value">{node.val}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bsti-stack-info">
          <p className="bsti-info-text">
            Stack stores nodes to visit in in-order. Top of stack is next node to process.
          </p>
        </div>
      </div>

      <div className="bsti-section bsti-sequence-section">
        <h2>In-Order Sequence</h2>
        <div className="bsti-sequence-display">
          {sequence.length === 0 ? (
            <p className="bsti-empty">No sequence yet</p>
          ) : (
            <div className="bsti-sequence-items">
              {sequence.map((val, idx) => (
                <div key={idx} className="bsti-seq-item">
                  <span className="bsti-seq-index">{idx + 1}</span>
                  <span className="bsti-seq-value">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bsti-sequence-result">
          Result: [{sequence.join(', ')}]
        </div>
      </div>

      <div className="bsti-explanation">
        <h3>How It Works</h3>
        <ul>
          <li><strong>Initialize:</strong> Push all left-spine nodes onto stack</li>
          <li><strong>next():</strong> Pop top node (next smallest), process it, push left spine of right child</li>
          <li><strong>hasNext():</strong> Check if stack is not empty</li>
          <li>This gives in-order traversal with O(h) space (h = tree height) and O(1) amortized next() time</li>
          <li>Space efficient: doesn't store entire tree structure, only active path</li>
        </ul>

        <h3>Example Trace</h3>
        <div className="bsti-trace">
          <p>Tree: [7, 3, 15, null, null, 9, 20]</p>
          <p>Init: Push left spine of 7 → [7, 3]</p>
          <p>next(): Pop 3 → return 3, no right child</p>
          <p>next(): Pop 7 → return 7, push left spine of 15 → [15, 9]</p>
          <p>next(): Pop 9 → return 9, no right child</p>
          <p>next(): Pop 15 → return 15, push left spine of 20 → [20]</p>
          <p>next(): Pop 20 → return 20, no right child</p>
          <p>hasNext(): false, traversal complete</p>
        </div>
      </div>
    </div>
  );
};

export default BSTIterator;
