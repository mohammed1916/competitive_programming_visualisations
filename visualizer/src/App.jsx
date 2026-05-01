import { useEffect, useMemo, useState, Component } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CourseSchedule from './problems/CourseSchedule'
import LongestPalindrome from './problems/LongestPalindrome'
import LRUCache from './problems/LRUCache'
import StringToIntegerAtoi from './problems/StringToIntegerAtoi'
import ZigzagConversion from './problems/ZigzagConversion'
import TwoSum from './problems/TwoSum'
import ValidParentheses from './problems/ValidParentheses'
import MergeTwoSortedLists from './problems/MergeTwoSortedLists'
import MaximumSubarray from './problems/MaximumSubarray'
import ClimbingStairs from './problems/ClimbingStairs'
import BinarySearch from './problems/BinarySearch'
import NumberOfIslands from './problems/NumberOfIslands'
import MatrixIterationBasics from './problems/MatrixIterationBasics'
import ProblemScaffold from './components/panels/ProblemScaffold'
import './App.css'

const TRACKS = {
  LEETCODE: 'leetcode',
  BASICS: 'basics',
}

const IMPLEMENTED_PROBLEMS = [
  {
    id: 'lc-1',
    number: '1',
    title: 'Two Sum',
    slug: 'two-sum',
    description: 'Find two indices that add to the target using a single-pass hash map to achieve O(n) time.',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table'],
    accent: '#22c55e',
    component: TwoSum,
  },
  {
    id: 'lc-20',
    number: '20',
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    description: 'Use a stack to match opening brackets — every closing bracket must pop a matching open bracket.',
    difficulty: 'Easy',
    tags: ['String', 'Stack'],
    accent: '#f97316',
    component: ValidParentheses,
  },
  {
    id: 'lc-21',
    number: '21',
    title: 'Merge Two Sorted Lists',
    slug: 'merge-two-sorted-lists',
    description: 'Use a dummy head and a curr pointer to weave two sorted linked lists in O(n+m) time.',
    difficulty: 'Easy',
    tags: ['Linked List', 'Two Pointers'],
    accent: '#0ea5e9',
    component: MergeTwoSortedLists,
  },
  {
    id: 'lc-53',
    number: '53',
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    description: "Kadane's algorithm: extend the current window or reset it, tracking the global max.",
    difficulty: 'Medium',
    tags: ['Array', 'Dynamic Programming', 'Divide and Conquer'],
    accent: '#eab308',
    component: MaximumSubarray,
  },
  {
    id: 'lc-70',
    number: '70',
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    description: 'Classic 1-D DP: dp[i] = dp[i-1] + dp[i-2]. Watch the Fibonacci-like table fill up.',
    difficulty: 'Easy',
    tags: ['Dynamic Programming', 'Math', 'Memoization'],
    accent: '#a855f7',
    component: ClimbingStairs,
  },
  {
    id: 'lc-200',
    number: '200',
    title: 'Number of Islands',
    slug: 'number-of-islands',
    description: 'BFS flood-fill on a 2-D grid — each unvisited land cell seeds a new island count.',
    difficulty: 'Medium',
    tags: ['Array', 'BFS', 'DFS', 'Graph', 'Matrix'],
    accent: '#06b6d4',
    component: NumberOfIslands,
  },
  {
    id: 'lc-704',
    number: '704',
    title: 'Binary Search',
    slug: 'binary-search',
    description: 'Classic binary search: halve the search window each iteration until target is found or window collapses.',
    difficulty: 'Easy',
    tags: ['Array', 'Binary Search'],
    accent: '#3b82f6',
    component: BinarySearch,
  },
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

const BASICS_PROBLEMS = [
  {
    id: 'bs-01',
    number: 'B1',
    title: 'Upper Triangular Iteration',
    slug: 'upper-triangular-iteration',
    description: 'Visualize i-j loop ordering while visiting only cells where j >= i.',
    difficulty: 'Easy',
    tags: ['Matrix', 'Loops', 'Triangular'],
    accent: '#0ea5e9',
    component: MatrixIterationBasics,
    implemented: true,
    mode: 'upper',
  },
  {
    id: 'bs-02',
    number: 'B2',
    title: 'Lower Triangular Iteration',
    slug: 'lower-triangular-iteration',
    description: 'Step through row-major loops while visiting only cells where i >= j.',
    difficulty: 'Easy',
    tags: ['Matrix', 'Loops', 'Triangular'],
    accent: '#22c55e',
    component: MatrixIterationBasics,
    implemented: true,
    mode: 'lower',
  },
  {
    id: 'bs-03',
    number: 'B3',
    title: 'Diagonal And Full Traversals',
    slug: 'diagonal-and-full-traversals',
    description: 'Compare diagonal, anti-diagonal, and full matrix traversals from one visual panel.',
    difficulty: 'Easy',
    tags: ['Matrix', 'Loops', 'Traversal'],
    accent: '#f59e0b',
    component: MatrixIterationBasics,
    implemented: true,
    mode: 'diag',
  },
]

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

/* ── Error Boundary ──────────────────────────────────────────────────── */

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Visualizer error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', gap: 16, padding: 32,
          color: '#94a3b8', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <h2 style={{ color: '#f87171', margin: 0 }}>Visualizer Error</h2>
          <p style={{ margin: 0, maxWidth: 480, fontSize: 14 }}>
            {this.state.error.message || 'An unexpected error occurred in this visualizer.'}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              padding: '8px 20px', borderRadius: 8, border: '1px solid #334155',
              background: '#1e293b', color: '#f8fafc', cursor: 'pointer', fontSize: 14,
            }}
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
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
        <ErrorBoundary key={problem.id}>
          {Component ? <Component problem={problem} /> : <ProblemScaffold problem={problem} />}
        </ErrorBoundary>
      </div>
    </motion.div>
  )
}

function HomePage({ track, onTrackChange, onSelect, layoutWidth, onLayoutChange }) {
  const [catalogProblems, setCatalogProblems] = useState([])
  const [catalogError, setCatalogError] = useState('')
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('All')
  const [status, setStatus] = useState('All')
  const [activeTag, setActiveTag] = useState('All')
  const [visibleCount, setVisibleCount] = useState(60)

  const isLeetCodeTrack = track === TRACKS.LEETCODE

  useEffect(() => {
    if (!isLeetCodeTrack) return

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
        const nextCatalogProblems = Array.isArray(payload?.problems) ? payload.problems : []
        setCatalogProblems(nextCatalogProblems)
        setCatalogError('')
      })
      .catch((error) => {
        if (cancelled) return
        setCatalogError(error.message || 'Failed to load LeetCode catalog')
      })

    return () => {
      cancelled = true
    }
  }, [isLeetCodeTrack])

  const allProblems = useMemo(() => {
    return isLeetCodeTrack ? buildCatalogProblems(catalogProblems) : BASICS_PROBLEMS
  }, [catalogProblems, isLeetCodeTrack])

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
              <p>{isLeetCodeTrack ? 'LeetCode and interview patterns' : 'Core programming basics and loop patterns'}</p>
            </div>
          </motion.div>

          <div className="track-switcher" role="tablist" aria-label="Problem tracks">
            <button
              className={`track-btn ${track === TRACKS.LEETCODE ? 'active' : ''}`}
              onClick={() => onTrackChange(TRACKS.LEETCODE)}
            >
              LeetCode Track
            </button>
            <button
              className={`track-btn ${track === TRACKS.BASICS ? 'active' : ''}`}
              onClick={() => onTrackChange(TRACKS.BASICS)}
            >
              Basics Track
            </button>
          </div>

          <LayoutControls layoutWidth={layoutWidth} onChange={onLayoutChange} />
        </div>

        <div className="catalog-meta">
          <span>{isLeetCodeTrack ? `Total catalog: ${allProblems.length}` : `Basics topics: ${allProblems.length}`}</span>
          <span>Implemented: {allProblems.filter((problem) => problem.implemented).length}</span>
          <span>Visible: {filtered.length}</span>
          {isLeetCodeTrack && catalogError ? <span>Catalog error: {catalogError}</span> : null}
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

          {isLeetCodeTrack ? (
            <select className="filter-select" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>All</option>
              <option>Implemented</option>
              <option>Catalog Only</option>
            </select>
          ) : (
            <div className="track-note">Basics track includes foundational loop visualizations.</div>
          )}
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
  const [track, setTrack] = useState(TRACKS.LEETCODE)
  const [layoutWidth, setLayoutWidth] = useState('full')

  // Keep browser history in sync so the browser back button works
  useEffect(() => {
    if (active) {
      window.history.pushState({ slug: active.slug }, '', `#${active.slug}`)
    } else {
      window.history.pushState({}, '', window.location.pathname)
    }
  }, [active])

  useEffect(() => {
    const onPop = () => setActive(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // The in-app back button: just set state; the history.pushState in the
  // other effect will update the URL, and popstate won't fire on pushState.
  const goBack = () => setActive(null)

  const handleTrackChange = (nextTrack) => {
    setTrack(nextTrack)
    setActive(null)
  }

  return (
    <div className={`app layout-${layoutWidth}`}>
      <AnimatePresence mode="wait">
        {active
          ? <ProblemPage key={active.id} problem={active} onBack={goBack} layoutWidth={layoutWidth} onLayoutChange={setLayoutWidth} />
          : <HomePage
              key={`home-${track}`}
              track={track}
              onTrackChange={handleTrackChange}
              onSelect={setActive}
              layoutWidth={layoutWidth}
              onLayoutChange={setLayoutWidth}
            />
        }
      </AnimatePresence>
    </div>
  )
}
