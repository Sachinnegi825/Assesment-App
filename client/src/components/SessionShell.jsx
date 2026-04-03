import { useNavigate, useLocation } from 'react-router-dom'
import BrandMark from './BrandMark'
import { useAuth } from '../context/useAuth'
import { useAssessment } from '../context/useAssessment'

function SessionShell({
  children,
  eyebrow,
  title,
  subtitle,
  action,
  logoutRedirectTo = '/login',
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAuth()
  const { assessmentSession, submitAssessment, completionState } = useAssessment()

  const isAssessmentPage = location.pathname === '/assessment'
  const isSubmitting = completionState.status === 'submitting'

  async function handleLogout() {
    if (isSubmitting) {
      return
    }

    try {
      // If the user is on the assessment page and hasn't submitted yet, auto-submit
      if (isAssessmentPage && assessmentSession && assessmentSession.status !== 'submitted') {
        try {
          await submitAssessment('auto_submit_on_logout')
        } catch (error) {
          console.error('Auto-submission failed during logout', error)
        }
      }
    } finally {
      await logout()
      navigate(logoutRedirectTo, { replace: true })
    }
  }

  return (
    <main className="app-shell">
      <section className="shell-topbar">
        <div className="shell-topbar__brand">
          <BrandMark compact />
          <p className="shell-topbar__meta">{user?.email}</p>
        </div>

        <button
          className="secondary-button secondary-button--tight"
          disabled={isSubmitting}
          onClick={handleLogout}
          type="button"
        >
          {isSubmitting ? 'Saving...' : 'Sign out'}
        </button>
      </section>

      <section className="hero-panel">
        <div className="hero-panel__copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="hero-panel__subtitle">{subtitle}</p>
        </div>

        <article className="status-card status-card--success">
          <p className="status-card__eyebrow">Session active</p>
          <h2>{user?.name || 'Candidate'}</h2>
          <p>{user?.email}</p>
          {action}
        </article>
      </section>

      {children}
    </main>
  )
}

export default SessionShell
