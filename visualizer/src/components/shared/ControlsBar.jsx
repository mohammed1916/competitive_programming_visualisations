import './ControlsBar.css'

/**
 * Shared playback controls bar.
 *
 * @param {boolean}  isPlaying       - Whether animation is running.
 * @param {boolean}  isDone          - Whether we're on the last step.
 * @param {number}   stepIndex       - Current step index (-1 = not started).
 * @param {Function} onTogglePlay    - Play / Pause / Replay handler.
 * @param {Function} onStepForward   - Advance one step.
 * @param {Function} onStepBack      - Go back one step.
 * @param {Function} onReset         - Reset to the unstarted state.
 * @param {number}   speed           - Current interval ms (higher = slower).
 * @param {Function} onSpeedChange   - Called with new ms value.
 * @param {ReactNode} extra          - Optional extra controls shown to the right.
 */
export function ControlsBar({
  isPlaying,
  isDone,
  stepIndex,
  onTogglePlay,
  onStepForward,
  onStepBack,
  onReset,
  speed,
  onSpeedChange,
  extra = null,
}) {
  return (
    <div className="vis-controls">
      {/* ── Navigation buttons ── */}
      <div className="vis-controls-play">
        <button
          type="button"
          className="vis-btn vis-btn-ghost vis-btn-icon"
          onClick={onReset}
          disabled={stepIndex < 0}
          title="Reset"
          aria-label="Reset to beginning"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>

        <button
          type="button"
          className="vis-btn vis-btn-ghost"
          onClick={onStepBack}
          disabled={stepIndex < 0}
        >
          ‹ Prev
        </button>

        <button
          type="button"
          className="vis-btn vis-btn-play"
          onClick={onTogglePlay}
        >
          {isPlaying ? '⏸ Pause' : isDone ? '↺ Replay' : '▶ Play'}
        </button>

        <button
          type="button"
          className="vis-btn vis-btn-ghost"
          onClick={onStepForward}
          disabled={isDone}
        >
          Next ›
        </button>
      </div>

      {/* ── Speed + optional extra ── */}
      <div className="vis-controls-right">
        <div className="vis-speed-wrap">
          <span className="vis-speed-label">Speed</span>
          <input
            type="range"
            min={80}
            max={1400}
            step={60}
            value={1480 - speed}
            onChange={e => onSpeedChange(1480 - Number(e.target.value))}
            aria-label="Playback speed"
            className="vis-speed-range"
          />
        </div>
        {extra && <div className="vis-controls-extra">{extra}</div>}
      </div>
    </div>
  )
}

export default ControlsBar
