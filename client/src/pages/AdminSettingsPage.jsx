import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminWorkspaceNav from '../components/AdminWorkspaceNav'
import SessionShell from '../components/SessionShell'
import { useAuth } from '../context/useAuth'
import { changeAdminPassword, fetchAdminSettings, updateAdminSettings } from '../services/api'
import { validateAdminPasswordForm } from '../utils/adminPasswordValidation'

function AdminSettingsPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [values, setValues] = useState({
    confirmNewPassword: '',
    currentPassword: '',
    newPassword: '',
  })
  const [settings, setSettings] = useState({
    registrationCap: 100,
    qualifyingThreshold: 60,
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [settingsError, setSettingsError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [settingsSuccess, setSettingsSuccess] = useState('')

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetchAdminSettings()
        if (response.success) {
          setSettings({
            registrationCap: response.data.registrationCap,
            qualifyingThreshold: response.data.qualifyingThreshold,
          })
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
    loadSettings()
  }, [])

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

  function handleSettingsChange(event) {
    const { name, value } = event.target
    setSettings((current) => ({
      ...current,
      [name]: value,
    }))
    setSettingsError('')
    setSettingsSuccess('')
  }

  async function handleSettingsSubmit(event) {
    event.preventDefault()
    try {
      setIsUpdatingSettings(true)
      setSettingsError('')
      setSettingsSuccess('')

      const response = await updateAdminSettings(settings)
      if (response.success) {
        setSettingsSuccess('Assessment configurations updated successfully.')
      }
    } catch (error) {
      setSettingsError(error.message || 'Failed to update settings.')
    } finally {
      setIsUpdatingSettings(false)
    }
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
      setSuccessMessage(payload.message || 'Admin password updated successfully. Signing out...')

      // Delay briefly so the user sees the success message before logout/redirect
      setTimeout(async () => {
        await logout()
        navigate('/admin/login', {
          replace: true,
          state: { message: 'Your password was changed successfully. Please sign in with your new password.' },
        })
      }, 1500)
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
        {/* Global Assessment Configuration */}
        <article className="dashboard-panel" style={{ marginBottom: '2rem' }}>
          <div className="dashboard-panel__header">
            <div>
              <p className="info-card__label">System configuration</p>
              <h2>Assessment settings</h2>
              <p className="dashboard-panel__copy">
                Manage global limits and thresholds for all candidates.
              </p>
            </div>
          </div>

          <form className="admin-settings-form" noValidate onSubmit={handleSettingsSubmit}>
            <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              <label className="field">
                <span>Registration cap (Max participants)</span>
                <input
                  className="input"
                  name="registrationCap"
                  onChange={handleSettingsChange}
                  placeholder="e.g. 100"
                  type="number"
                  value={settings.registrationCap}
                />
                <small className="field-hint">Maximum number of candidates allowed to submit.</small>
              </label>

              <label className="field">
                <span>Qualifying threshold (%)</span>
                <input
                  className="input"
                  max="100"
                  min="0"
                  name="qualifyingThreshold"
                  onChange={handleSettingsChange}
                  placeholder="e.g. 60"
                  type="number"
                  value={settings.qualifyingThreshold}
                />
                <small className="field-hint">Minimum percentage score required to pass.</small>
              </label>
            </div>

            {settingsError ? (
              <div className="form-message form-message--error" role="alert">
                {settingsError}
              </div>
            ) : null}

            {settingsSuccess ? (
              <div className="form-message form-message--info" role="status">
                {settingsSuccess}
              </div>
            ) : null}

            <div className="admin-filter-actions">
              <button
                className="primary-button primary-button--admin"
                disabled={isUpdatingSettings}
                type="submit"
              >
                {isUpdatingSettings ? 'Saving...' : 'Save configurations'}
              </button>
            </div>
          </form>
        </article>

        {/* Account Security */}
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
