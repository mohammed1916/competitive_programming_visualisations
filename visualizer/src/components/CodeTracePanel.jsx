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
  const lastManualScrollTsRef = useRef(0)
  const [copied, setCopied] = useState(false)
  const [panelHeight, setPanelHeight] = useState(() => {
    try {
      const v = window.localStorage.getItem('ctp.panelHeight')
      return v ? Number(v) : 420
    } catch {
      return 420
    }
  })
  const isDraggingRef = useRef(false)
  const startYRef = useRef(0)
  const startHeightRef = useRef(panelHeight)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    if (!step?.activeLine || !codeRef.current) return
    if (Date.now() - lastManualScrollTsRef.current < 1200) return
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

  const markManualScroll = () => {
    lastManualScrollTsRef.current = Date.now()
  }

  const startDrag = (e) => {
    e.preventDefault()
    isDraggingRef.current = true
    setIsResizing(true)
    startYRef.current = e.touches ? e.touches[0].clientY : e.clientY
    startHeightRef.current = panelHeight
    document.body.style.userSelect = 'none'
  }

  useEffect(() => {
    const onMove = (e) => {
      if (!isDraggingRef.current) return
      const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY
      const delta = clientY - startYRef.current
      const next = Math.max(120, Math.min(1200, startHeightRef.current + delta))
      setPanelHeight(next)
    }

    const onUp = () => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      setIsResizing(false)
      document.body.style.userSelect = ''
      try { window.localStorage.setItem('ctp.panelHeight', String(panelHeight)) } catch (err) { void err }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchend', onUp)
    }
  }, [panelHeight])

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

      <div className="ctp-scroll" ref={codeRef} onWheel={markManualScroll} onTouchMove={markManualScroll} style={{ height: `${panelHeight}px` }}>
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
      <div
        className={`ctp-resizer ${isResizing ? 'active' : ''}`}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        aria-hidden="true"
      >
        <div className="ctp-resizer-handle" />
      </div>
    </motion.div>
  )
}
