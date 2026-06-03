import React, { useState, useEffect } from 'react';
import './NetworkDelayTime.css';

const NetworkDelayTime = () => {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [distances, setDistances] = useState({});
  const [heap, setHeap] = useState([]);
  const [visited, setVisited] = useState(new Set());
  const [currentNode, setCurrentNode] = useState(null);
  const [relaxingEdge, setRelaxingEdge] = useState(null);

  const n = 4;
  const k = 2;
  const edges = [[2, 1, 1], [2, 3, 1], [3, 4, 1]];

  // Build adjacency list
  const graph = {};
  for (let i = 1; i <= n; i++) {
    graph[i] = [];
  }
  edges.forEach(([u, v, w]) => {
    graph[u].push([v, w]);
  });

  // Dijkstra visualization steps
  const dijkstraSteps = () => {
    const steps = [];
    const dist = {};
    const heap = [];
    const visited = new Set();

    for (let i = 1; i <= n; i++) {
      dist[i] = i === k ? 0 : Infinity;
    }

    heap.push([0, k]);
    steps.push({
      type: 'init',
      distances: { ...dist },
      heap: [...heap],
      visited: new Set(visited),
      current: null,
      relaxingEdge: null,
    });

    while (heap.length > 0) {
      heap.sort((a, b) => a[0] - b[0]);
      const [d, u] = heap.shift();

      if (visited.has(u)) continue;
      visited.add(u);

      steps.push({
        type: 'visit',
        distances: { ...dist },
        heap: [...heap],
        visited: new Set(visited),
        current: u,
        relaxingEdge: null,
      });

      for (const [v, w] of graph[u]) {
        if (!visited.has(v) && dist[u] + w < dist[v]) {
          dist[v] = dist[u] + w;
          heap.push([dist[v], v]);

          steps.push({
            type: 'relax',
            distances: { ...dist },
            heap: [...heap],
            visited: new Set(visited),
            current: u,
            relaxingEdge: [u, v],
          });
        }
      }
    }

    const maxDist = Math.max(...Object.values(dist));
    steps.push({
      type: 'complete',
      distances: { ...dist },
      heap: [],
      visited: new Set(visited),
      current: null,
      relaxingEdge: null,
      result: maxDist === Infinity ? -1 : maxDist,
    });

    return steps;
  };

  const allSteps = dijkstraSteps();

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setStep((prev) => {
        if (prev < allSteps.length - 1) {
          return prev + 1;
        } else {
          setIsPlaying(false);
          return prev;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, allSteps.length]);

  useEffect(() => {
    const currentStep = allSteps[step];
    if (currentStep) {
      setDistances(currentStep.distances);
      setHeap(currentStep.heap);
      setVisited(currentStep.visited);
      setCurrentNode(currentStep.current);
      setRelaxingEdge(currentStep.relaxingEdge);
    }
  }, [step, allSteps]);

  const getNodePosition = (node) => {
    const positions = {
      1: { x: 100, y: 100 },
      2: { x: 200, y: 50 },
      3: { x: 200, y: 200 },
      4: { x: 300, y: 150 },
    };
    return positions[node];
  };

  const renderSVG = () => {
    return (
      <svg className="ndt-graph" viewBox="0 0 400 300">
        {/* Edges */}
        {edges.map((edge, idx) => {
          const [u, v, w] = edge;
          const pos1 = getNodePosition(u);
          const pos2 = getNodePosition(v);
          const isRelaxing =
            relaxingEdge &&
            ((relaxingEdge[0] === u && relaxingEdge[1] === v) ||
              (relaxingEdge[0] === v && relaxingEdge[1] === u));

          return (
            <g key={`edge-${idx}`}>
              <line
                x1={pos1.x}
                y1={pos1.y}
                x2={pos2.x}
                y2={pos2.y}
                className={`ndt-edge ${isRelaxing ? 'ndt-edge--relaxing' : ''}`}
              />
              <text
                x={(pos1.x + pos2.x) / 2}
                y={(pos1.y + pos2.y) / 2 - 8}
                className="ndt-edge-label"
              >
                {w}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {Array.from({ length: n }, (_, i) => i + 1).map((node) => {
          const pos = getNodePosition(node);
          const isVisited = visited.has(node);
          const isCurrent = currentNode === node;
          const dist = distances[node];

          return (
            <g key={`node-${node}`}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={24}
                className={`ndt-node ${
                  isCurrent ? 'ndt-node--current' : ''
                } ${isVisited ? 'ndt-node--visited' : ''}`}
              />
              <text x={pos.x} y={pos.y + 6} className="ndt-node-text">
                {node}
              </text>
              <text
                x={pos.x}
                y={pos.y + 40}
                className="ndt-distance-label"
              >
                d:{dist === Infinity ? '∞' : dist}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const currentStepData = allSteps[step];

  return (
    <div className="ndt-container">
      <div className="ndt-header">
        <h1>Network Delay Time (LC 743)</h1>
        <p className="ndt-subtitle">Dijkstra Shortest Path Algorithm</p>
      </div>

      <div className="ndt-content">
        <div className="ndt-visualization">
          {renderSVG()}
        </div>

        <div className="ndt-info">
          <div className="ndt-problem">
            <h3>Problem Setup</h3>
            <p>Edges: {JSON.stringify(edges)}</p>
            <p>Nodes (n): {n}</p>
            <p>Source (k): {k}</p>
          </div>

          <div className="ndt-heap">
            <h3>Min-Heap State</h3>
            <div className="ndt-heap-items">
              {heap.length === 0 ? (
                <p className="ndt-empty">Empty</p>
              ) : (
                heap.map((item, idx) => (
                  <div key={idx} className="ndt-heap-item">
                    [d:{item[0]}, node:{item[1]}]
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="ndt-distances">
            <h3>Current Distances</h3>
            <div className="ndt-distance-items">
              {Array.from({ length: n }, (_, i) => i + 1).map((node) => (
                <div
                  key={node}
                  className={`ndt-distance-item ${
                    visited.has(node) ? 'ndt-distance-item--visited' : ''
                  }`}
                >
                  <span>Node {node}:</span>
                  <span className="ndt-distance-value">
                    {distances[node] === Infinity ? '∞' : distances[node]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {currentStepData?.type === 'complete' && (
            <div className="ndt-result">
              <h3>Result</h3>
              <p className="ndt-result-value">{currentStepData.result}</p>
            </div>
          )}
        </div>
      </div>

      <div className="ndt-controls">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          className="ndt-btn ndt-btn--prev"
        >
          Previous
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="ndt-btn ndt-btn--play"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <button
          onClick={() => setStep(Math.min(allSteps.length - 1, step + 1))}
          className="ndt-btn ndt-btn--next"
        >
          Next
        </button>

        <button
          onClick={() => setStep(0)}
          className="ndt-btn ndt-btn--reset"
        >
          Reset
        </button>

        <span className="ndt-step-indicator">
          Step {step + 1} / {allSteps.length}
        </span>
      </div>
    </div>
  );
};

export default NetworkDelayTime;
