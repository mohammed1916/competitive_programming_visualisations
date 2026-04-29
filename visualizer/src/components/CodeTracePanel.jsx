import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import './CodeTracePanel.css'

export default function CodeTracePanel({
  step,
  codeLines,
  title = 'Solution Code',
  subtitle = null,
  idleLabel = 'Press Play to start',
  activeLabelPrefix = 'Line',
  activeLabelSuffix = 'is active',
}) {
  const codeRef = useRef(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!step?.activeLine || !codeRef.current) return
    const activeLine = codeRef.current.querySelector(`[data-line="${step.activeLine}"]`)
    activeLine?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [step])

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeLines.map(({ text }) => text).join('\n'))
    setCopied(true)
  }

  return (
    <motion.div className="ctp-panel" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22 }}>
      <div className="ctp-head">
        <div>
          <div className="ctp-title">{title}</div>
          <div className="ctp-subtitle">
            {subtitle
              || (step
                ? <>{activeLabelPrefix} <span className="mono ctp-chip">{step.activeLine}</span> {activeLabelSuffix}</>
                : idleLabel)}
          </div>
        </div>
        <button type="button" className={`ctp-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copied ? 'Copied' : 'Copy code'}
        </button>
      </div>

      <div className="ctp-scroll" ref={codeRef}>
        {codeLines.map(({ line, text }) => {
          const isActive = step?.activeLine === line
          const isRelated = step?.relatedLines?.includes(line)
          return (
            <motion.div
              key={line}
              data-line={line}
              className={`ctp-row ${isActive ? 'active' : ''} ${isRelated ? 'related' : ''}`}
              animate={{ x: isActive ? 6 : 0, opacity: isRelated || isActive || !step ? 1 : 0.56 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            >
              <span className="ctp-no mono">{line}</span>
              <code className="ctp-text">{text || ' '}</code>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
