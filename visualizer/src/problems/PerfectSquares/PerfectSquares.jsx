import React, { useState, useEffect } from 'react';
import './PerfectSquares.css';

export default function PerfectSquares() {
  const [n, setN] = useState(13);
  const [customInput, setCustomInput] = useState('');
  const [currentPosition, setCurrentPosition] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [dpArray, setDpArray] = useState([]);
  const [triedSquares, setTriedSquares] = useState([]);
  const [parentPath, setParentPath] = useState([]);

  const computeDP = (num) => {
    const dp = new Array(num + 1).fill(Infinity);
    dp[0] = 0;
    const parent = new Array(num + 1).fill(-1);

    for (let i = 1; i <= num; i++) {
      for (let j = 1; j * j <= i; j++) {
        if (dp[i - j * j] + 1 < dp[i]) {
          dp[i] = dp[i - j * j] + 1;
          parent[i] = j;
        }
      }
    }

    // Reconstruct path
    const path = [];
    let curr = num;
    while (curr > 0) {
      const square = parent[curr];
      path.unshift(square * square);
      curr -= square * square;
    }

    return {
      dp: Array.from(dp),
      parent,
      path,
    };
  };

  const { dp, parent, path } = computeDP(n);

  useEffect(() => {
    setDpArray(dp);
    setCurrentPosition(0);
  }, [n, dp]);

  useEffect(() => {
    if (!isAnimating) return;

    const timer = setTimeout(() => {
      setCurrentPosition((prev) => {
        if (prev < n) return prev + 1;
        setIsAnimating(false);
        return prev;
      });
    }, speed);

    return () => clearTimeout(timer);
  }, [isAnimating, currentPosition, n, speed]);

  const getTriedSquaresAtPosition = (pos) => {
    const squares = [];
    for (let j = 1; j * j <= pos; j++) {
      squares.push(j * j);
    }
    return squares;
  };

  const getPathHighlight = () => {
    const highlight = new Set();
    let curr = currentPosition;
    while (curr > 0 && parent[curr] !== undefined && parent[curr] !== -1) {
      const square = parent[curr];
      highlight.add(curr - square * square);
      curr = curr - square * square;
    }
    if (currentPosition === 0) {
      highlight.add(0);
    } else {
      highlight.add(currentPosition);
    }
    return highlight;
  };

  const pathHighlight = getPathHighlight();

  const handleInputChange = (e) => {
    const val = e.target.value;
    setCustomInput(val);
  };

  const handleApplyInput = () => {
    const parsed = parseInt(customInput.trim());
    if (!isNaN(parsed) && parsed > 0) {
      setN(parsed);
      setIsAnimating(false);
    }
  };

  const perfectSquares = [];
  for (let i = 1; i * i <= n; i++) {
    perfectSquares.push(i * i);
  }

  return (
    <div className="psq-container">
      <h1 className="psq-title">LC 279: Perfect Squares</h1>

      <div className="psq-input-section">
        <input
          type="number"
          placeholder="Enter n (e.g., 13)"
          value={customInput}
          onChange={handleInputChange}
          className="psq-input"
          min="1"
        />
        <button onClick={handleApplyInput} className="psq-btn">
          Apply
        </button>
      </div>

      <div className="psq-controls">
        <button
          onClick={() => setIsAnimating(!isAnimating)}
          className="psq-btn"
        >
          {isAnimating ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={() => {
            setCurrentPosition(0);
            setIsAnimating(false);
          }}
          className="psq-btn"
        >
          Reset
        </button>
        <div className="psq-speed-control">
          <label>Speed: </label>
          <input
            type="range"
            min="200"
            max="2000"
            step="100"
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            className="psq-slider"
          />
        </div>
      </div>

      <div className="psq-info-box">
        <div className="psq-info-row">
          <span className="psq-label">n = {n}</span>
          <span className="psq-label">Min Squares = {dpArray[n]}</span>
        </div>
      </div>

      <div className="psq-perfect-squares">
        <div className="psq-squares-label">Perfect Squares ≤ {n}:</div>
        <div className="psq-squares-list">
          {perfectSquares.map((sq, i) => (
            <div key={i} className="psq-perfect-square">
              {sq}
            </div>
          ))}
        </div>
      </div>

      <div className="psq-dp-section">
        <div className="psq-dp-label">DP Array: dp[i] = min(dp[i - j²] + 1)</div>
        <div className="psq-dp-container">
          <div className="psq-dp-grid">
            {dpArray.map((val, i) => (
              <div
                key={i}
                className={`psq-dp-cell ${
                  i === currentPosition ? 'psq-dp-active' : ''
                } ${pathHighlight.has(i) ? 'psq-dp-path' : ''}`}
              >
                <div className="psq-dp-index">{i}</div>
                <div className="psq-dp-value">{val === Infinity ? '∞' : val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {currentPosition > 0 && (
        <div className="psq-tried-squares">
          <div className="psq-tried-label">Perfect Squares Tried at Position {currentPosition}:</div>
          <div className="psq-tried-list">
            {getTriedSquaresAtPosition(currentPosition).map((sq, i) => (
              <div key={i} className="psq-tried-item">
                <span className="psq-tried-square">{sq}</span>
                <span className="psq-tried-arrow">→</span>
                <span className="psq-tried-source">dp[{currentPosition - sq}]</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="psq-solution-section">
        <h3 className="psq-solution-title">Decomposition Path</h3>
        {currentPosition === 0 ? (
          <p className="psq-no-solution">Select a position to view decomposition</p>
        ) : (
          <div className="psq-path-display">
            <div className="psq-path-equation">
              {currentPosition} = {path.map((sq) => `${sq}`).join(' + ')}
            </div>
            <div className="psq-path-counts">
              Number of perfect squares: <strong>{path.length}</strong>
            </div>
          </div>
        )}
      </div>

      <div className="psq-algorithm-info">
        <h3>Algorithm:</h3>
        <p><strong>Recurrence:</strong> dp[i] = min(dp[i - j²] + 1) for all j² ≤ i</p>
        <p><strong>Base Case:</strong> dp[0] = 0</p>
        <p><strong>Answer:</strong> dp[n]</p>
        <p><strong>Time Complexity:</strong> O(n√n)</p>
        <p><strong>Space Complexity:</strong> O(n)</p>
      </div>
    </div>
  );
}
