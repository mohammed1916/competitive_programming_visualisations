import CodeTracePanel from './CodeTracePanel'
import PlaybackControls from './PlaybackControls'
import CodeSnippetChips from './CodeSnippetChips'
import CodeVisualLinkLegend from './CodeVisualLinkLegend'

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
  connectivity = null,
}) {
  const statusClass = statusDone
    ? `${statusClassName} ${statusDoneClassName}`
    : statusClassName

  const codeTrace = (
    <>
      {connectivity?.snippetOptions ? (
        <CodeSnippetChips
          snippets={connectivity.snippetOptions}
          activeSnippetId={connectivity.activeSnippetId}
          onSnippetSelect={connectivity.onSnippetSelect}
        />
      ) : null}
      {connectivity?.linkInfo ? <CodeVisualLinkLegend linkInfo={connectivity.linkInfo} /> : null}
      <CodeTracePanel
        step={step}
        codeLines={codeLines}
        highlightedLines={connectivity?.highlightedLines}
        onLineSelect={connectivity?.onLineSelect}
      />
    </>
  )
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
