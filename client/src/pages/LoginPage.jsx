import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { BRAND_LINE } from '../config/constants'
import BrandMark from '../components/BrandMark'
import { useAuth } from '../context/useAuth'
import { validateLoginForm } from '../utils/loginValidation'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isAuthLoading, login, googleLogin, user } = useAuth()
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectTarget = location.state?.from || '/dashboard'

  if (isAuthenticated) {
    return <Navigate replace to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} />
  }

  function handleChange(event) {
    const { name, value } = event.target

    setValues((current) => ({
      ...current,
      [name]: value,
    }))
    setErrors((current) => ({
      ...current,
      [name]: '',
    }))
    setSubmitError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = validateLoginForm(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError('')
      await login({
        email: values.email.trim(),
        password: values.password,
      })
      navigate(redirectTarget, { replace: true })
    } catch (error) {
      setSubmitError(error.message || 'Unable to sign in with those credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    try {
      setIsSubmitting(true)
      setSubmitError('')
      await googleLogin(credentialResponse.credential)
      navigate(redirectTarget, { replace: true })
    } catch (error) {
      setSubmitError(error.message || 'Google login failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleGoogleError() {
    setSubmitError('Google login was unsuccessful. Please try again.')
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-card__header">
          <BrandMark compact />
          <p className="eyebrow">{BRAND_LINE}</p>
          <h1>Candidate login</h1>
          <p className="auth-support-copy">
            Sign in with your assigned assessment credentials to continue.
          </p>
        </div>

        <div className="google-auth-container" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            theme="filled_blue"
            shape="rectangular"
            width="100%"
          />
        </div>

        <div className="auth-separator" style={{ margin: '1.5rem 0', textAlign: 'center', position: 'relative' }}>
          <span style={{ background: 'white', padding: '0 0.75rem', color: '#666', fontSize: '0.875rem' }}>or sign in with email</span>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#eee', zIndex: -1 }}></div>
        </div>

        <form className="auth-form" noValidate onSubmit={handleSubmit}>
          <label className="field">
            <span>Email address</span>
            <input
              autoComplete="email"
              className={errors.email ? 'input input--error' : 'input'}
              name="email"
              onChange={handleChange}
              placeholder="your@email.com"
              type="email"
              value={values.email}
            />
            {errors.email ? <small className="field-error">{errors.email}</small> : null}
          </label>

          <label className="field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              className={errors.password ? 'input input--error' : 'input'}
              name="password"
              onChange={handleChange}
              placeholder="Enter your password"
              type="password"
              value={values.password}
            />
            {errors.password ? (
              <small className="field-error">{errors.password}</small>
            ) : null}
          </label>

          {submitError ? (
            <div className="form-message form-message--error" role="alert">
              {submitError}
            </div>
          ) : null}

          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Signing in...' : 'Continue to dashboard'}
          </button>
        </form>

        <Link className="auth-inline-link" to="/admin/login">
          Sign in as an evaluator
        </Link>
      </section>
    </main>
  )
}

export default LoginPage
