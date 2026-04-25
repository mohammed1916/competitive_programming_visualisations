import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CourseSchedule from './problems/CourseSchedule'
import LongestPalindrome from './problems/LongestPalindrome'
import StringToIntegerAtoi from './problems/StringToIntegerAtoi'
import ZigzagConversion from './problems/ZigzagConversion'
import './App.css'

/* ─────────────────────────────────────────────
   Problem Registry — add new problems here
   ───────────────────────────────────────────── */
const PROBLEMS = [
  {
    id: 'course-schedule',
    number: '207',
    title: 'Course Schedule',
    description: 'Build indegrees, process the zero-indegree queue, and detect cycles with topological sort.',
    difficulty: 'Medium',
    tags: ['Graph', 'Topological Sort'],
    accent: '#f97316',
    component: CourseSchedule,
  },
  {
    id: 'longest-palindrome',
    number: '5',
    title: 'Longest Palindromic Substring',
    description: 'Find the longest palindromic substring. Bottom-up DP with O(n²) time & space.',
    difficulty: 'Medium',
    tags: ['Dynamic Programming', 'String'],
    accent: '#8b5cf6',
    component: LongestPalindrome,
  },
  {
    id: 'zigzag-conversion',
    number: '6',
    title: 'Zigzag Conversion',
    description: 'Trace how characters bounce between rows and then merge row buckets into the final answer.',
    difficulty: 'Medium',
    tags: ['String', 'Simulation'],
    accent: '#22c55e',
    component: ZigzagConversion,
  },
  {
    id: 'string-to-integer-atoi',
    number: '8',
    title: 'String to Integer (atoi)',
    description: 'Follow the parser through whitespace, sign, digits, stop conditions, and 32-bit clamping.',
    difficulty: 'Medium',
    tags: ['String', 'Simulation'],
    accent: '#3b82f6',
    component: StringToIntegerAtoi,
  },
  // Add more problems here as the app grows
]

/* ── Sub-components ──────────────────────────────────────────────────── */

function LayoutControls({ layoutWidth, onChange, compact = false }) {
  return (
    <div className={`layout-controls ${compact ? 'compact' : ''}`}>
      <span className="layout-label">Layout</span>
      <div className="layout-pill">
        <button
          className={`layout-btn ${layoutWidth === 'normal' ? 'active' : ''}`}
          onClick={() => onChange('normal')}
        >
          Normal
        </button>
        <button
          className={`layout-btn ${layoutWidth === 'wide' ? 'active' : ''}`}
          onClick={() => onChange('wide')}
        >
          Wide
        </button>
        <button
          className={`layout-btn ${layoutWidth === 'full' ? 'active' : ''}`}
          onClick={() => onChange('full')}
        >
          Full
        </button>
      </div>
    </div>
  )
}

function ProblemPage({ problem, onBack, layoutWidth, onLayoutChange }) {
  const Component = problem.component
  return (
    <motion.div
      className="problem-page"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ type: 'spring', stiffness: 320, damping: 35 }}
    >
      <header className="problem-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Problems
        </button>
        <div className="problem-title-group">
          <span className="problem-num">#{problem.number}</span>
          <h1 className="problem-title">{problem.title}</h1>
        </div>
        <span className={`difficulty badge difficulty-${problem.difficulty.toLowerCase()}`}>
          {problem.difficulty}
        </span>
        <LayoutControls layoutWidth={layoutWidth} onChange={onLayoutChange} compact />
      </header>
      <div className="problem-content">
        <Component />
      </div>
    </motion.div>
  )
}

function HomePage({ onSelect, layoutWidth, onLayoutChange }) {
  return (
    <motion.div
      className="home-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <header className="home-header">
        <div className="home-header-row">
          <motion.div
            className="brand"
            initial={{ y: -18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.08, type: 'spring', stiffness: 280 }}
          >
            <div className="brand-icon">⟨/⟩</div>
            <div>
              <h1>CP Visualizer</h1>
              <p>Algorithms, step by step</p>
            </div>
          </motion.div>

          <LayoutControls layoutWidth={layoutWidth} onChange={onLayoutChange} />
        </div>
      </header>

      <main className="cards-grid">
        {PROBLEMS.map((p, i) => (
          <motion.button
            key={p.id}
            className="problem-card"
            style={{ '--accent': p.accent }}
            onClick={() => onSelect(p)}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 + i * 0.07, type: 'spring', stiffness: 260 }}
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="card-top">
              <span className={`badge difficulty-${p.difficulty.toLowerCase()}`}>
                {p.difficulty}
              </span>
              <span className="card-num">#{p.number}</span>
            </div>
            <h2 className="card-title">{p.title}</h2>
            <p className="card-desc">{p.description}</p>
            <div className="card-footer">
              <div className="card-tags">
                {p.tags.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
              <span className="card-arrow">→</span>
            </div>
          </motion.button>
        ))}

        {/* Coming soon tile */}
        <motion.div
          className="problem-card coming-soon"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 + PROBLEMS.length * 0.07 }}
        >
          <div className="plus">+</div>
          <p>More problems soon</p>
        </motion.div>
      </main>
    </motion.div>
  )
}

/* ── Root App ────────────────────────────────────────────────────────── */
export default function App() {
  const [active, setActive] = useState(null)
  const [layoutWidth, setLayoutWidth] = useState('full')

  return (
    <div className={`app layout-${layoutWidth}`}>
      <AnimatePresence mode="wait">
        {active
          ? <ProblemPage key="problem" problem={active} onBack={() => setActive(null)} layoutWidth={layoutWidth} onLayoutChange={setLayoutWidth} />
          : <HomePage    key="home"    onSelect={setActive} layoutWidth={layoutWidth} onLayoutChange={setLayoutWidth} />
        }
      </AnimatePresence>
    </div>
  )
}
