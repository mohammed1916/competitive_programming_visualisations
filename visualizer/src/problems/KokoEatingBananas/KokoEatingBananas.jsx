import React, { useState, useEffect } from 'react';
import './KokoEatingBananas.css';

const KokoEatingBananas = () => {
  const [piles, setPiles] = useState([3, 6, 7, 11]);
  const [h, setH] = useState(8);
  const [customInput, setCustomInput] = useState('');
  const [animationState, setAnimationState] = useState('idle');
  const [searchState, setSearchState] = useState({
    lo: 1,
    hi: 0,
    mid: 0,
    hours: 0,
    found: false,
  });
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [result, setResult] = useState(0);

  // Calculate hours for a given speed
  const calculateHours = (piles, speed) => {
    return piles.reduce((total, pile) => total + Math.ceil(pile / speed), 0);
  };

  useEffect(() => {
    if (piles.length === 0) {
      setResult(1);
      return;
    }

    let lo = 1;
    let hi = Math.max(...piles);
    let answer = hi;

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const hours = calculateHours(piles, mid);

      if (hours <= h) {
        answer = mid;
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }

    setResult(answer);
  }, [piles, h]);

  const handleLoadExample = () => {
    setPiles([3, 6, 7, 11]);
    setH(8);
    setAnimationState('idle');
    setCurrentStepIndex(-1);
  };

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      const input = customInput
        .split(/[,\s]+/)
        .map(x => parseInt(x))
        .filter(x => !isNaN(x) && x > 0);
      if (input.length > 0) {
        setPiles(input);
        setCustomInput('');
        setAnimationState('idle');
        setCurrentStepIndex(-1);
      }
    }
  };

  const startAnimation = () => {
    if (piles.length === 0) return;

    setAnimationState('running');
    setCurrentStepIndex(0);

    const animationSteps = [];
    let lo = 1;
    let hi = Math.max(...piles);
    let stepCount = 0;

    while (lo <= hi && stepCount < 20) {
      const mid = Math.floor((lo + hi) / 2);
      const hours = calculateHours(piles, mid);
      const found = hours <= h;

      animationSteps.push({
        lo,
        hi,
        mid,
        hours,
        found,
        stepNum: stepCount + 1,
      });

      if (found) {
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }

      stepCount++;
    }

    setSteps(animationSteps);

    // Simulate step-by-step animation
    let stepIdx = 0;
    const stepInterval = setInterval(() => {
      if (stepIdx < animationSteps.length) {
        setCurrentStepIndex(stepIdx);
        stepIdx++;
      } else {
        clearInterval(stepInterval);
        setAnimationState('completed');
      }
    }, 800);
  };

  const maxPile = piles.length > 0 ? Math.max(...piles) : 0;
  const currentStep = currentStepIndex >= 0 && currentStepIndex < steps.length ? steps[currentStepIndex] : null;

  return (
    <div className="keb-container">
      <div className="keb-header">
        <h1>Koko Eating Bananas (LC 875)</h1>
        <p className="keb-subtitle">Find minimum eating speed to finish all piles in time</p>
      </div>

      <div className="keb-controls">
        <div className="keb-control-group">
          <label>Pile Heights (comma-separated):</label>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="e.g., 3,6,7,11"
          />
          <button onClick={handleCustomSubmit} className="keb-btn keb-btn-primary">
            Set Piles
          </button>
        </div>

        <div className="keb-control-group">
          <label>Hours Available (h):</label>
          <input
            type="number"
            value={h}
            onChange={(e) => setH(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
          />
        </div>

        <div className="keb-control-group">
          <button onClick={handleLoadExample} className="keb-btn keb-btn-secondary">
            Load Example
          </button>
          <button
            onClick={startAnimation}
            disabled={animationState === 'running' || piles.length === 0}
            className="keb-btn keb-btn-accent"
          >
            {animationState === 'running' ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      <div className="keb-content">
        <div className="keb-section">
          <h2>Pile Heights Visualization</h2>
          <div className="keb-pile-chart">
            {piles.length === 0 ? (
              <p className="keb-empty">No piles</p>
            ) : (
              piles.map((pile, idx) => (
                <div key={idx} className="keb-pile-container">
                  <div
                    className="keb-pile"
                    style={{ height: `${(pile / maxPile) * 200}px` }}
                  >
                    <span className="keb-pile-count">{pile}</span>
                  </div>
                  <span className="keb-pile-index">Pile {idx + 1}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="keb-section">
          <h2>Binary Search State</h2>
          <div className="keb-search-info">
            <div className="keb-info-item">
              <span className="keb-label">Total Piles:</span>
              <span className="keb-value">{piles.length}</span>
            </div>
            <div className="keb-info-item">
              <span className="keb-label">Max Pile Height:</span>
              <span className="keb-value">{maxPile}</span>
            </div>
            <div className="keb-info-item">
              <span className="keb-label">Hours Available:</span>
              <span className="keb-value">{h}</span>
            </div>
            <div className="keb-info-item">
              <span className="keb-label">Search Range:</span>
              <span className="keb-value">1 to {maxPile}</span>
            </div>

            {currentStep && (
              <div className="keb-step-box">
                <div className="keb-step-title">Step {currentStep.stepNum}</div>
                <div className="keb-step-details">
                  <div className="keb-step-item">
                    <span className="keb-label">lo:</span>
                    <span className="keb-value keb-value-lo">{currentStep.lo}</span>
                  </div>
                  <div className="keb-step-item">
                    <span className="keb-label">mid (k):</span>
                    <span className="keb-value keb-value-mid">{currentStep.mid}</span>
                  </div>
                  <div className="keb-step-item">
                    <span className="keb-label">hi:</span>
                    <span className="keb-value keb-value-hi">{currentStep.hi}</span>
                  </div>
                </div>
                <div className="keb-step-calculation">
                  <div className="keb-calc-label">Hours at k={currentStep.mid}:</div>
                  <div className="keb-calc-expr">
                    {piles.map(pile => `⌈${pile}/${currentStep.mid}⌉`).join(' + ')}
                  </div>
                  <div className="keb-calc-result">
                    = {currentStep.hours} {currentStep.hours <= h ? '✓ Valid' : '✗ Too slow'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {steps.length > 0 && (
        <div className="keb-section keb-steps-section">
          <h2>Binary Search Steps</h2>
          <div className="keb-steps-timeline">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`keb-step ${idx === currentStepIndex ? 'keb-step-active' : ''} ${
                  step.found ? 'keb-step-found' : 'keb-step-notfound'
                }`}
              >
                <div className="keb-step-num">{step.stepNum}</div>
                <div className="keb-step-content">
                  <div className="keb-step-range">
                    [{step.lo}, {step.hi}] → k={step.mid}
                  </div>
                  <div className="keb-step-verdict">
                    h={step.hours} {step.hours <= h ? '≤' : '>'} {h}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="keb-result-section">
        <div className="keb-result-card">
          <h3>Minimum Speed</h3>
          <div className="keb-result-value">{result}</div>
          <p className="keb-result-desc">
            Koko eats <strong>{result}</strong> banana(s) per hour to finish all piles in {h} hours
          </p>
        </div>

        <div className="keb-verification">
          <h3>Verification</h3>
          <div className="keb-verify-item">
            <span className="keb-label">At speed {result}:</span>
            <span className="keb-value">{calculateHours(piles, result)} hours</span>
          </div>
          <div className="keb-verify-item">
            <span className="keb-label">Required:</span>
            <span className="keb-value">{h} hours</span>
          </div>
          <div className="keb-verify-result">
            {calculateHours(piles, result) <= h ? '✓ Valid Solution' : '✗ Invalid'}
          </div>
        </div>
      </div>

      <div className="keb-explanation">
        <h3>How Binary Search Works</h3>
        <ul>
          <li>Search space: speed k from 1 to max(piles)</li>
          <li>For each candidate speed, calculate hours = sum(ceil(pile/k))</li>
          <li>If hours &le; h: speed is feasible, try slower (hi = mid-1)</li>
          <li>If hours &gt; h: speed is too slow, need faster (lo = mid+1)</li>
          <li>Continue until finding the minimum feasible speed</li>
        </ul>
      </div>
    </div>
  );
};

export default KokoEatingBananas;
