import { motion } from "framer-motion";
import ErrorBoundary from "./ErrorBoundary";
import LayoutControls from "./LayoutControls";
import ProblemScaffold from "./panels/ProblemScaffold";

export default function ProblemPage({ problem, onBack, layoutWidth, onLayoutChange }) {
  const Component = problem.component;
  return (
    <motion.div
      className="problem-page"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ type: "spring", stiffness: 320, damping: 35 }}
    >
      <header className="problem-header">
        <button className="back-btn" onClick={onBack}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Problems
        </button>
        <div className="problem-title-group">
          <span className="problem-num">#{problem.number}</span>
          <h1 className="problem-title">{problem.title}</h1>
        </div>
        <span
          className={`difficulty badge difficulty-${problem.difficulty.toLowerCase()}`}
        >
          {problem.difficulty}
        </span>
        <LayoutControls
          layoutWidth={layoutWidth}
          onChange={onLayoutChange}
          compact
        />
      </header>
      <div className="problem-content" data-visualizer-root>
        <ErrorBoundary key={problem.id}>
          {Component ? (
            <Component problem={problem} />
          ) : (
            <ProblemScaffold problem={problem} />
          )}
        </ErrorBoundary>
      </div>
    </motion.div>
  );
}

