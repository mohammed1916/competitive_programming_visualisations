// Presentational resizer handle used across panels.

// Presentational resizer handle used across panels.
// Props:
// - side: 'left'|'right'|'top'|'bottom'|'corner'|'center' (affects class)
// - className: additional classes
// - onPointerDown: handler for pointer down
export default function ResizerHandle({ side = 'right', className = '', onPointerDown }) {
  const cls = `resize-handle resize-handle--${side} ${className}`.trim()
  // For CodeTracePanel we want the ctp visual class when side === 'center'
  const isCtp = className.includes('ctp') || side === 'center'

  return (
    <div
      className={isCtp ? 'ctp-resizer-handle' : cls}
      onPointerDown={onPointerDown}
      role="separator"
      aria-orientation={side === 'left' || side === 'right' ? 'vertical' : 'horizontal'}
    />
  )
}
