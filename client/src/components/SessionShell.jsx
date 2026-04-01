import { useNavigate } from 'react-router-dom'
import BrandMark from './BrandMark'
import { useAuth } from '../context/useAuth'

function SessionShell({
  children,
  eyebrow,
  title,
  subtitle,
  action,
  logoutRedirectTo = '/login',
}) {
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  async function handleLogout() {
    await logout()
    navigate(logoutRedirectTo, { replace: true })
  }

  return (
    <main className="app-shell">
      <section className="shell-topbar">
        <div className="shell-topbar__brand">
          <BrandMark compact />
          <p className="shell-topbar__meta">{user?.email}</p>
        </div>

        <button className="secondary-button secondary-button--tight" onClick={handleLogout} type="button">
          Sign out
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
