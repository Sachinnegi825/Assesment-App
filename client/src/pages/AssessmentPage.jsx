import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import TimerBadge from '../components/TimerBadge'
import SessionShell from '../components/SessionShell'
import { useAssessment } from '../context/useAssessment'
import { getAnsweredCount, getSecondsRemaining } from '../utils/assessmentEngine'
import { useSecurityHooks } from '../hooks/useSecurityHooks'
import ViolationModal from '../components/ViolationModal'
import FaceProctor from '../components/FaceProctor'

function AssessmentPage() {
  const navigate = useNavigate()
  const {
    answers,
    assessmentDefinition,
    assessmentSession,
    autoSubmit,
    completionState,
    currentQuestionIndex,
    goToQuestion,
    setAnswer,
    submitAssessment,
    recordViolation,
    activeViolation,
    setActiveViolation,
    syncProgress,
    VIOLATION_LIMIT,
  } = useAssessment()

  const { metadata, questions } = assessmentDefinition
  const [secondsRemaining, setSecondsRemaining] = useState(() => getSecondsRemaining(assessmentSession))

  const currentQuestion = questions[currentQuestionIndex]
  const selectedOptionId = answers[currentQuestion?.id]
  const answeredCount = getAnsweredCount(answers)
  const progressPercent = Math.round((answeredCount / questions.length) * 100)
  const isFirstQuestion = currentQuestionIndex === 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const isSubmitting = completionState.status === 'submitting'
  const isExpired = secondsRemaining === 0
  const submitError = completionState.status === 'error' ? completionState.message : ''
  const isTestActive = assessmentSession && assessmentSession.status !== 'submitted'

  // Show proctor only if test is active and we aren't currently submitting
  const shouldShowProctor = isTestActive && !isSubmitting && completionState.status !== 'success'
  
  // Show red warning if less than 5 minutes (300 seconds) remain
  const isTimeUrgent = secondsRemaining > 0 && secondsRemaining <= 300

  useSecurityHooks(isTestActive, recordViolation, syncProgress)

  useEffect(() => {
    setSecondsRemaining(getSecondsRemaining(assessmentSession))
  }, [assessmentSession])

  useEffect(() => {
    if (!assessmentSession) return
    const intervalId = window.setInterval(() => {
      const nextRemaining = getSecondsRemaining(assessmentSession)
      setSecondsRemaining(nextRemaining)
      if (nextRemaining === 0) window.clearInterval(intervalId)
    }, 1000)
    return () => window.clearInterval(intervalId)
  }, [assessmentSession])

  useEffect(() => {
    if (secondsRemaining !== 0 || isSubmitting || !assessmentSession || completionState.status === 'success') return
    async function handleExpiry() {
      try {
        await submitAssessment('timer_expired')
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
        navigate('/thank-you', { replace: true })
      } catch (err) {
        console.error("Auto-expiry submission failed", err)
      }
    }
    handleExpiry()
  }, [assessmentSession, completionState.status, isSubmitting, navigate, secondsRemaining, submitAssessment])

  useEffect(() => {
    function handleBeforeUnload(event) {
      if (!assessmentSession || assessmentSession.status === 'submitted') return
      event.preventDefault()
      event.returnValue = 'Assessment in progress. Leaving will save your state.'
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [assessmentSession])

  if (!assessmentSession) return <Navigate replace to="/assessment-instructions" />
  if (assessmentSession.status === 'submitted' || completionState.status === 'success') return <Navigate replace to="/thank-you" />

  function handleSelect(optionId) {
    setAnswer(currentQuestion.id, optionId)
  }

  function handlePrevious() {
    if (!isFirstQuestion) goToQuestion(currentQuestionIndex - 1)
  }

  function handleNext() {
    if (!isLastQuestion) goToQuestion(currentQuestionIndex + 1)
  }

  const handleReturnToTest = () => {
    setActiveViolation(null)
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    }
  }

  async function handleSubmit() {
    try {
      await submitAssessment('manual_submit')
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {})
      }
      navigate('/thank-you', { replace: true })
    } catch (error) {
      console.error("Manual submission failed", error)
    }
  }

  return (
    <>
      {activeViolation && (
        <ViolationModal 
          violation={activeViolation} 
          onConfirm={handleReturnToTest} 
          limit={VIOLATION_LIMIT} 
        />
      )}

      {shouldShowProctor && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          background: 'white',
          padding: '10px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          textAlign: 'center'
        }}>
          <FaceProctor onViolation={recordViolation} />
          <p style={{ fontSize: '10px', margin: '5px 0 0', fontWeight: 'bold', color: 'var(--primary-color)' }}>AI MONITORING ACTIVE</p>
        </div>
      )}

      <SessionShell
        action={<TimerBadge secondsRemaining={secondsRemaining} />}
        eyebrow="Assessment in progress"
        subtitle="Move question by question. Selections are preserved while you navigate."
        title={metadata.assessmentTitle}
      >
        {isTimeUrgent && !isSubmitting && (
          <div style={{
            background: '#fee2e2',
            border: '2px solid #ef4444',
            color: '#b91c1c',
            padding: '16px',
            borderRadius: '12px',
            margin: '0 2rem 2rem 2rem',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            animation: 'pulse 2s infinite'
          }}>
            ⚠️ CRITICAL: Less than 5 minutes remaining! Complete your answers and submit now.
          </div>
        )}

        <section className="assessment-overview">
          <article className="info-card info-card--highlight">
            <p className="info-card__label">Progress</p>
            <h2>Question {currentQuestionIndex + 1} of {questions.length}</h2>
            <div aria-hidden="true" className="progress-track">
              <div className="progress-track__bar" style={{ width: `${progressPercent}%` }} />
            </div>
            <p>{answeredCount} answered so far.</p>
          </article>

          <article className="info-card">
            <p className="info-card__label">Security Status</p>
            <h2>Environment Locked</h2>
            <p>Full-screen and AI proctoring are active. Violations are logged automatically.</p>
          </article>
        </section>

        <section className="assessment-layout">
          <article className="question-card">
            <div className="question-card__meta">
              <p className="info-card__label">{currentQuestion.section} · {currentQuestion.topic}</p>
              <h2>{currentQuestion.prompt}</h2>
            </div>

            <div className="option-list" role="radiogroup">
              {currentQuestion.options.map((option) => {
                const isActive = selectedOptionId === option.id
                return (
                  <button
                    aria-checked={isActive}
                    className={isActive ? 'option-button option-button--active' : 'option-button'}
                    disabled={isSubmitting || isExpired}
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    role="radio"
                    type="button"
                  >
                    <span className="option-button__indicator"><span className="option-button__inner" /></span>
                    <span className="option-button__label">{option.label}</span>
                  </button>
                )
              })}
            </div>

            {submitError && <div className="form-message form-message--error" role="alert" style={{ marginBottom: '1rem' }}>{submitError}</div>}
            
            {isSubmitting && (
              <div className="form-message form-message--info" role="status" style={{ marginBottom: '1rem' }}>
                Finalizing submission and closing secure environment...
              </div>
            )}

            <div className="question-actions">
              <button
                className="secondary-button secondary-button--tight"
                disabled={isFirstQuestion || isSubmitting || isExpired}
                onClick={handlePrevious}
                type="button"
              >
                Previous
              </button>
              <div className="question-actions__right">
                {!isLastQuestion ? (
                  <button className="primary-button" disabled={isSubmitting || isExpired} onClick={handleNext} type="button">Next</button>
                ) : (
                  <button className="primary-button" disabled={isSubmitting || isExpired} onClick={handleSubmit} type="button">
                    {isSubmitting ? 'Submitting...' : 'Submit & Exit'}
                  </button>
                )}
              </div>
            </div>
          </article>

          <aside className="question-sidebar">
            <div className="sidebar-stats">
              <div className="stat-row"><span className="stat-dot stat-dot--answered" /><span>{answeredCount} Answered</span></div>
              <div className="stat-row"><span className="stat-dot stat-dot--pending" /><span>{questions.length - answeredCount} Pending</span></div>
            </div>
            <p className="info-card__label">Question map</p>
            <div className="question-map">
              {questions.map((question, index) => {
                const isCurrent = index === currentQuestionIndex
                const isAnswered = Boolean(answers[question.id])
                const className = ['question-chip', isCurrent ? 'question-chip--current' : '', isAnswered ? 'question-chip--answered' : ''].filter(Boolean).join(' ')
                return (
                  <button className={className} disabled={isSubmitting || isExpired} key={question.id} onClick={() => goToQuestion(index)} type="button">
                    {index + 1}
                  </button>
                )
              })}
            </div>
          </aside>
        </section>
      </SessionShell>
    </>
  )
}

export default AssessmentPage