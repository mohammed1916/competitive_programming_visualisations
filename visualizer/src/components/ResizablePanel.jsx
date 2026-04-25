import React, { useEffect, useRef } from 'react'
import './ResizablePanel.css'

export default function ResizablePanel({ width, height, minWidth=320, minHeight=260, maxWidth=1400, maxHeight=1200, onResizeStart, onResize, onResizeEnd, children }) {
  const nodeRef = useRef(null)
  const stateRef = useRef(null)

  useEffect(() => {
    const handleMove = (e) => {
      const s = stateRef.current
      if (!s) return
      if (s.type === 'corner') {
        const dx = e.clientX - s.startX
        const dy = e.clientY - s.startY
        const nextW = Math.max(minWidth, Math.min(maxWidth, s.startWidth + dx))
        const nextH = Math.max(minHeight, Math.min(maxHeight, s.startHeight + dy))
        onResize && onResize({ width: nextW, height: nextH })
        return
      }
      if (s.type === 'right') {
        const dx = e.clientX - s.startX
        const nextW = Math.max(minWidth, Math.min(maxWidth, s.startWidth + dx))
        onResize && onResize({ width: nextW })
        return
      }
      if (s.type === 'top') {
        const dy = e.clientY - s.startY
        const nextH = Math.max(minHeight, Math.min(maxHeight, s.startHeight - dy))
        onResize && onResize({ height: nextH })
        return
      }
    }

    const handleUp = () => {
      if (!stateRef.current) return
      stateRef.current = null
      document.body.classList.remove('resizing-panel')
      document.body.style.cursor = ''
      onResizeEnd && onResizeEnd()
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [minWidth, minHeight, maxWidth, maxHeight, onResize, onResizeEnd])

  const start = (e, type) => {
    e.preventDefault()
    stateRef.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: width,
      startHeight: height,
    }
    document.body.classList.add('resizing-panel')
    if (type === 'right') document.body.style.cursor = 'ew-resize'
    else if (type === 'top') document.body.style.cursor = 'ns-resize'
    else document.body.style.cursor = 'nwse-resize'
    onResizeStart && onResizeStart(type)
  }

  return (
    <div className="resizable-panel" ref={nodeRef} style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}>
      <div className="resizable-children">{children}</div>
      {/* Resizing handles removed per request; keep panel content only. */}
    </div>
  )
}
