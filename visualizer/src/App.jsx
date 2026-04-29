import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CourseSchedule from './problems/CourseSchedule'
import LongestPalindrome from './problems/LongestPalindrome'
import LRUCache from './problems/LRUCache'
import StringToIntegerAtoi from './problems/StringToIntegerAtoi'
import ZigzagConversion from './problems/ZigzagConversion'
import ProblemScaffold from './components/panels/ProblemScaffold'
import './App.css'

const IMPLEMENTED_PROBLEMS = [
  {
    id: 'lc-207',
    number: '207',
    title: 'Course Schedule',
    slug: 'course-schedule',
    description: 'Build indegrees, process the zero-indegree queue, and detect cycles with topological sort.',
    difficulty: 'Medium',
    tags: ['Graph', 'Topological Sort'],
    accent: '#f97316',
    component: CourseSchedule,
  },
  {
    id: 'lc-5',
    number: '5',
    title: 'Longest Palindromic Substring',
    slug: 'longest-palindromic-substring',
    description: 'Find the longest palindromic substring. Bottom-up DP with O(n²) time & space.',
    difficulty: 'Medium',
    tags: ['Dynamic Programming', 'String'],
    accent: '#8b5cf6',
    component: LongestPalindrome,
  },
  {
    id: 'lc-146',
    number: '146',
    title: 'LRU Cache',
    slug: 'lru-cache',
    description: 'Track O(1) get/put with a hash map and doubly linked list while MRU/LRU order updates live.',
    difficulty: 'Medium',
    tags: ['Design', 'Hash Map', 'Linked List'],
    accent: '#0ea5e9',
    component: LRUCache,
  },
  {
    id: 'lc-6',
    number: '6',
    title: 'Zigzag Conversion',
    slug: 'zigzag-conversion',
    description: 'Trace how characters bounce between rows and then merge row buckets into the final answer.',
    difficulty: 'Medium',
    tags: ['String', 'Simulation'],
    accent: '#22c55e',
    component: ZigzagConversion,
  },
  {
    id: 'lc-8',
    number: '8',
    title: 'String to Integer (atoi)',
    slug: 'string-to-integer-atoi',
    description: 'Follow the parser through whitespace, sign, digits, stop conditions, and 32-bit clamping.',
    difficulty: 'Medium',
    tags: ['String', 'Simulation'],
    accent: '#3b82f6',
    component: StringToIntegerAtoi,
  },
]

const IMPLEMENTED_BY_NUMBER = new Map(IMPLEMENTED_PROBLEMS.map((problem) => [problem.number, problem]))

function buildCatalogProblems(catalogProblems) {
  return catalogProblems.map((problem) => {
    const implemented = IMPLEMENTED_BY_NUMBER.get(problem.number)
    if (!implemented) {
      return {
        ...problem,
        accent: '#64748b',
        description: 'Cataloged in explorer. Visualizer shell is ready; implementation can be plugged into reusable panels.',
        component: null,
        implemented: false,
      }
    }

    return {
      ...problem,
      ...implemented,
      implemented: true,
    }
  })
}

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
        {Component ? <Component /> : <ProblemScaffold problem={problem} />}
      </div>
    </motion.div>
  )
}

function HomePage({ onSelect, layoutWidth, onLayoutChange }) {
  const [allProblems, setAllProblems] = useState([])
  const [catalogError, setCatalogError] = useState('')
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('All')
  const [status, setStatus] = useState('All')
  const [activeTag, setActiveTag] = useState('All')
  const [visibleCount, setVisibleCount] = useState(60)

  useEffect(() => {
    let cancelled = false

    fetch('/data/leetcodeCatalog.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Catalog load failed: ${response.status}`)
        }
        return response.json()
      })
      .then((payload) => {
        if (cancelled) return
        const catalogProblems = Array.isArray(payload?.problems) ? payload.problems : []
        setAllProblems(buildCatalogProblems(catalogProblems))
      })
      .catch((error) => {
        if (cancelled) return
        setCatalogError(error.message || 'Failed to load LeetCode catalog')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const allTags = useMemo(() => {
    return Array.from(new Set(allProblems.flatMap((problem) => problem.tags || []))).sort()
  }, [allProblems])

  const normalizedSearch = search.trim().toLowerCase()

  const filtered = allProblems.filter((problem) => {
    if (difficulty !== 'All' && problem.difficulty !== difficulty) return false
    if (status === 'Implemented' && !problem.implemented) return false
    if (status === 'Catalog Only' && problem.implemented) return false
    if (activeTag !== 'All' && !(problem.tags || []).includes(activeTag)) return false
    if (!normalizedSearch) return true

    const haystack = `${problem.number} ${problem.title} ${problem.slug} ${(problem.tags || []).join(' ')}`.toLowerCase()
    return haystack.includes(normalizedSearch)
  })

  const visible = filtered.slice(0, visibleCount)

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

        <div className="catalog-meta">
          <span>Total catalog: {allProblems.length}</span>
          <span>Implemented: {IMPLEMENTED_PROBLEMS.length}</span>
          <span>Visible: {filtered.length}</span>
          {catalogError ? <span>Catalog error: {catalogError}</span> : null}
        </div>

        <div className="filters-row">
          <input
            className="search-input"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setVisibleCount(60)
            }}
            placeholder="Search by number, title, slug, or tag"
          />

          <select className="filter-select" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
            <option>All</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>

          <select className="filter-select" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option>All</option>
            <option>Implemented</option>
            <option>Catalog Only</option>
          </select>
        </div>

        <div className="tag-row">
          <button className={`tag-filter ${activeTag === 'All' ? 'active' : ''}`} onClick={() => setActiveTag('All')}>
            All
          </button>
          {allTags.slice(0, 24).map((tag) => (
            <button
              key={tag}
              className={`tag-filter ${activeTag === tag ? 'active' : ''}`}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </header>

      <main className="cards-grid">
        {visible.map((p, i) => (
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
              <span className="card-arrow">{p.implemented ? '→' : '⋯'}</span>
            </div>
          </motion.button>
        ))}
      </main>

      {visibleCount < filtered.length && (
        <div className="load-more-wrap">
          <button className="load-more-btn" onClick={() => setVisibleCount((count) => count + 60)}>
            Load 60 more problems
          </button>
        </div>
      )}
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
