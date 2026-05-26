import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import './CodePanel.css'

/**
 * Shared code-panel component.
 *
 * Scroll fix: uses `behavior: 'auto'` (instant) and only scrolls when the
 * active line is NOT already fully visible. This prevents queued smooth-scroll
 * animations from fighting with user-initiated scroll after pausing.
 *
 * @param {Array}    code         - Array of { line: number, text: string }.
 * @param {object}   step         - Current step with activeLine / relatedLines, or null.
 * @param {string}   title        - Panel header text. Defaults to "Solution Code".
 * @param {Function} getRowExtra  - Optional (line, step) => string of extra CSS classes
 *                                  appended to each row. Used by CourseSchedule for
 *                                  access/push/failure-related/failure-active states.
 */
export function CodePanel({ code, step, title = 'Solution Code', getRowExtra }) {
  const scrollRef = useRef(null)
  const [copied, setCopied] = useState(false)

  // ── Scroll fix ──────────────────────────────────────────────────────────────
  // Only scroll when the active line is out of view, and use 'auto' (instant)
  // so no smooth-scroll animation is left in-flight when the user pauses.
  useEffect(() => {
    if (!step?.activeLine || !scrollRef.current) return
    const el = scrollRef.current.querySelector(`[data-line="${step.activeLine}"]`)
    if (!el) return

    const container = scrollRef.current
    const elTop    = el.offsetTop
    const elBottom = elTop + el.offsetHeight
    const ctTop    = container.scrollTop
    const ctBottom = ctTop + container.clientHeight

    const isFullyVisible = elTop >= ctTop && elBottom <= ctBottom
    if (!isFullyVisible) {
      el.scrollIntoView({ block: 'nearest', behavior: 'auto' })
    }
  }, [step])

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(t)
  }, [copied])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code.map(({ text }) => text).join('\n'))
    setCopied(true)
  }

  return (
    <motion.div
      className="shared-code-panel"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22 }}
    >
      {/* ── Header ── */}
      <div className="shared-code-head">
        <div>
          <div className="shared-code-section-label">{title}</div>
          <div className="shared-code-subtitle">
            {step
              ? <>Line <span className="mono shared-code-chip">{step.activeLine}</span> active</>
              : 'Press Play to start'}
          </div>
        </div>
        <button
          type="button"
          className={`shared-copy-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          title="Copy code to clipboard"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* ── Code lines ── */}
      <div className="shared-code-scroll" ref={scrollRef}>
        {code.map(({ line, text }) => {
          const isActive  = step?.activeLine === line
          const isRelated = step?.relatedLines?.includes(line)
          const extra     = getRowExtra ? (getRowExtra(line, step) ?? '') : ''
          return (
            <motion.div
              key={line}
              data-line={line}
              className={[
                'shared-code-row',
                isActive  ? 'active'  : '',
                isRelated ? 'related' : '',
                extra,
              ].filter(Boolean).join(' ')}
              animate={{
                x: isActive ? 6 : 0,
                opacity: isActive || isRelated || !step ? 1 : 0.52,
              }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            >
              <span className="shared-code-no mono">{line}</span>
              <code className="shared-code-text">{text || ' '}</code>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default CodePanel
