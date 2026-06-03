import React, { useState, useCallback } from 'react';
import './AllPathsSourceTarget.css';

const AllPathsSourceTarget = () => {
  const examples = [
    [[1, 2], [3], [3], []],
    [[4, 3, 1], [3, 2, 4], [3], [4], []],
    [[1], [2, 3], [], []],
  ];

  const [currentExample, setCurrentExample] = useState(0);
  const [graph, setGraph] = useState(examples[0]);
  const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedEdges, setHighlightedEdges] = useState([]);
  const [highlightedNode, setHighlightedNode] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const dfs = useCallback(
    async (node, target, path, allPaths, allSteps) => {
      path.push(node);
      allSteps.push({
        currentPath: [...path],
        completedPaths: [...allPaths],
        highlightedNode: node,
        highlightedEdges: [],
      });

      if (node === target) {
        allPaths.push([...path]);
        allSteps.push({
          currentPath: [],
          completedPaths: [...allPaths],
          highlightedNode: null,
          highlightedEdges: [],
          completedPath: [...path],
        });
      } else {
        for (const neighbor of graph[node]) {
          allSteps.push({
            currentPath: [...path],
            completedPaths: [...allPaths],
            highlightedNode: node,
            highlightedEdges: [[node, neighbor]],
          });

          await dfs(neighbor, target, path, allPaths, allSteps);
        }
      }

      path.pop();
      allSteps.push({
        currentPath: [...path],
        completedPaths: [...allPaths],
        highlightedNode: node,
        highlightedEdges: [],
        backtracking: true,
      });
    },
    [graph]
  );

  const solve = useCallback(async () => {
    setIsRunning(true);
    const n = graph.length;
    const target = n - 1;
    const allPaths = [];
    const allSteps = [];

    await dfs(0, target, [], allPaths, allSteps);

    setSteps(allSteps);
    setPaths(allPaths);
    setCurrentStep(0);
    setIsRunning(false);
  }, [graph, dfs]);

  const handleExampleChange = (idx) => {
    setCurrentExample(idx);
    setGraph(examples[idx]);
    setPaths([]);
    setCurrentPath([]);
    setSteps([]);
    setCurrentStep(0);
    setHighlightedEdges([]);
    setHighlightedNode(null);
  };

  const playSteps = () => {
    if (currentStep < steps.length) {
      const step = steps[currentStep];
      setCurrentPath(step.currentPath);
      setPaths(step.completedPaths);
      setHighlightedNode(step.highlightedNode);
      setHighlightedEdges(step.highlightedEdges);
      setCurrentStep(currentStep + 1);
    }
  };

  const resetVisualization = () => {
    setPaths([]);
    setCurrentPath([]);
    setSteps([]);
    setCurrentStep(0);
    setHighlightedEdges([]);
    setHighlightedNode(null);
  };

  const getNodePosition = (idx) => {
    const total = graph.length;
    const x = 100 + (idx % 2) * 250;
    const y = 100 + Math.floor(idx / 2) * 120;
    return { x, y };
  };

  const isEdgeHighlighted = (from, to) => {
    return highlightedEdges.some(([f, t]) => f === from && t === to);
  };

  return (
    <div className="apst-container">
      <div className="apst-header">
        <h1>LeetCode 797: All Paths From Source to Target</h1>
        <p className="apst-difficulty">Medium</p>
      </div>

      <div className="apst-description">
        <p>Find all paths from node 0 to node n-1 in a directed acyclic graph (DAG).</p>
      </div>

      <div className="apst-controls">
        <button className="apst-button apst-button-primary" onClick={solve} disabled={isRunning}>
          {isRunning ? 'Solving...' : 'Solve'}
        </button>
        <button className="apst-button apst-button-secondary" onClick={resetVisualization}>
          Reset
        </button>
        <button className="apst-button apst-button-secondary" onClick={playSteps} disabled={currentStep >= steps.length}>
          Next Step
        </button>
      </div>

      <div className="apst-examples">
        <p className="apst-label">Examples:</p>
        {examples.map((ex, idx) => (
          <button
            key={idx}
            className={`apst-example-btn ${currentExample === idx ? 'apst-active' : ''}`}
            onClick={() => handleExampleChange(idx)}
          >
            Example {idx + 1}
          </button>
        ))}
      </div>

      <div className="apst-content">
        <div className="apst-section">
          <h3>Graph Visualization</h3>
          <div className="apst-graph-container">
            <svg width="100%" height="500" viewBox="0 0 500 500" className="apst-svg">
              {/* Draw edges */}
              {graph.map((neighbors, from) => {
                const fromPos = getNodePosition(from);
                return neighbors.map((to) => {
                  const toPos = getNodePosition(to);
                  const isHighlight = isEdgeHighlighted(from, to);
                  return (
                    <g key={`edge-${from}-${to}`}>
                      {/* Edge line */}
                      <line
                        x1={fromPos.x}
                        y1={fromPos.y}
                        x2={toPos.x}
                        y2={toPos.y}
                        stroke={isHighlight ? '#14b8a6' : '#45475a'}
                        strokeWidth={isHighlight ? '3' : '2'}
                        markerEnd={`url(#arrowhead-${isHighlight ? 'highlight' : 'default'})`}
                        className={isHighlight ? 'apst-edge-highlight' : ''}
                      />
                    </g>
                  );
                });
              })}

              {/* Arrow markers */}
              <defs>
                <marker
                  id="arrowhead-default"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#45475a" />
                </marker>
                <marker
                  id="arrowhead-highlight"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#14b8a6" />
                </marker>
              </defs>

              {/* Draw nodes */}
              {graph.map((_, idx) => {
                const pos = getNodePosition(idx);
                const isSource = idx === 0;
                const isTarget = idx === graph.length - 1;
                const isCurrentNode = highlightedNode === idx;
                const isInCurrentPath = currentPath.includes(idx);

                return (
                  <g key={`node-${idx}`}>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={25}
                      fill={
                        isSource
                          ? '#14b8a6'
                          : isTarget
                            ? '#f38ba8'
                            : isCurrentNode
                              ? '#f9e2af'
                              : isInCurrentPath
                                ? '#89b4fa'
                                : '#313244'
                      }
                      stroke={isCurrentNode ? '#f38ba8' : '#14b8a6'}
                      strokeWidth={isCurrentNode ? '3' : '2'}
                      className={isCurrentNode ? 'apst-node-highlight' : ''}
                    />
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dy="0.3em"
                      fill="#1e1e2e"
                      fontWeight="bold"
                      fontSize="16"
                    >
                      {idx}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="apst-section">
          <h3>Current Path</h3>
          <div className="apst-path-display">
            {currentPath.length > 0 ? (
              <div className="apst-path">
                {currentPath.map((node, idx) => (
                  <React.Fragment key={idx}>
                    <span className="apst-path-node">{node}</span>
                    {idx < currentPath.length - 1 && <span className="apst-path-arrow">→</span>}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <p className="apst-empty">No path in progress</p>
            )}
          </div>
        </div>
      </div>

      <div className="apst-stats">
        <div className="apst-stat">
          <span className="apst-label">Total Paths Found:</span>
          <span className="apst-value apst-path-count">{paths.length}</span>
        </div>
        <div className="apst-stat">
          <span className="apst-label">Step:</span>
          <span className="apst-value">{currentStep} / {steps.length}</span>
        </div>
      </div>

      {paths.length > 0 && (
        <div className="apst-results">
          <h3>Found Paths</h3>
          <div className="apst-paths-grid">
            {paths.map((path, idx) => (
              <div key={idx} className="apst-result-path">
                <span className="apst-result-number">{idx + 1}.</span>
                <span className="apst-result-path-text">
                  {path.map((node, pidx) => (
                    <React.Fragment key={pidx}>
                      <span className="apst-result-node">{node}</span>
                      {pidx < path.length - 1 && <span className="apst-result-arrow">→</span>}
                    </React.Fragment>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllPathsSourceTarget;
