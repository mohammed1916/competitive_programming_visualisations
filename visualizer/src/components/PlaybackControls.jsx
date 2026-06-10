import { Fragment, useRef, useState, useEffect } from 'react'
import './PlaybackControls.css'

const LAYOUT_ZONES = {
  topLeft: { name: 'Code Panel', label: 'CODE', row: 0, col: 0 },
  topCenter: { name: 'Visualization', label: 'VIZ', row: 0, col: 1 },
  topRight: { name: 'Problem Info', label: 'INFO', row: 0, col: 2 },
  bottomLeft: { name: 'Console / Output', label: 'OUTPUT', row: 1, col: 0 },
  bottomCenter: { name: 'Details Panel', label: 'DETAILS', row: 1, col: 1 },
  bottomRight: { name: 'Chat / Hints', label: 'CHAT', row: 1, col: 2 },
}

export default function PlaybackControls({
  className,
  buttonsGroupClassName,
  speedOuterClassName,
  speedWrapClassName,
  speedLabelClassName,
  speedInputClassName,
  speedIndicatorClassName,
  buttonClassName,
  ghostButtonClassName,
  playButtonClassName,
  iconButtonClassName,
  onReset,
  onPrev,
  onPlayToggle,
  onNext,
  resetDisabled,
  prevDisabled,
  nextDisabled,
  isPlaying,
  isDone,
  resetLabel = 'Reset',
  prevLabel = 'Prev',
  nextLabel = 'Next',
  playLabel = 'Play',
  pauseLabel = 'Pause',
  replayLabel = 'Replay',
  renderResetContent,
  resetTitle,
  leftSlot = null,
  middleSlot = null,
  speedLabel = 'Speed',
  speed,
  onSpeedChange,
  speedMin = 80,
  speedMax = 1400,
  speedStep = 60,
  speedRangeValue,
  speedAriaLabel = 'Playback speed',
  speedIndicator = null,
  showSpeed = true,
}) {
  const [x, setX] = useState(0)
  const [y, setY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [hoveredRegion, setHoveredRegion] = useState(null)
  const dragRef = useRef(null)

  const getClosestZone = (mouseX, mouseY) => {
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    const previewWidth = 600
    const previewHeight = 400
    const startX = centerX - previewWidth / 2
    const startY = centerY - previewHeight / 2

    const cellWidth = previewWidth / 3
    const cellHeight = previewHeight / 2

    let closest = null
    let minDistance = Infinity

    Object.entries(LAYOUT_ZONES).forEach(([key, zone]) => {
      const zoneX = startX + zone.col * cellWidth + cellWidth / 2
      const zoneY = startY + zone.row * cellHeight + cellHeight / 2
      const distance = Math.sqrt(Math.pow(mouseX - zoneX, 2) + Math.pow(mouseY - zoneY, 2))

      if (distance < minDistance) {
        minDistance = distance
        closest = key
      }
    })

    return closest
  }

  const handleMouseDown = (e) => {
    if (dragRef.current) {
      setIsDragging(true)
      setOffset({
        x: e.clientX - x,
        y: e.clientY - y,
      })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      setX(e.clientX - offset.x)
      setY(e.clientY - offset.y)
      const zone = getClosestZone(e.clientX, e.clientY)
      setHoveredRegion(zone)
    }
  }

  const handleMouseUp = () => {
    if (hoveredRegion) {
      snapToZone(hoveredRegion)
    }
    setIsDragging(false)
    setHoveredRegion(null)
  }

  const snapToZone = (zoneKey) => {
    const zone = LAYOUT_ZONES[zoneKey]
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    const previewWidth = 600
    const previewHeight = 400
    const startX = centerX - previewWidth / 2
    const startY = centerY - previewHeight / 2

    const cellWidth = previewWidth / 3
    const cellHeight = previewHeight / 2

    const newX = startX + zone.col * cellWidth + cellWidth / 2 - 30
    const newY = startY + zone.row * cellHeight + cellHeight / 2 - 15

    setX(newX)
    setY(newY)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, offset, hoveredRegion])

  const resolvedRootClass = className || 'pc'
  const resolvedButtonsGroupClass = buttonsGroupClassName || 'pc-buttons'
  const resolvedSpeedOuterClass = speedOuterClassName || 'pc-speed-outer'
  const resolvedSpeedWrapClass = speedWrapClassName || 'pc-speed-wrap'
  const resolvedSpeedLabelClass = speedLabelClassName || 'pc-speed-label'
  const resolvedSpeedInputClass = speedInputClassName || 'pc-speed-input'
  const resolvedSpeedIndicatorClass = speedIndicatorClassName || 'pc-speed-indicator'
  const ButtonGroup = resolvedButtonsGroupClass ? 'div' : Fragment
  const buttonGroupProps = resolvedButtonsGroupClass ? { className: resolvedButtonsGroupClass } : {}
  const resetClasses = [buttonClassName || 'pc-btn', ghostButtonClassName || 'pc-btn-ghost', iconButtonClassName].filter(Boolean).join(' ')
  const ghostClasses = [buttonClassName || 'pc-btn', ghostButtonClassName || 'pc-btn-ghost'].filter(Boolean).join(' ')
  const playClasses = [buttonClassName || 'pc-btn', playButtonClassName || 'pc-btn-play'].filter(Boolean).join(' ')
  const resolvedPlayLabel = isPlaying ? pauseLabel : isDone ? replayLabel : playLabel

  return (
    <>
      {isDragging && (
        <div className="pc-layout-preview-wrapper">
          <div className="pc-layout-preview">
            <div className="pc-layout-grid">
              {Object.entries(LAYOUT_ZONES).map(([key, zone]) => {
                const isHovered = key === hoveredRegion
                return (
                  <div
                    key={key}
                    className={`pc-zone ${isHovered ? 'hovered' : ''}`}
                    style={{
                      gridRow: zone.row + 1,
                      gridColumn: zone.col + 1,
                    }}>
                    <div className="pc-zone-inner">
                      <div className="pc-zone-label">{zone.label}</div>
                      <div className="pc-zone-name">{zone.name}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="pc-preview-title">Drop Panel Here</div>
          </div>
          <div className="pc-preview-backdrop" />
        </div>
      )}

      <div
        ref={dragRef}
        className={resolvedRootClass}
        style={{
          position: 'fixed',
          left: `${x}px`,
          top: `${y}px`,
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid #ccc',
          borderRadius: '8px',
          overflow: 'hidden',
          opacity: isDragging ? 0.7 : 1,
          transform: isDragging ? 'scale(0.85)' : 'scale(1)',
          transition: isDragging ? 'none' : 'all 0.3s ease',
        }}>
        <div
          className="pc-drag-handle"
          onMouseDown={handleMouseDown}
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            padding: '6px 12px',
            backgroundColor: 'rgba(220, 220, 220, 0.3)',
            borderBottom: '1px solid #ddd',
            userSelect: 'none',
            fontSize: '12px',
            fontWeight: '600',
            color: '#0f172a',
          }}>
          ≡ Playback Controls
        </div>

        {!isDragging ? (
          <div style={{ padding: '8px' }}>
            <ButtonGroup {...buttonGroupProps}>
              {leftSlot}
              <button type="button" className={resetClasses} onClick={onReset} disabled={resetDisabled} title={resetTitle}>
                {renderResetContent ? renderResetContent() : resetLabel}
              </button>
              <button type="button" className={ghostClasses} onClick={onPrev} disabled={prevDisabled}>{prevLabel}</button>
              <button type="button" className={playClasses} onClick={onPlayToggle}>{resolvedPlayLabel}</button>
              <button type="button" className={ghostClasses} onClick={onNext} disabled={nextDisabled}>{nextLabel}</button>
            </ButtonGroup>

            {middleSlot}

            {showSpeed && (
              <div className={resolvedSpeedOuterClass}>
                <div className={resolvedSpeedWrapClass}>
                  <span className={resolvedSpeedLabelClass}>{speedLabel}</span>
                  <input
                    className={resolvedSpeedInputClass}
                    type="range"
                    min={speedMin}
                    max={speedMax}
                    step={speedStep}
                    value={speedRangeValue ?? speed}
                    onChange={onSpeedChange}
                    aria-label={speedAriaLabel}
                  />
                  {speedIndicator && <span className={resolvedSpeedIndicatorClass}>{speedIndicator}</span>}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </>
  )
}
