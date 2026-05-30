import { motion } from 'framer-motion'
import './ProgressBand.css'

/**
 * Shared progress band component — progress track + step counter + phase badge.
 *
 * @param {number}  progress    - Percentage 0-100.
 * @param {number}  stepIndex   - Current step index (-1 = not started).
 * @param {number}  stepCount   - Total number of steps.
 * @param {boolean} isDone      - Whether we're on the last step.
 * @param {string}  resultText  - Optional custom string shown when isDone.
 *                                Defaults to "Done — {stepCount} steps complete".
 * @param {object}  phaseMeta   - Optional { label: string, color: string } for phase badge.
 */
export function ProgressBand({ progress, stepIndex, stepCount, isDone, resultText, phaseMeta }) {
  const counterText = stepIndex < 0
    ? 'Not started — press Play or step forward'
    : isDone
      ? (resultText ?? `Done — ${stepCount} steps complete`)
      : `Step ${stepIndex + 1} / ${stepCount}`

  return (
    <div className="vis-progress-band">
      <div className="vis-progress-track">
        <motion.div
          className="vis-progress-fill"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.14 }}
        />
      </div>
      <div className="vis-step-info">
        <span className="vis-step-counter">{counterText}</span>
        {phaseMeta && (
          <span className={`vis-phase-badge phase-${phaseMeta.color}`}>
            {phaseMeta.label}
          </span>
        )}
      </div>
    </div>
  )
}

export default ProgressBand
