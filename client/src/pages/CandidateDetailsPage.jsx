import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SessionShell from '../components/SessionShell'
import { useAssessment } from '../context/useAssessment'
import { useAuth } from '../context/useAuth'
import { validateCandidateDetails, isCandidateDetailsValid } from '../utils/candidateDetailsValidation'
import { validateCandidateDetailsOnServer } from '../services/api'

function CandidateDetailsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { candidateDetails, saveCandidateDetails } = useAssessment()
const [values, setValues] = useState({
  fullName: "",
  age: "",
  email: "",
  location: "",
  roleApplied: ""
})  
const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConsentOpen, setIsConsentOpen] = useState(false)

  const isFormValid = useMemo(() => isCandidateDetailsValid(values), [values])

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

  function handleBlur(event) {
    const { name } = event.target
    const nextErrors = validateCandidateDetails(values)

    setErrors((current) => ({
      ...current,
      [name]: nextErrors[name] || '',
    }))
  }

  function handleContinueClick() {
    const nextErrors = validateCandidateDetails(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsConsentOpen(true)
  }

  async function handleConsentAgree() {
    try {
      setIsSubmitting(true)
      setSubmitError('')
      setIsConsentOpen(false)

      const payload = await validateCandidateDetailsOnServer(values)
      saveCandidateDetails(payload.candidateDetails)
      navigate('/assessment-instructions', { replace: true })
    } catch (error) {
      setSubmitError(error.message || 'Unable to save candidate details right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SessionShell
      action={
        <Link className="secondary-button button-link" to="/dashboard">
          Back to Dashboard
        </Link>
      }
      eyebrow="Assessment entry"
      subtitle="Complete the applicant intake details before moving to the instructions screen."
      title="Candidate Details"
    >
      <section className="details-layout">
        <article className="details-card">
          <div className="details-card__header">
            <p className="info-card__label">Applicant intake</p>
            <h2>Tell us about the candidate</h2>
            <p>
              These details are stored in session state now so they can be attached to
              the final assessment submission later.
            </p>
          </div>

          <form className="details-form" noValidate>
            <label className="field">
              <span>Full name</span>
              <input
                className={errors.fullName ? 'input input--error' : 'input'}
                name="fullName"
                onBlur={handleBlur}
                onChange={handleChange}
                placeholder="Enter full name"
                type="text"
                value={values.fullName}
                required
              />
              {errors.fullName ? <small className="field-error">{errors.fullName}</small> : null}
            </label>

            <div className="details-form__grid">
              <label className="field">
                <span>Age</span>
                <input
                  className={errors.age ? 'input input--error' : 'input'}
                  inputMode="numeric"
                  name="age"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  placeholder="18"
                  type="text"
                  value={values.age}
                  required
                />
                {errors.age ? <small className="field-error">{errors.age}</small> : null}
              </label>

              <label className="field">
                <span>Email address</span>
                <input
                  autoComplete="email"
                  className={errors.email ? 'input input--error' : 'input'}
                  name="email"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  type="email"
                  value={values.email}
                  required
                />
                {errors.email ? <small className="field-error">{errors.email}</small> : null}
              </label>
            </div>

            <label className="field">
              <span>Location</span>
              <input
                className={errors.location ? 'input input--error' : 'input'}
                name="location"
                onBlur={handleBlur}
                onChange={handleChange}
                placeholder="City, State"
                type="text"
                value={values.location}
              />
              {errors.location ? <small className="field-error">{errors.location}</small> : null}
            </label>

            <label className="field">
              <span>Role / job description applied for</span>
              <textarea
                className={errors.roleApplied ? 'input input--error textarea' : 'input textarea'}
                name="roleApplied"
                onBlur={handleBlur}
                onChange={handleChange}
                placeholder="Product Analyst"
                rows="4"
                value={values.roleApplied}
              />
              {errors.roleApplied ? (
                <small className="field-error">{errors.roleApplied}</small>
              ) : null}
            </label>

            {submitError ? (
              <div className="form-message form-message--error" role="alert">
                {submitError}
              </div>
            ) : null}

            <button
              className="primary-button primary-button--wide"
              disabled={!isFormValid || isSubmitting}
              onClick={handleContinueClick}
              type="button"
            >
              {isSubmitting ? 'Saving details...' : 'Continue to Instructions'}
            </button>
          </form>
        </article>

        <aside className="details-sidecard">
          <p className="info-card__label">Required fields</p>
          <h2>Before the assessment begins</h2>
          <p>
            We collect identity, contact, location, and role context first so the
            assessment record is complete before timing and questions begin.
          </p>
        </aside>
      </section>

      {isConsentOpen ? (
        <div className="consent-modal-backdrop" role="presentation">
          <section
            aria-labelledby="consent-title"
            aria-modal="true"
            className="consent-modal"
            role="dialog"
          >
            <p className="info-card__label">Consent required</p>
            <h2 id="consent-title">Data collection consent</h2>
            <p>
              By agreeing, you confirm that you understand this data is collected
              only for screening identification purposes and will be deleted after
              90 days.
            </p>
            <p>
              Your data will remain safe and will not be shared with any third party
              whatsoever.
            </p>

            <div className="consent-modal__actions">
              <button
                className="secondary-button secondary-button--tight"
                onClick={() => setIsConsentOpen(false)}
                type="button"
              >
                Disagree
              </button>
              <button className="primary-button" onClick={handleConsentAgree} type="button">
                Agree
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </SessionShell>
  )
}

export default CandidateDetailsPage
