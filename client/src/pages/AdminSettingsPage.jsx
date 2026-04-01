import { useState } from 'react'
import { Link } from 'react-router-dom'
import AdminWorkspaceNav from '../components/AdminWorkspaceNav'
import SessionShell from '../components/SessionShell'
import { changeAdminPassword } from '../services/api'
import { validateAdminPasswordForm } from '../utils/adminPasswordValidation'

function AdminSettingsPage() {
  const [values, setValues] = useState({
    confirmNewPassword: '',
    currentPassword: '',
    newPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

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
    setSuccessMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = validateAdminPasswordForm(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError('')
      setSuccessMessage('')

      const payload = await changeAdminPassword(values)

      setValues({
        confirmNewPassword: '',
        currentPassword: '',
        newPassword: '',
      })
      setSuccessMessage(payload.message || 'Admin password updated successfully.')
    } catch (error) {
      if (error.details) {
        setErrors((current) => ({
          ...current,
          ...error.details,
        }))
      }
      setSubmitError(error.message || 'Password could not be updated.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SessionShell
      action={
        <Link className="secondary-button secondary-button--tight" to="/admin/dashboard">
          Back to Dashboard
        </Link>
      }
      eyebrow="Evaluator workspace"
      logoutRedirectTo="/admin/login"
      subtitle="Protect evaluator access by rotating the admin password with current-password verification and strong password rules."
      title="Admin Settings"
    >
      <AdminWorkspaceNav />

      <section className="dashboard-grid dashboard-grid--single">
        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <p className="info-card__label">Account security</p>
              <h2>Change admin password</h2>
              <p className="dashboard-panel__copy">
                Use a strong replacement password. The current password is always
                required before changes are saved.
              </p>
            </div>
          </div>

          <form className="admin-settings-form" noValidate onSubmit={handleSubmit}>
            <label className="field">
              <span>Current password</span>
              <input
                autoComplete="current-password"
                className={errors.currentPassword ? 'input input--error' : 'input'}
                name="currentPassword"
                onChange={handleChange}
                placeholder="Enter current password"
                type="password"
                value={values.currentPassword}
              />
              {errors.currentPassword ? (
                <small className="field-error">{errors.currentPassword}</small>
              ) : null}
            </label>

            <label className="field">
              <span>New password</span>
              <input
                autoComplete="new-password"
                className={errors.newPassword ? 'input input--error' : 'input'}
                name="newPassword"
                onChange={handleChange}
                placeholder="Use 12+ chars with upper, lower, number, symbol"
                type="password"
                value={values.newPassword}
              />
              {errors.newPassword ? (
                <small className="field-error">{errors.newPassword}</small>
              ) : null}
            </label>

            <label className="field">
              <span>Confirm new password</span>
              <input
                autoComplete="new-password"
                className={errors.confirmNewPassword ? 'input input--error' : 'input'}
                name="confirmNewPassword"
                onChange={handleChange}
                placeholder="Re-enter the new password"
                type="password"
                value={values.confirmNewPassword}
              />
              {errors.confirmNewPassword ? (
                <small className="field-error">{errors.confirmNewPassword}</small>
              ) : null}
            </label>

            <div className="admin-password-rules">
              <p className="info-card__label">Password rules</p>
              <ul className="dashboard-list">
                <li>At least 12 characters</li>
                <li>At least one uppercase letter and one lowercase letter</li>
                <li>At least one number and one special character</li>
                <li>Must be different from the current password</li>
              </ul>
            </div>

            {submitError ? (
              <div className="form-message form-message--error" role="alert">
                {submitError}
              </div>
            ) : null}

            {successMessage ? (
              <div className="form-message form-message--info" role="status">
                {successMessage}
              </div>
            ) : null}

            <div className="admin-filter-actions">
              <button
                className="primary-button primary-button--admin"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Updating password...' : 'Update password'}
              </button>
              <Link className="secondary-button secondary-button--tight" to="/admin/submissions">
                Review submissions
              </Link>
            </div>
          </form>
        </article>
      </section>
    </SessionShell>
  )
}

export default AdminSettingsPage
