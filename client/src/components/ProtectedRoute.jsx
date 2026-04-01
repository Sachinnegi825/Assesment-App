import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function ProtectedRoute({
  children,
  allowedRoles = null,
  redirectTo = '/login',
}) {
  const location = useLocation()
  const { isAuthenticated, isAuthLoading, user } = useAuth()
  const isAdminOnlyRoute = allowedRoles?.includes('admin')

  if (isAuthLoading) {
    return (
      <main className="auth-shell">
        <section className="auth-card auth-card--compact">
          <p className="eyebrow">{isAdminOnlyRoute ? 'Restoring admin session' : 'Restoring session'}</p>
          <h1>Checking your access</h1>
          <p className="auth-support-copy">
            {isAdminOnlyRoute
              ? 'Verifying your evaluator access before opening the admin workspace.'
              : 'Verifying your candidate session before loading the dashboard.'}
          </p>
        </section>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location.pathname }} to={redirectTo} />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const fallbackPath = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'
    return <Navigate replace to={fallbackPath} />
  }

  return children
}

export default ProtectedRoute
