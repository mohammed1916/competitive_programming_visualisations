import CodeTracePanel from './CodeTracePanel'
import PlaybackControls from './PlaybackControls'

export default function VisualizerPlaybackSection({
  step,
  codeLines,
  codeTraceContainerClassName,
  statusClassName,
  statusDone = false,
  statusDoneClassName = 'ok',
  statusMessage,
  fallbackStatus = 'Press Play to begin.',
  controlsContainerClassName,
  playback,
}) {
  const statusClass = statusDone
    ? `${statusClassName} ${statusDoneClassName}`
    : statusClassName

  const codeTrace = <CodeTracePanel step={step} codeLines={codeLines} />
  const controls = (
    <PlaybackControls
      isPlaying={playback.isPlaying}
      isDone={playback.isDone}
      speed={playback.speed}
      onPlayToggle={playback.togglePlay}
      onPrev={playback.stepBack}
      onNext={playback.stepForward}
      onReset={playback.handleReset}
      prevDisabled={playback.stepIndex < 0}
      nextDisabled={playback.isDone}
      resetDisabled={playback.stepIndex < 0}
      onSpeedChange={(event) => playback.setSpeed(Number(event.target.value))}
    />
  )

  return (
    <>
      {codeTraceContainerClassName ? <div className={codeTraceContainerClassName}>{codeTrace}</div> : codeTrace}
      <div className={statusClass}>{statusMessage || fallbackStatus}</div>
      {controlsContainerClassName ? <div className={controlsContainerClassName}>{controls}</div> : controls}
    </>
  )
}
