import { Fragment } from 'react'
import './PlaybackControls.css'

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
    <div className={resolvedRootClass}>
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
  )
}
