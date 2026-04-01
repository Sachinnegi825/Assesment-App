import { Link } from 'react-router-dom'
import SessionShell from '../components/SessionShell'

function DashboardPage() {
  return (
    <SessionShell
      action={
        <Link className="primary-button button-link" to="/candidate-details">
          Start Assessment
        </Link>
      }
      eyebrow="Assessment dashboard"
      subtitle="You are signed in and ready to begin. Start the assessment flow to continue to candidate details."
      title="Dashboard"
    >
      <section className="info-grid">
        <article className="info-card info-card--highlight">
          <p className="info-card__label">Next step</p>
          <h2>Candidate details</h2>
          <p>
            Use the primary action to enter the assessment flow and capture candidate
            information before instructions and questions.
          </p>
        </article>

        <article className="info-card">
          <p className="info-card__label">Session-aware access</p>
          <h2>Protected navigation</h2>
          <p>
            Only authenticated candidates can view the dashboard and move into the
            assessment entry pages.
          </p>
        </article>

        <article className="info-card">
          <p className="info-card__label">Current scope</p>
          <h2>Assessment entry only</h2>
          <p>
            Questions, timers, and submission storage are intentionally deferred to
            later stages.
          </p>
        </article>
      </section>
    </SessionShell>
  )
}

export default DashboardPage
