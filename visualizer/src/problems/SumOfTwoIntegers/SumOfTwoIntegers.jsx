import React, { useState, useEffect } from 'react';
import './SumOfTwoIntegers.css';

export default function SumOfTwoIntegers() {
  const [a, setA] = useState(5);
  const [b, setB] = useState(7);
  const [customAInput, setCustomAInput] = useState('');
  const [customBInput, setCustomBInput] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [speed, setSpeed] = useState(1500);
  const [steps, setSteps] = useState([]);

  const computeSteps = (numA, numB) => {
    const stepList = [];
    let currA = numA;
    let currB = numB;
    let step = 0;

    stepList.push({
      step: step,
      a: currA,
      b: currB,
      xor: null,
      carry: null,
      description: 'Initial values',
    });

    while (currB !== 0) {
      step++;
      const xor = currA ^ currB;
      const carry = (currA & currB) << 1;

      stepList.push({
        step: step,
        a: xor,
        b: carry,
        xor,
        carry,
        description: `a = a ^ b = ${xor}, b = (a & b) << 1 = ${carry}`,
      });

      currA = xor;
      currB = carry;
    }

    return stepList;
  };

  useEffect(() => {
    setSteps(computeSteps(a, b));
    setCurrentStep(0);
  }, [a, b]);

  useEffect(() => {
    if (!isAnimating) return;

    const timer = setTimeout(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        setIsAnimating(false);
        return prev;
      });
    }, speed);

    return () => clearTimeout(timer);
  }, [isAnimating, currentStep, steps.length, speed]);

  const handleApplyInputs = () => {
    const parsedA = parseInt(customAInput.trim());
    const parsedB = parseInt(customBInput.trim());
    if (!isNaN(parsedA) && !isNaN(parsedB)) {
      setA(parsedA);
      setB(parsedB);
      setIsAnimating(false);
    }
  };

  const intToBinary = (num, bits = 32) => {
    if (num < 0) {
      return (~(-num - 1)).toString(2).padStart(bits, '1');
    }
    return num.toString(2).padStart(bits, '0');
  };

  const getCurrentStep = () => {
    return steps[currentStep] || steps[0];
  };

  const curr = getCurrentStep();

  const formatBinary = (num) => {
    return intToBinary(num).slice(-16);
  };

  const result = steps.length > 0 ? steps[steps.length - 1].a : a + b;

  return (
    <div className="sti-container">
      <h1 className="sti-title">LC 371: Sum of Two Integers</h1>

      <div className="sti-input-section">
        <div className="sti-input-group">
          <input
            type="number"
            placeholder="a (e.g., 5)"
            value={customAInput}
            onChange={(e) => setCustomAInput(e.target.value)}
            className="sti-input"
          />
          <input
            type="number"
            placeholder="b (e.g., 7)"
            value={customBInput}
            onChange={(e) => setCustomBInput(e.target.value)}
            className="sti-input"
          />
          <button onClick={handleApplyInputs} className="sti-btn">
            Apply
          </button>
        </div>
      </div>

      <div className="sti-controls">
        <button
          onClick={() => setIsAnimating(!isAnimating)}
          className="sti-btn"
        >
          {isAnimating ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={() => {
            setCurrentStep(0);
            setIsAnimating(false);
          }}
          className="sti-btn"
        >
          Reset
        </button>
        <div className="sti-speed-control">
          <label>Speed: </label>
          <input
            type="range"
            min="300"
            max="2500"
            step="100"
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            className="sti-slider"
          />
        </div>
      </div>

      <div className="sti-result-box">
        <div className="sti-result-row">
          <span className="sti-result-label">Sum:</span>
          <span className="sti-result-value">{a} + {b} = {result}</span>
        </div>
        <div className="sti-result-row">
          <span className="sti-result-label">Step {currentStep + 1} of {steps.length}</span>
        </div>
      </div>

      {currentStep < steps.length && (
        <div className="sti-description">
          <p>{curr.description}</p>
        </div>
      )}

      <div className="sti-grid-container">
        <div className="sti-grid-section">
          <div className="sti-grid-label">a (XOR)</div>
          <div className="sti-binary-grid">
            {formatBinary(curr.a).split('').map((bit, i) => (
              <div key={i} className="sti-bit sti-bit-xor">
                {bit}
              </div>
            ))}
          </div>
          <div className="sti-value">{curr.a}</div>
        </div>

        <div className="sti-operator">
          <div className="sti-op-arrow">↓</div>
          <div className="sti-op-text">a = a ^ b</div>
        </div>

        <div className="sti-grid-section">
          <div className="sti-grid-label">b (Carry)</div>
          <div className="sti-binary-grid">
            {formatBinary(curr.b).split('').map((bit, i) => (
              <div key={i} className="sti-bit sti-bit-carry">
                {bit}
              </div>
            ))}
          </div>
          <div className="sti-value">{curr.b}</div>
        </div>
      </div>

      {curr.xor !== null && curr.carry !== null && (
        <div className="sti-operations">
          <div className="sti-operation-box">
            <div className="sti-op-title">XOR Operation</div>
            <div className="sti-op-detail">
              <code>{formatBinary(steps[currentStep - 1]?.a || a)} ^ {formatBinary(steps[currentStep - 1]?.b || b)} = {formatBinary(curr.xor)}</code>
            </div>
          </div>

          <div className="sti-operation-box">
            <div className="sti-op-title">Carry Operation</div>
            <div className="sti-op-detail">
              <code>({formatBinary(steps[currentStep - 1]?.a || a)} & {formatBinary(steps[currentStep - 1]?.b || b)}) &lt;&lt; 1 = {formatBinary(curr.carry)}</code>
            </div>
          </div>
        </div>
      )}

      <div className="sti-steps-timeline">
        <div className="sti-timeline-label">Iteration Steps</div>
        <div className="sti-timeline">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`sti-timeline-item ${i === currentStep ? 'sti-timeline-active' : ''} ${
                i < currentStep ? 'sti-timeline-completed' : ''
              }`}
              onClick={() => {
                setCurrentStep(i);
                setIsAnimating(false);
              }}
            >
              <div className="sti-timeline-step">{i}</div>
              {i < steps.length - 1 && (
                <div className="sti-timeline-connector"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="sti-algorithm-info">
        <h3>Algorithm (Bit Manipulation):</h3>
        <div className="sti-algorithm-content">
          <p><strong>Key Idea:</strong> Use XOR for sum without carry, AND for carry.</p>
          <div className="sti-code-block">
            <code>
              while (b !== 0) {'{'}
              <br />
              &nbsp;&nbsp;a = a ^ b&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// sum without carry
              <br />
              &nbsp;&nbsp;b = (a & b) &lt;&lt; 1&nbsp;&nbsp;&nbsp;// carry shifted left
              <br />
              {'}'}<br />
              return a
            </code>
          </div>
          <ul>
            <li><strong>XOR (^):</strong> Gives sum of bits without carry</li>
            <li><strong>AND (&):</strong> Identifies positions where carry is needed</li>
            <li><strong>Left Shift (&lt;&lt; 1):</strong> Moves carry to next bit position</li>
            <li><strong>Repeat:</strong> Until no carry (b = 0)</li>
          </ul>
          <p><strong>Time Complexity:</strong> O(log(max(a, b))) for number of bits</p>
          <p><strong>Space Complexity:</strong> O(1)</p>
        </div>
      </div>
    </div>
  );
}
