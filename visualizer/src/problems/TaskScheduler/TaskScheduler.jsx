import React, { useState, useEffect } from 'react';
import './TaskScheduler.css';

const TaskScheduler = () => {
  const [tasks, setTasks] = useState(['A', 'A', 'A', 'B', 'B', 'B']);
  const [n, setN] = useState(2);
  const [customInput, setCustomInput] = useState('');
  const [animationState, setAnimationState] = useState('idle');
  const [timeline, setTimeline] = useState([]);
  const [freqMap, setFreqMap] = useState({});
  const [maxFreq, setMaxFreq] = useState(0);
  const [result, setResult] = useState(0);
  const [currentStep, setCurrentStep] = useState(-1);

  // Calculate frequencies
  useEffect(() => {
    const freq = {};
    tasks.forEach(task => {
      freq[task] = (freq[task] || 0) + 1;
    });
    setFreqMap(freq);

    const max = Math.max(...Object.values(freq), 0);
    setMaxFreq(max);

    // Calculate result: max(tasks.length, (maxFreq - 1) * (n + 1) + count of maxFreq)
    const countMaxFreq = Object.values(freq).filter(f => f === max).length;
    const formulaResult = Math.max(tasks.length, (max - 1) * (n + 1) + countMaxFreq);
    setResult(formulaResult);
  }, [tasks, n]);

  const handleLoadExample = () => {
    setTasks(['A', 'A', 'A', 'B', 'B', 'B']);
    setN(2);
    setAnimationState('idle');
    setCurrentStep(-1);
  };

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      const input = customInput.toUpperCase().split('').filter(c => /[A-Z]/.test(c));
      if (input.length > 0) {
        setTasks(input);
        setCustomInput('');
        setAnimationState('idle');
        setCurrentStep(-1);
      }
    }
  };

  const startAnimation = () => {
    setAnimationState('running');
    setCurrentStep(0);
    animateTimeline();
  };

  const animateTimeline = () => {
    // Simulate timeline generation with animation
    const freq = {};
    tasks.forEach(task => {
      freq[task] = (freq[task] || 0) + 1;
    });

    const taskList = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
    const maxFreq = Math.max(...Object.values(freq));
    let time = [];
    let groups = [];

    // Build groups of n+1 slots
    for (let i = 0; i < maxFreq - 1; i++) {
      const group = [];
      for (let j = 0; j < n + 1; j++) {
        if (taskList[j % taskList.length] && freq[taskList[j % taskList.length]] > i) {
          group.push(taskList[j % taskList.length]);
        } else {
          group.push('IDLE');
        }
      }
      groups.push(group);
    }

    // Last group (no idle padding needed)
    const lastGroup = [];
    for (let i = 0; i < taskList.length; i++) {
      if (freq[taskList[i]] === maxFreq) {
        lastGroup.push(taskList[i]);
      }
    }
    if (lastGroup.length > 0) groups.push(lastGroup);

    setTimeline(groups);
    setAnimationState('completed');
  };

  const freq = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
  const maxFreqValue = maxFreq;
  const countMaxFreq = Object.values(freqMap).filter(f => f === maxFreqValue).length;

  return (
    <div className="ts-container">
      <div className="ts-header">
        <h1>Task Scheduler (LC 621)</h1>
        <p className="ts-subtitle">Find minimum time needed to complete all tasks</p>
      </div>

      <div className="ts-controls">
        <div className="ts-control-group">
          <label>Tasks (comma-separated or letters):</label>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="e.g., A,A,A,B,B,B or AAABBB"
          />
          <button onClick={handleCustomSubmit} className="ts-btn ts-btn-primary">
            Set Tasks
          </button>
        </div>

        <div className="ts-control-group">
          <label>Cooldown Period (n):</label>
          <input
            type="number"
            value={n}
            onChange={(e) => setN(Math.max(0, parseInt(e.target.value) || 0))}
            min="0"
            max="26"
          />
        </div>

        <div className="ts-control-group">
          <button onClick={handleLoadExample} className="ts-btn ts-btn-secondary">
            Load Example
          </button>
          <button
            onClick={startAnimation}
            disabled={animationState === 'running'}
            className="ts-btn ts-btn-accent"
          >
            {animationState === 'running' ? 'Animating...' : 'Visualize'}
          </button>
        </div>
      </div>

      <div className="ts-content">
        <div className="ts-section">
          <h2>Task Frequency Histogram</h2>
          <div className="ts-histogram">
            {freq.length === 0 ? (
              <p className="ts-empty">No tasks</p>
            ) : (
              freq.map(([task, count], idx) => (
                <div key={task} className="ts-bar-container">
                  <div
                    className={`ts-bar ${count === maxFreqValue ? 'ts-bar-max' : ''}`}
                    style={{ height: `${(count / maxFreqValue) * 200}px` }}
                  >
                    <span className="ts-bar-label">{count}</span>
                  </div>
                  <span className="ts-bar-task">{task}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="ts-section">
          <h2>Algorithm Details</h2>
          <div className="ts-formula">
            <div className="ts-formula-item">
              <span className="ts-label">Max Frequency:</span>
              <span className="ts-value">{maxFreqValue}</span>
            </div>
            <div className="ts-formula-item">
              <span className="ts-label">Count with Max Freq:</span>
              <span className="ts-value">{countMaxFreq}</span>
            </div>
            <div className="ts-formula-item">
              <span className="ts-label">Cooldown Period:</span>
              <span className="ts-value">{n}</span>
            </div>
            <div className="ts-formula-box">
              <span className="ts-label">Formula:</span>
              <div className="ts-formula-expr">
                max(len, (maxFreq - 1) × (n + 1) + maxCount)
              </div>
              <div className="ts-formula-expr">
                max({tasks.length}, ({maxFreqValue} - 1) × ({n} + 1) + {countMaxFreq})
              </div>
              <div className="ts-formula-expr">
                max({tasks.length}, {(maxFreqValue - 1) * (n + 1) + countMaxFreq})
              </div>
            </div>
            <div className="ts-formula-result">
              <span className="ts-label">Result:</span>
              <span className="ts-value-large">{result}</span>
            </div>
          </div>
        </div>
      </div>

      {timeline.length > 0 && (
        <div className="ts-section ts-timeline-section">
          <h2>Task Timeline</h2>
          <div className="ts-timeline">
            {timeline.map((group, groupIdx) => (
              <div
                key={groupIdx}
                className={`ts-time-group ${animationState === 'running' && currentStep === groupIdx ? 'ts-active' : ''}`}
              >
                <div className="ts-group-label">Group {groupIdx + 1}</div>
                <div className="ts-slot-row">
                  {group.map((task, slotIdx) => (
                    <div
                      key={`${groupIdx}-${slotIdx}`}
                      className={`ts-slot ${task === 'IDLE' ? 'ts-slot-idle' : 'ts-slot-task'}`}
                    >
                      {task}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="ts-timeline-total">
            Total Time: <span className="ts-value-large">{timeline.length > 0 ? result : 0}</span> units
          </div>
        </div>
      )}

      <div className="ts-explanation">
        <h3>How It Works</h3>
        <ul>
          <li>Count the frequency of each task</li>
          <li>Find the maximum frequency (most frequent task)</li>
          <li>Arrange tasks in groups of size (n+1), separated by cooldown periods</li>
          <li>The formula ensures we account for both task count and cooldown requirements</li>
          <li>Result is the maximum of: total tasks, or the time needed for cooldown-constrained scheduling</li>
        </ul>
      </div>
    </div>
  );
};

export default TaskScheduler;
