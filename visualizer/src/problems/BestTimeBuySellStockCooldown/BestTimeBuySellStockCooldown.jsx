import React, { useState, useEffect } from 'react';
import './BestTimeBuySellStockCooldown.css';

export default function BestTimeBuySellStockCooldown() {
  const [prices, setPrices] = useState([3, 3, 5, 0, 0, 3, 1, 4]);
  const [customInput, setCustomInput] = useState('');
  const [currentDay, setCurrentDay] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [states, setStates] = useState([]);

  const computeStates = (priceArray) => {
    if (priceArray.length === 0) return [];

    const n = priceArray.length;
    const hold = new Array(n).fill(-Infinity);
    const sold = new Array(n).fill(0);
    const rest = new Array(n).fill(0);

    hold[0] = -priceArray[0];

    for (let i = 1; i < n; i++) {
      hold[i] = Math.max(hold[i - 1], rest[i - 1] - priceArray[i]);
      sold[i] = hold[i - 1] + priceArray[i];
      rest[i] = Math.max(rest[i - 1], sold[i - 1]);
    }

    return Array.from({ length: n }, (_, i) => ({
      day: i,
      price: priceArray[i],
      hold: hold[i],
      sold: sold[i],
      rest: rest[i],
    }));
  };

  useEffect(() => {
    setStates(computeStates(prices));
    setCurrentDay(0);
  }, [prices]);

  useEffect(() => {
    if (!isAnimating) return;

    const timer = setTimeout(() => {
      setCurrentDay((prev) => {
        if (prev < prices.length - 1) return prev + 1;
        setIsAnimating(false);
        return prev;
      });
    }, speed);

    return () => clearTimeout(timer);
  }, [isAnimating, currentDay, prices.length, speed]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setCustomInput(val);
  };

  const handleApplyInput = () => {
    const parsed = customInput
      .split(',')
      .map((x) => parseInt(x.trim()))
      .filter((x) => !isNaN(x));
    if (parsed.length > 0) {
      setPrices(parsed);
      setIsAnimating(false);
    }
  };

  const maxPrice = Math.max(...prices, 0);
  const minState = Math.min(
    ...states.map((s) => Math.min(s.hold, s.sold, s.rest))
  );
  const maxState = Math.max(
    ...states.map((s) => Math.max(s.hold, s.sold, s.rest))
  );
  const stateRange = maxState - minState || 1;

  return (
    <div className="cooldown-container">
      <h1 className="cooldown-title">LC 309: Best Time to Buy and Sell Stock with Cooldown</h1>

      <div className="cooldown-input-section">
        <input
          type="text"
          placeholder="e.g., 1,2,3,0,2"
          value={customInput}
          onChange={handleInputChange}
          className="cooldown-input"
        />
        <button onClick={handleApplyInput} className="cooldown-btn">
          Apply
        </button>
      </div>

      <div className="cooldown-controls">
        <button
          onClick={() => setIsAnimating(!isAnimating)}
          className="cooldown-btn"
        >
          {isAnimating ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={() => {
            setCurrentDay(0);
            setIsAnimating(false);
          }}
          className="cooldown-btn"
        >
          Reset
        </button>
        <div className="cooldown-speed-control">
          <label>Speed: </label>
          <input
            type="range"
            min="200"
            max="2000"
            step="100"
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            className="cooldown-slider"
          />
        </div>
      </div>

      <div className="cooldown-chart-container">
        <div className="cooldown-price-chart">
          <div className="cooldown-chart-label">Price Chart</div>
          <div className="cooldown-bars">
            {prices.map((price, i) => (
              <div
                key={i}
                className={`cooldown-bar ${i === currentDay ? 'cooldown-bar-active' : ''}`}
                style={{
                  height: `${(price / (maxPrice || 1)) * 150}px`,
                }}
              >
                <span className="cooldown-bar-label">{price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="cooldown-states-section">
        <div className="cooldown-states-label">DP States Over Time</div>
        <div className="cooldown-states-grid">
          {states.map((state, i) => (
            <div
              key={i}
              className={`cooldown-state-card ${i === currentDay ? 'cooldown-state-active' : ''}`}
            >
              <div className="cooldown-state-day">Day {state.day}</div>
              <div className="cooldown-state-price">${state.price}</div>
              <div className="cooldown-state-values">
                <div className="cooldown-state-value">
                  <span className="cooldown-label">Hold:</span>
                  <span className="cooldown-value hold">{state.hold === -Infinity ? '-∞' : state.hold.toFixed(0)}</span>
                </div>
                <div className="cooldown-state-value">
                  <span className="cooldown-label">Sold:</span>
                  <span className="cooldown-value sold">{state.sold.toFixed(0)}</span>
                </div>
                <div className="cooldown-state-value">
                  <span className="cooldown-label">Rest:</span>
                  <span className="cooldown-value rest">{state.rest.toFixed(0)}</span>
                </div>
              </div>
              {i > 0 && (
                <div className="cooldown-transition">
                  <div className="cooldown-arrow">↓</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="cooldown-info-section">
        <h3>Transitions:</h3>
        <ul>
          <li><strong>hold:</strong> max(hold, rest - price)</li>
          <li><strong>sold:</strong> hold + price</li>
          <li><strong>rest:</strong> max(rest, sold)</li>
        </ul>
        <p>
          <strong>Max Profit:</strong> {states.length > 0 ? Math.max(states[states.length - 1].rest, states[states.length - 1].sold).toFixed(0) : 0}
        </p>
      </div>
    </div>
  );
}
