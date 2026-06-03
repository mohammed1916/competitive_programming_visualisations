import React, { useState, useCallback } from 'react';
import './MaxAreaOfIsland.css';

const MaxAreaOfIsland = () => {
  const examples = [
    [[1, 1, 0, 0, 0], [1, 1, 0, 0, 0], [0, 0, 1, 0, 0], [0, 0, 0, 1, 1]],
    [[1, 1, 1], [0, 1, 0], [1, 1, 1]],
    [[0, 0, 0], [0, 1, 0], [0, 0, 0]],
  ];

  const [currentExample, setCurrentExample] = useState(0);
  const [grid, setGrid] = useState(examples[0]);
  const [visited, setVisited] = useState(
    Array(examples[0].length).fill(null).map(() => Array(examples[0][0].length).fill(false))
  );
  const [cellColors, setCellColors] = useState(
    Array(examples[0].length).fill(null).map(() => Array(examples[0][0].length).fill(''))
  );
  const [currentIslandArea, setCurrentIslandArea] = useState(0);
  const [maxIslandArea, setMaxIslandArea] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  const dfs = useCallback(
    async (r, c, newVisited, newColors, islandArea, speeds) => {
      if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return islandArea;
      if (newVisited[r][c] || grid[r][c] === 0) return islandArea;

      newVisited[r][c] = true;
      newColors[r][c] = 'exploring';
      islandArea += 1;

      speeds.push({ visited: JSON.parse(JSON.stringify(newVisited)), colors: JSON.parse(JSON.stringify(newColors)), area: islandArea });

      // DFS in 4 directions
      islandArea = await dfs(r + 1, c, newVisited, newColors, islandArea, speeds);
      islandArea = await dfs(r - 1, c, newVisited, newColors, islandArea, speeds);
      islandArea = await dfs(r, c + 1, newVisited, newColors, islandArea, speeds);
      islandArea = await dfs(r, c - 1, newVisited, newColors, islandArea, speeds);

      return islandArea;
    },
    [grid]
  );

  const solve = useCallback(async () => {
    setIsRunning(true);
    const newVisited = Array(grid.length).fill(null).map(() => Array(grid[0].length).fill(false));
    const newColors = Array(grid.length).fill(null).map(() => Array(grid[0].length).fill(''));
    let max = 0;
    const allSteps = [];

    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[0].length; j++) {
        if (grid[i][j] === 1 && !newVisited[i][j]) {
          const speeds = [];
          const area = await dfs(i, j, newVisited, newColors, 0, speeds);

          speeds.forEach(step => {
            allSteps.push({
              visited: step.visited,
              colors: step.colors,
              currentArea: step.area,
              maxArea: Math.max(max, step.area),
            });
          });

          // Mark island with color
          for (let x = 0; x < grid.length; x++) {
            for (let y = 0; y < grid[0].length; y++) {
              if (newVisited[x][y] && grid[x][y] === 1 && newColors[x][y] !== 'exploring') {
                newColors[x][y] = 'completed';
              }
            }
          }

          max = Math.max(max, area);
        }
      }
    }

    setSteps(allSteps);
    setMaxIslandArea(max);
    setCurrentStep(0);
    setIsRunning(false);
  }, [grid, dfs]);

  const handleExampleChange = (idx) => {
    setCurrentExample(idx);
    setGrid(examples[idx]);
    setVisited(Array(examples[idx].length).fill(null).map(() => Array(examples[idx][0].length).fill(false)));
    setCellColors(Array(examples[idx].length).fill(null).map(() => Array(examples[idx][0].length).fill('')));
    setCurrentIslandArea(0);
    setMaxIslandArea(0);
    setSteps([]);
    setCurrentStep(0);
  };

  const playSteps = () => {
    if (currentStep < steps.length) {
      const step = steps[currentStep];
      setVisited(step.visited);
      setCellColors(step.colors);
      setCurrentIslandArea(step.currentArea);
      setMaxIslandArea(step.maxArea);
      setCurrentStep(currentStep + 1);
    }
  };

  const resetVisualization = () => {
    setVisited(Array(grid.length).fill(null).map(() => Array(grid[0].length).fill(false)));
    setCellColors(Array(grid.length).fill(null).map(() => Array(grid[0].length).fill('')));
    setCurrentIslandArea(0);
    setMaxIslandArea(0);
    setCurrentStep(0);
  };

  return (
    <div className="mai-container">
      <div className="mai-header">
        <h1>LeetCode 695: Max Area of Island</h1>
        <p className="mai-difficulty">Medium</p>
      </div>

      <div className="mai-description">
        <p>Find the maximum area of an island where an island is a group of connected land cells (1s) surrounded by water (0s).</p>
      </div>

      <div className="mai-controls">
        <button className="mai-button mai-button-primary" onClick={solve} disabled={isRunning}>
          {isRunning ? 'Solving...' : 'Solve'}
        </button>
        <button className="mai-button mai-button-secondary" onClick={resetVisualization}>
          Reset
        </button>
        <button className="mai-button mai-button-secondary" onClick={playSteps} disabled={currentStep >= steps.length}>
          Next Step
        </button>
      </div>

      <div className="mai-examples">
        <p className="mai-label">Examples:</p>
        {examples.map((ex, idx) => (
          <button
            key={idx}
            className={`mai-example-btn ${currentExample === idx ? 'mai-active' : ''}`}
            onClick={() => handleExampleChange(idx)}
          >
            Example {idx + 1}
          </button>
        ))}
      </div>

      <div className="mai-grid-container">
        <div className="mai-grid">
          {grid.map((row, i) => (
            <div key={i} className="mai-row">
              {row.map((cell, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`mai-cell mai-cell-${cell} ${cellColors[i] && cellColors[i][j] ? `mai-${cellColors[i][j]}` : ''}`}
                >
                  {cell}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mai-stats">
        <div className="mai-stat">
          <span className="mai-label">Current Island Area:</span>
          <span className="mai-value mai-current-area">{currentIslandArea}</span>
        </div>
        <div className="mai-stat">
          <span className="mai-label">Max Island Area:</span>
          <span className="mai-value mai-max-area">{maxIslandArea}</span>
        </div>
        <div className="mai-stat">
          <span className="mai-label">Progress:</span>
          <span className="mai-value">{currentStep} / {steps.length}</span>
        </div>
      </div>
    </div>
  );
};

export default MaxAreaOfIsland;
