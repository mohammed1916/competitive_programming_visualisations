import React, { useState, useCallback } from 'react';
import './NumberOfProvinces.css';

const NumberOfProvinces = () => {
  const examples = [
    [[1, 1, 0], [1, 1, 0], [0, 0, 1]],
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
  ];

  const [currentExample, setCurrentExample] = useState(0);
  const [isConnected, setIsConnected] = useState(examples[0]);
  const [parent, setParent] = useState(Array(isConnected.length).fill(null).map((_, i) => i));
  const [rank, setRank] = useState(Array(isConnected.length).fill(1));
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [provinceCount, setProvinceCount] = useState(0);
  const [highlightedCells, setHighlightedCells] = useState([]);
  const [unionOperations, setUnionOperations] = useState([]);

  const find = (x, parents) => {
    if (parents[x] !== x) {
      parents[x] = find(parents[x], parents);
    }
    return parents[x];
  };

  const union = useCallback((x, y, newParent, newRank, ops) => {
    const rootX = find(x, newParent);
    const rootY = find(y, newParent);

    if (rootX === rootY) return;

    ops.push(`Union(${x}, ${y}): ${rootX} <- ${rootY}`);

    if (newRank[rootX] < newRank[rootY]) {
      newParent[rootX] = rootY;
    } else if (newRank[rootX] > newRank[rootY]) {
      newParent[rootY] = rootX;
    } else {
      newParent[rootY] = rootX;
      newRank[rootX]++;
    }
  }, []);

  const solve = useCallback(() => {
    const n = isConnected.length;
    const newParent = Array(n).fill(null).map((_, i) => i);
    const newRank = Array(n).fill(1);
    const ops = [];
    const allSteps = [];

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (isConnected[i][j] === 1) {
          const prevParent = JSON.parse(JSON.stringify(newParent));
          union(i, j, newParent, newRank, ops);

          allSteps.push({
            parent: JSON.parse(JSON.stringify(newParent)),
            highlighted: [i, j],
            operation: ops[ops.length - 1],
          });
        }
      }
    }

    // Count provinces
    const roots = new Set();
    for (let i = 0; i < n; i++) {
      roots.add(find(i, newParent));
    }

    setSteps(allSteps);
    setParent(newParent);
    setRank(newRank);
    setUnionOperations(ops);
    setProvinceCount(roots.size);
    setCurrentStep(0);
  }, [isConnected, union]);

  const handleExampleChange = (idx) => {
    setCurrentExample(idx);
    const newIsConnected = examples[idx];
    setIsConnected(newIsConnected);
    setParent(Array(newIsConnected.length).fill(null).map((_, i) => i));
    setRank(Array(newIsConnected.length).fill(1));
    setSteps([]);
    setCurrentStep(0);
    setProvinceCount(0);
    setHighlightedCells([]);
    setUnionOperations([]);
  };

  const playSteps = () => {
    if (currentStep < steps.length) {
      const step = steps[currentStep];
      setParent(step.parent);
      setHighlightedCells(step.highlighted);
      setCurrentStep(currentStep + 1);
    }
  };

  const resetVisualization = () => {
    setParent(Array(isConnected.length).fill(null).map((_, i) => i));
    setRank(Array(isConnected.length).fill(1));
    setSteps([]);
    setCurrentStep(0);
    setProvinceCount(0);
    setHighlightedCells([]);
    setUnionOperations([]);
  };

  const getNodeColor = (i) => {
    const root = find(i, parent);
    const colors = ['#f38ba8', '#a6e3a1', '#f9e2af', '#89b4fa', '#cba6f7', '#94e2d5', '#eba0ac'];
    return colors[root % colors.length];
  };

  return (
    <div className="nop-container">
      <div className="nop-header">
        <h1>LeetCode 547: Number of Provinces</h1>
        <p className="nop-difficulty">Medium</p>
      </div>

      <div className="nop-description">
        <p>Find the number of provinces. A province is a group of directly or indirectly connected cities.</p>
      </div>

      <div className="nop-controls">
        <button className="nop-button nop-button-primary" onClick={solve}>
          Solve
        </button>
        <button className="nop-button nop-button-secondary" onClick={resetVisualization}>
          Reset
        </button>
        <button className="nop-button nop-button-secondary" onClick={playSteps} disabled={currentStep >= steps.length}>
          Next Step
        </button>
      </div>

      <div className="nop-examples">
        <p className="nop-label">Examples:</p>
        {examples.map((ex, idx) => (
          <button
            key={idx}
            className={`nop-example-btn ${currentExample === idx ? 'nop-active' : ''}`}
            onClick={() => handleExampleChange(idx)}
          >
            Example {idx + 1}
          </button>
        ))}
      </div>

      <div className="nop-content">
        <div className="nop-section">
          <h3>Adjacency Matrix</h3>
          <div className="nop-matrix">
            {isConnected.map((row, i) => (
              <div key={i} className="nop-matrix-row">
                {row.map((cell, j) => (
                  <div
                    key={`${i}-${j}`}
                    className={`nop-matrix-cell ${cell === 1 ? 'nop-connected' : 'nop-disconnected'} ${
                      highlightedCells.includes(i) || highlightedCells.includes(j) ? 'nop-highlight' : ''
                    }`}
                  >
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="nop-section">
          <h3>Union-Find State</h3>
          <div className="nop-uf-state">
            <div className="nop-parent-array">
              <div className="nop-array-label">Parent Array:</div>
              <div className="nop-array-values">
                {parent.map((p, i) => (
                  <div
                    key={i}
                    className="nop-uf-value"
                    style={{
                      backgroundColor: highlightedCells.includes(i) ? '#f38ba8' : getNodeColor(i),
                      color: '#1e1e2e',
                    }}
                  >
                    {i}: {p}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="nop-section">
          <h3>Graph Visualization</h3>
          <div className="nop-graph">
            <svg width="300" height="300" className="nop-svg">
              {isConnected.map((row, i) => {
                const x = 150 + 80 * Math.cos((2 * Math.PI * i) / isConnected.length);
                const y = 150 + 80 * Math.sin((2 * Math.PI * i) / isConnected.length);

                return (
                  <g key={i}>
                    {row.map((cell, j) => {
                      if (cell === 1 && i < j) {
                        const x2 = 150 + 80 * Math.cos((2 * Math.PI * j) / isConnected.length);
                        const y2 = 150 + 80 * Math.sin((2 * Math.PI * j) / isConnected.length);
                        return (
                          <line
                            key={`edge-${i}-${j}`}
                            x1={x}
                            y1={y}
                            x2={x2}
                            y2={y2}
                            stroke={highlightedCells.includes(i) || highlightedCells.includes(j) ? '#f38ba8' : '#8b5cf6'}
                            strokeWidth="2"
                          />
                        );
                      }
                      return null;
                    })}
                  </g>
                );
              })}

              {parent.map((_, i) => {
                const x = 150 + 80 * Math.cos((2 * Math.PI * i) / isConnected.length);
                const y = 150 + 80 * Math.sin((2 * Math.PI * i) / isConnected.length);
                return (
                  <circle
                    key={`node-${i}`}
                    cx={x}
                    cy={y}
                    r="20"
                    fill={getNodeColor(i)}
                    stroke={highlightedCells.includes(i) ? '#f38ba8' : '#8b5cf6'}
                    strokeWidth="2"
                  />
                );
              })}

              {parent.map((_, i) => {
                const x = 150 + 80 * Math.cos((2 * Math.PI * i) / isConnected.length);
                const y = 150 + 80 * Math.sin((2 * Math.PI * i) / isConnected.length);
                return (
                  <text
                    key={`label-${i}`}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dy="0.3em"
                    fill="#1e1e2e"
                    fontWeight="bold"
                  >
                    {i}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      <div className="nop-stats">
        <div className="nop-stat">
          <span className="nop-label">Number of Provinces:</span>
          <span className="nop-value nop-province-count">{provinceCount}</span>
        </div>
        <div className="nop-stat">
          <span className="nop-label">Step:</span>
          <span className="nop-value">{currentStep} / {steps.length}</span>
        </div>
      </div>

      {unionOperations.length > 0 && (
        <div className="nop-operations">
          <h3>Union Operations</h3>
          <div className="nop-operations-list">
            {unionOperations.map((op, idx) => (
              <div key={idx} className={`nop-op-item ${idx < currentStep ? 'nop-completed' : ''}`}>
                {op}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NumberOfProvinces;
