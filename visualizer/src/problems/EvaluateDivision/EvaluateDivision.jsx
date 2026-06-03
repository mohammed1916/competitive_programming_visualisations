import React, { useState, useEffect } from 'react';
import './EvaluateDivision.css';

const EvaluateDivision = () => {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queryIndex, setQueryIndex] = useState(0);
  const [graph, setGraph] = useState({});
  const [visited, setVisited] = useState(new Set());
  const [path, setPath] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(1);
  const [results, setResults] = useState([]);
  const [highlightedEdge, setHighlightedEdge] = useState(null);

  const equations = [['a', 'b'], ['b', 'c']];
  const values = [2, 3];
  const queries = [['a', 'c'], ['b', 'a'], ['a', 'e'], ['a', 'b']];

  const buildGraph = () => {
    const g = {};
    equations.forEach((eq, idx) => {
      const [u, v] = eq;
      const val = values[idx];

      if (!g[u]) g[u] = [];
      if (!g[v]) g[v] = [];

      g[u].push([v, val]);
      g[v].push([u, 1 / val]);
    });
    return g;
  };

  const dfs = (current, target, g, visited, product) => {
    if (current === target) return product;
    visited.add(current);

    if (g[current]) {
      for (const [next, weight] of g[current]) {
        if (!visited.has(next)) {
          const result = dfs(next, target, g, visited, product * weight);
          if (result !== -1) return result;
        }
      }
    }

    return -1;
  };

  const generateQuerySteps = () => {
    const steps = [];
    const g = buildGraph();
    let allResults = [];

    steps.push({
      type: 'init',
      graph: g,
      query: null,
      queryIndex: 0,
      visited: new Set(),
      path: [],
      product: 1,
      results: [],
      highlightedEdge: null,
    });

    queries.forEach((query, qIdx) => {
      const [x, y] = query;
      const visited = new Set();
      let result = dfs(x, y, g, visited, 1);

      steps.push({
        type: 'query_start',
        graph: g,
        query: query,
        queryIndex: qIdx,
        visited: new Set(),
        path: [],
        product: 1,
        results: [...allResults],
        highlightedEdge: null,
      });

      // Simulate DFS with visualization
      const dfsPath = [];
      const dfsVisit = (current, target, g, visited, product) => {
        visited.add(current);
        dfsPath.push(current);

        steps.push({
          type: 'dfs_visit',
          graph: g,
          query: query,
          queryIndex: qIdx,
          visited: new Set(visited),
          path: [...dfsPath],
          product: product,
          results: [...allResults],
          highlightedEdge: null,
        });

        if (current === target) {
          return product;
        }

        if (g[current]) {
          for (const [next, weight] of g[current]) {
            if (!visited.has(next)) {
              steps.push({
                type: 'edge_check',
                graph: g,
                query: query,
                queryIndex: qIdx,
                visited: new Set(visited),
                path: [...dfsPath],
                product: product,
                results: [...allResults],
                highlightedEdge: [current, next],
              });

              const newProduct = product * weight;
              const res = dfsVisit(next, target, g, visited, newProduct);

              if (res !== -1) {
                steps.push({
                  type: 'found',
                  graph: g,
                  query: query,
                  queryIndex: qIdx,
                  visited: new Set(visited),
                  path: [...dfsPath],
                  product: newProduct,
                  results: [...allResults],
                  highlightedEdge: [current, next],
                });
                return res;
              }
            }
          }
        }
        return -1;
      };

      const res = dfsVisit(x, y, g, new Set(), 1);
      allResults.push(res === -1 ? -1 : Math.round(res * 100000) / 100000);

      steps.push({
        type: 'query_complete',
        graph: g,
        query: query,
        queryIndex: qIdx,
        visited: new Set(),
        path: [],
        product: 1,
        results: [...allResults],
        highlightedEdge: null,
      });
    });

    steps.push({
      type: 'complete',
      graph: g,
      query: null,
      queryIndex: queries.length,
      visited: new Set(),
      path: [],
      product: 1,
      results: allResults,
      highlightedEdge: null,
    });

    return steps;
  };

  const allSteps = generateQuerySteps();

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
      setGraph(currentStep.graph);
      setQueryIndex(currentStep.queryIndex);
      setVisited(currentStep.visited);
      setPath(currentStep.path);
      setCurrentProduct(currentStep.product);
      setResults(currentStep.results);
      setHighlightedEdge(currentStep.highlightedEdge);
    }
  }, [step, allSteps]);

  const getNodePosition = (node) => {
    const positions = {
      a: { x: 80, y: 150 },
      b: { x: 200, y: 80 },
      c: { x: 200, y: 220 },
      e: { x: 320, y: 150 },
    };
    return positions[node] || { x: 150, y: 150 };
  };

  const renderGraph = () => {
    const allNodes = new Set();
    Object.keys(graph).forEach((node) => {
      allNodes.add(node);
      graph[node].forEach(([neighbor]) => allNodes.add(neighbor));
    });

    return (
      <svg className="ed-graph" viewBox="0 0 400 320">
        {/* Edges */}
        {Object.entries(graph).map(([from, edges]) =>
          edges.map((edge, idx) => {
            const [to, weight] = edge;
            const posFrom = getNodePosition(from);
            const posTo = getNodePosition(to);
            const isHighlighted =
              highlightedEdge &&
              ((highlightedEdge[0] === from && highlightedEdge[1] === to) ||
                (highlightedEdge[0] === to && highlightedEdge[1] === from));

            return (
              <g key={`edge-${from}-${to}-${idx}`}>
                <line
                  x1={posFrom.x}
                  y1={posFrom.y}
                  x2={posTo.x}
                  y2={posTo.y}
                  className={`ed-edge ${
                    isHighlighted ? 'ed-edge--highlight' : ''
                  }`}
                />
                <text
                  x={(posFrom.x + posTo.x) / 2}
                  y={(posFrom.y + posTo.y) / 2 - 12}
                  className="ed-edge-label"
                >
                  {weight.toFixed(1)}
                </text>
              </g>
            );
          })
        )}

        {/* Nodes */}
        {Array.from(allNodes).map((node) => {
          const pos = getNodePosition(node);
          const isVisited = visited.has(node);
          const isInPath = path.includes(node);

          return (
            <g key={`node-${node}`}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={24}
                className={`ed-node ${isInPath ? 'ed-node--path' : ''} ${
                  isVisited ? 'ed-node--visited' : ''
                }`}
              />
              <text x={pos.x} y={pos.y + 6} className="ed-node-label">
                {node}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const currentStepData = allSteps[step];

  return (
    <div className="ed-container">
      <div className="ed-header">
        <h1>Evaluate Division (LC 399)</h1>
        <p className="ed-subtitle">Weighted Graph DFS Path Finding</p>
      </div>

      <div className="ed-content">
        <div className="ed-visualization">{renderGraph()}</div>

        <div className="ed-info">
          <div className="ed-setup">
            <h3>Equations & Values</h3>
            <div className="ed-equations">
              {equations.map((eq, idx) => (
                <div key={idx} className="ed-equation-item">
                  <span className="ed-equation">
                    {eq[0]}/{eq[1]} = {values[idx]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="ed-queries">
            <h3>Queries</h3>
            <div className="ed-queries-list">
              {queries.map((query, idx) => {
                const isActive = idx === queryIndex && step > 0;
                const result = idx < results.length ? results[idx] : null;

                return (
                  <div
                    key={idx}
                    className={`ed-query-item ${
                      isActive ? 'ed-query-item--active' : ''
                    } ${result !== null ? 'ed-query-item--done' : ''}`}
                  >
                    <span className="ed-query-text">
                      {query[0]}/{query[1]}
                    </span>
                    {result !== null && (
                      <span className="ed-query-result">
                        {result === -1 ? '❌ -1' : `✓ ${result}`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {path.length > 0 && (
            <div className="ed-path">
              <h3>Current Path</h3>
              <div className="ed-path-items">
                {path.map((node, idx) => (
                  <React.Fragment key={idx}>
                    <span className="ed-path-node">{node}</span>
                    {idx < path.length - 1 && (
                      <span className="ed-path-arrow">→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <p className="ed-product">
                Product: <span>{currentProduct.toFixed(5)}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="ed-step-info">
        <p className="ed-step-description">
          {currentStepData?.type === 'init' &&
            'Building weighted graph from equations'}
          {currentStepData?.type === 'query_start' &&
            `Starting query: ${currentStepData.query?.[0]}/${currentStepData.query?.[1]}`}
          {currentStepData?.type === 'dfs_visit' &&
            `Visiting node: ${path[path.length - 1]}`}
          {currentStepData?.type === 'edge_check' &&
            `Checking edge: ${highlightedEdge?.[0]} → ${highlightedEdge?.[1]}`}
          {currentStepData?.type === 'found' &&
            `Found path! Result: ${Math.round(currentProduct * 100000) / 100000}`}
          {currentStepData?.type === 'query_complete' && 'Query completed'}
          {currentStepData?.type === 'complete' && 'All queries processed!'}
        </p>
      </div>

      <div className="ed-controls">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          className="ed-btn ed-btn--prev"
        >
          Previous
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="ed-btn ed-btn--play"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <button
          onClick={() => setStep(Math.min(allSteps.length - 1, step + 1))}
          className="ed-btn ed-btn--next"
        >
          Next
        </button>

        <button onClick={() => setStep(0)} className="ed-btn ed-btn--reset">
          Reset
        </button>

        <span className="ed-step-indicator">
          Step {step + 1} / {allSteps.length}
        </span>
      </div>
    </div>
  );
};

export default EvaluateDivision;
