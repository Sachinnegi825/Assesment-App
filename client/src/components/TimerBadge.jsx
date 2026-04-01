import { formatRemainingTime } from '../utils/assessmentEngine'

function TimerBadge({ secondsRemaining }) {
  const isWarning = secondsRemaining <= 300

  return (
    <div
      className={isWarning ? 'timer-badge timer-badge--warning' : 'timer-badge'}
      role="status"
    >
      <span className="timer-badge__label">Time Left</span>
      <strong>{formatRemainingTime(secondsRemaining)}</strong>
    </div>
  )
}

export default TimerBadge
