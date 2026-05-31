import CodeTracePanel from './CodeTracePanel'
import PlaybackControls from './PlaybackControls'

export default function VisualizerPlaybackSection({
  step,
  codeLines,
  statusClassName,
  statusDone = false,
  statusDoneClassName = 'ok',
  statusMessage,
  fallbackStatus = 'Press Play to begin.',
  playback,
}) {
  const statusClass = statusDone
    ? `${statusClassName} ${statusDoneClassName}`
    : statusClassName

  return (
    <>
      <CodeTracePanel step={step} codeLines={codeLines} />
      <div className={statusClass}>{statusMessage || fallbackStatus}</div>
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
    </>
  )
}
