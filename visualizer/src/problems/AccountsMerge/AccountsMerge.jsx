import React, { useState, useEffect } from 'react';
import './AccountsMerge.css';

const AccountsMerge = () => {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [parent, setParent] = useState({});
  const [groups, setGroups] = useState({});
  const [mergedAccounts, setMergedAccounts] = useState([]);
  const [currentEmail, setCurrentEmail] = useState(null);
  const [highlightedEdge, setHighlightedEdge] = useState(null);

  const accounts = [
    ['John', 'j1@com', 'j2@com'],
    ['John', 'j1@com', 'j3@com'],
    ['Mary', 'm1@com'],
  ];

  const generateUnionFindSteps = () => {
    const steps = [];
    const parent = {};
    const groups = {};

    // Initialize
    const allEmails = new Set();
    accounts.forEach((account) => {
      for (let i = 1; i < account.length; i++) {
        allEmails.add(account[i]);
      }
    });

    allEmails.forEach((email) => {
      parent[email] = email;
      groups[email] = [email];
    });

    steps.push({
      type: 'init',
      parent: { ...parent },
      groups: JSON.parse(JSON.stringify(groups)),
      currentEmail: null,
      highlightedEdge: null,
      mergedAccounts: [],
    });

    // Union-Find process
    accounts.forEach((account, accIdx) => {
      const [name, ...emails] = account;

      for (let i = 0; i < emails.length - 1; i++) {
        const email1 = emails[i];
        const email2 = emails[i + 1];

        const root1 = findRoot(parent, email1);
        const root2 = findRoot(parent, email2);

        if (root1 !== root2) {
          parent[root2] = root1;

          steps.push({
            type: 'union',
            parent: { ...parent },
            groups: JSON.parse(JSON.stringify(groups)),
            currentEmail: email2,
            highlightedEdge: [email1, email2],
            mergedAccounts: [],
          });
        }
      }
    });

    // Build final groups
    const finalGroups = {};
    allEmails.forEach((email) => {
      const root = findRoot(parent, email);
      if (!finalGroups[root]) {
        finalGroups[root] = [];
      }
      finalGroups[root].push(email);
    });

    steps.push({
      type: 'grouping',
      parent: { ...parent },
      groups: finalGroups,
      currentEmail: null,
      highlightedEdge: null,
      mergedAccounts: [],
    });

    // Sort and create final result
    const emailToName = {};
    accounts.forEach((account) => {
      const [name, ...emails] = account;
      emails.forEach((email) => {
        emailToName[email] = name;
      });
    });

    const finalAccounts = Object.entries(finalGroups).map(([root, emails]) => {
      const name = emailToName[root];
      return [name, ...emails.sort()];
    });

    finalAccounts.sort();

    steps.push({
      type: 'complete',
      parent: { ...parent },
      groups: finalGroups,
      currentEmail: null,
      highlightedEdge: null,
      mergedAccounts: finalAccounts,
    });

    return steps;
  };

  const findRoot = (parent, x) => {
    if (parent[x] === x) return x;
    return findRoot(parent, parent[x]);
  };

  const allSteps = generateUnionFindSteps();

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
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlaying, allSteps.length]);

  useEffect(() => {
    const currentStep = allSteps[step];
    if (currentStep) {
      setParent(currentStep.parent);
      setGroups(currentStep.groups);
      setCurrentEmail(currentStep.currentEmail);
      setHighlightedEdge(currentStep.highlightedEdge);
      setMergedAccounts(currentStep.mergedAccounts);
    }
  }, [step, allSteps]);

  const renderUnionFindVisualization = () => {
    const allEmails = Object.keys(parent);
    const cols = Math.ceil(Math.sqrt(allEmails.length));
    const rowHeight = 80;
    const colWidth = 150;

    return (
      <svg
        className="am-graph"
        viewBox={`0 0 ${Math.max(400, cols * colWidth)} ${Math.max(300, Math.ceil(allEmails.length / cols) * rowHeight)}`}
      >
        {allEmails.map((email, idx) => {
          const row = Math.floor(idx / cols);
          const col = idx % cols;
          const x = col * colWidth + 75;
          const y = row * rowHeight + 40;

          const root = findRoot(parent, email);
          const isHighlighted =
            highlightedEdge &&
            (email === highlightedEdge[0] || email === highlightedEdge[1]);
          const isRoot = parent[email] === email;

          return (
            <g key={`email-${email}`}>
              {/* Edge to parent if not root */}
              {!isRoot && (
                <line
                  x1={x}
                  y1={y}
                  x2={x - 70}
                  y2={y}
                  className={`am-edge ${
                    isHighlighted ? 'am-edge--highlight' : ''
                  }`}
                />
              )}

              {/* Node */}
              <circle
                cx={x}
                cy={y}
                r={18}
                className={`am-node ${isRoot ? 'am-node--root' : ''} ${
                  isHighlighted ? 'am-node--highlight' : ''
                }`}
              />

              {/* Label */}
              <text x={x} y={y + 5} className="am-node-label">
                {email.split('@')[0]}
              </text>

              {/* Parent pointer if not root */}
              {!isRoot && (
                <text x={x - 35} y={y - 8} className="am-edge-label">
                  {parent[email].split('@')[0]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  const currentStepData = allSteps[step];

  return (
    <div className="am-container">
      <div className="am-header">
        <h1>Accounts Merge (LC 721)</h1>
        <p className="am-subtitle">Union-Find Email Merging</p>
      </div>

      <div className="am-content">
        <div className="am-visualization">
          {renderUnionFindVisualization()}
        </div>

        <div className="am-info">
          <div className="am-input">
            <h3>Accounts Input</h3>
            <div className="am-accounts-list">
              {accounts.map((account, idx) => (
                <div key={idx} className="am-account-item">
                  <span className="am-account-name">{account[0]}</span>
                  <span className="am-account-emails">
                    {account.slice(1).join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="am-groups">
            <h3>Email Groups</h3>
            <div className="am-groups-list">
              {Object.entries(groups).length === 0 ? (
                <p className="am-empty">No groups yet</p>
              ) : (
                Object.entries(groups).map(([root, emails]) => (
                  <div key={root} className="am-group-item">
                    <span className="am-group-root">Root: {root}</span>
                    <span className="am-group-emails">
                      {emails.sort().join(', ')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {mergedAccounts.length > 0 && (
            <div className="am-result">
              <h3>Merged Accounts</h3>
              <div className="am-result-list">
                {mergedAccounts.map((account, idx) => (
                  <div key={idx} className="am-result-item">
                    <span className="am-result-name">{account[0]}</span>
                    <span className="am-result-emails">
                      {account.slice(1).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="am-step-info">
        <p className="am-step-description">
          {currentStepData?.type === 'init' &&
            'Initializing Union-Find: each email is its own parent'}
          {currentStepData?.type === 'union' &&
            `Union operation: merging ${highlightedEdge?.[0]} with ${highlightedEdge?.[1]}`}
          {currentStepData?.type === 'grouping' &&
            'Grouping emails by their root parent'}
          {currentStepData?.type === 'complete' &&
            'Complete! All emails merged into final accounts'}
        </p>
      </div>

      <div className="am-controls">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          className="am-btn am-btn--prev"
        >
          Previous
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="am-btn am-btn--play"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <button
          onClick={() => setStep(Math.min(allSteps.length - 1, step + 1))}
          className="am-btn am-btn--next"
        >
          Next
        </button>

        <button onClick={() => setStep(0)} className="am-btn am-btn--reset">
          Reset
        </button>

        <span className="am-step-indicator">
          Step {step + 1} / {allSteps.length}
        </span>
      </div>
    </div>
  );
};

export default AccountsMerge;
