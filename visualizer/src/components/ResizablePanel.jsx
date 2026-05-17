import { useEffect, useRef } from 'react'
import './ResizablePanel.css'
import ResizerHandle from './ResizerHandle'

export default function ResizablePanel({ width, height, minWidth=320, minHeight=260, maxWidth=1400, maxHeight=1200, onResizeStart, onResize, onResizeEnd, children, handles = ['left','right','bottom','top','corner'] }) {
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
        onResize && onResize({ width: nextW, height: nextH }, 'corner')
        return
      }
      if (s.type === 'right') {
        const dx = e.clientX - s.startX
        const nextW = Math.max(minWidth, Math.min(maxWidth, s.startWidth + dx))
        onResize && onResize({ width: nextW }, 'right')
        return
      }
      if (s.type === 'left') {
        const dx = e.clientX - s.startX
        const nextW = Math.max(minWidth, Math.min(maxWidth, s.startWidth - dx))
        onResize && onResize({ width: nextW }, 'left')
        return
      }
      if (s.type === 'top') {
        const dy = e.clientY - s.startY
        const nextH = Math.max(minHeight, Math.min(maxHeight, s.startHeight - dy))
        onResize && onResize({ height: nextH }, 'top')
        return
      }
      if (s.type === 'bottom') {
        const dy = e.clientY - s.startY
        const nextH = Math.max(minHeight, Math.min(maxHeight, s.startHeight + dy))
        onResize && onResize({ height: nextH }, 'bottom')
        return
      }
    }

    const handleUp = () => {
      if (!stateRef.current) return
      // Consumers can perform snapping behavior in onResizeEnd if desired.
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
    if (type === 'right' || type === 'left') document.body.style.cursor = 'ew-resize'
    else if (type === 'top' || type === 'bottom') document.body.style.cursor = 'ns-resize'
    else document.body.style.cursor = 'nwse-resize'
    onResizeStart && onResizeStart(type)
  }

  return (
    <div className="resizable-panel" ref={nodeRef} style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}>
      <div className="resizable-children">{children}</div>
      {/* Resizing handles */}
      {handles.includes('right') && (
        <ResizerHandle side="right" onPointerDown={(e) => start(e, 'right')} />
      )}
      {handles.includes('left') && (
        <ResizerHandle side="left" onPointerDown={(e) => start(e, 'left')} />
      )}
      {handles.includes('bottom') && (
        <ResizerHandle side="bottom" onPointerDown={(e) => start(e, 'bottom')} />
      )}
      {handles.includes('top') && (
        <ResizerHandle side="top" onPointerDown={(e) => start(e, 'top')} />
      )}
      {handles.includes('corner') && (
        <ResizerHandle side="corner" onPointerDown={(e) => start(e, 'corner')} />
      )}
    </div>
  )
}
