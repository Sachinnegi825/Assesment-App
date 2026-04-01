import { useNavigate } from 'react-router-dom'
import SessionShell from '../components/SessionShell'
import { useAssessment } from '../context/useAssessment'
import { useAuth } from '../context/useAuth'

function ThankYouPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { submissionSnapshot } = useAssessment()

  async function handleExit() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <SessionShell
      action={
        <button className="secondary-button button-link" onClick={handleExit} type="button">
          Exit
        </button>
      }
      eyebrow="Assessment complete"
      subtitle="Thank you for completing the assessment. Your response has been received and the session is now closed."
      title="Thank You"
    >
      <section className="completion-layout">
        <article className="completion-card completion-card--success">
          <p className="info-card__label">Submission status</p>
          <h2>Response received</h2>
          <p>
            Thank you for your time. Your assessment has been submitted successfully.
          </p>
          <p>
            Submission reason:{' '}
            {submissionSnapshot?.reason === 'timer_expired'
              ? 'Timer expired'
              : 'Manual submit'}
          </p>
          <p>{submissionSnapshot?.submittedAt || 'No submission timestamp recorded.'}</p>
        </article>

        <article className="completion-card">
          <p className="info-card__label">What happens next</p>
          <h2>We will review your submission</h2>
          <p>
            Our team will use your response for screening and identification review.
          </p>
          <p>
            You may now exit this session safely.
          </p>
        </article>
      </section>
    </SessionShell>
  )
}

export default ThankYouPage
