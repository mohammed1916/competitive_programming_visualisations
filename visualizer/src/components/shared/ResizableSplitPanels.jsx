import { useEffect, useRef, useState } from 'react'
import './ResizableSplitPanels.css'

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export default function ResizableSplitPanels({
  left,
  right,
  storageKey,
  initialLeftPercent = 60,
  minLeftPx = 280,
  minRightPx = 240,
  className = '',
}) {
  const rootRef = useRef(null)
  const dragRef = useRef(null)
  const [leftPercent, setLeftPercent] = useState(() => {
    if (!storageKey) return initialLeftPercent
    try {
      const stored = Number(window.localStorage.getItem(storageKey))
      if (Number.isFinite(stored)) return clamp(stored, 25, 75)
    } catch {
      // Ignore localStorage read failures.
    }
    return initialLeftPercent
  })

  useEffect(() => {
    if (!storageKey) return
    try {
      window.localStorage.setItem(storageKey, String(leftPercent))
    } catch {
      // Ignore localStorage write failures.
    }
  }, [leftPercent, storageKey])

  useEffect(() => {
    const handleMove = (event) => {
      const state = dragRef.current
      if (!state || !rootRef.current) return
      const rect = rootRef.current.getBoundingClientRect()
      const availableWidth = rect.width - state.dividerWidth
      if (availableWidth <= 0) return
      const rawLeft = event.clientX - rect.left - state.dividerWidth / 2
      const minLeft = Math.min(minLeftPx, availableWidth - minRightPx)
      const maxLeft = Math.max(minLeft, availableWidth - minRightPx)
      const nextLeft = clamp(rawLeft, minLeft, maxLeft)
      const nextPercent = (nextLeft / availableWidth) * 100
      setLeftPercent(clamp(nextPercent, 10, 90))
    }

    const handleUp = () => {
      if (!dragRef.current) return
      dragRef.current = null
      document.body.classList.remove('rsp-resizing')
      document.body.style.cursor = ''
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [minLeftPx, minRightPx])

  const startResize = (event) => {
    if (!rootRef.current) return
    const dividerWidth = 12
    dragRef.current = { dividerWidth }
    document.body.classList.add('rsp-resizing')
    document.body.style.cursor = 'col-resize'
    event.preventDefault()
  }

  return (
    <div className={`rsp ${className}`.trim()} ref={rootRef}>
      <section
        className="rsp-pane rsp-pane-left"
        style={{
          flexBasis: `calc(${leftPercent}% - 6px)`,
          minWidth: `${minLeftPx}px`,
        }}
      >
        {left}
      </section>
      <div
        className="rsp-divider"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
        onPointerDown={startResize}
      >
        <span className="rsp-divider-grip" />
      </div>
      <section className="rsp-pane rsp-pane-right" style={{ minWidth: `${minRightPx}px` }}>
        {right}
      </section>
    </div>
  )
}
