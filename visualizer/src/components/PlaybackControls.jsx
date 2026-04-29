import { Fragment } from 'react'

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
  const ButtonGroup = buttonsGroupClassName ? 'div' : Fragment
  const buttonGroupProps = buttonsGroupClassName ? { className: buttonsGroupClassName } : {}
  const resetClasses = [buttonClassName, ghostButtonClassName, iconButtonClassName].filter(Boolean).join(' ')
  const ghostClasses = [buttonClassName, ghostButtonClassName].filter(Boolean).join(' ')
  const playClasses = [buttonClassName, playButtonClassName].filter(Boolean).join(' ')
  const resolvedPlayLabel = isPlaying ? pauseLabel : isDone ? replayLabel : playLabel

  return (
    <div className={className}>
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
        <div className={speedOuterClassName}>
          <div className={speedWrapClassName}>
            <span className={speedLabelClassName}>{speedLabel}</span>
            <input
              className={speedInputClassName}
              type="range"
              min={speedMin}
              max={speedMax}
              step={speedStep}
              value={speedRangeValue}
              onChange={onSpeedChange}
              aria-label={speedAriaLabel}
            />
            {speedIndicator && <span className={speedIndicatorClassName}>{speedIndicator}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
