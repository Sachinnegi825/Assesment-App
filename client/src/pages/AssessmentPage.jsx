import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import TimerBadge from '../components/TimerBadge'
import SessionShell from '../components/SessionShell'
import { useAssessment } from '../context/useAssessment'
import { getAnsweredCount, getSecondsRemaining } from '../utils/assessmentEngine'

function AssessmentPage() {
  const navigate = useNavigate()
  const {
    answers,
    assessmentDefinition,
    assessmentSession,
    completionState,
    currentQuestionIndex,
    goToQuestion,
    setAnswer,
    submitAssessment,
  } = useAssessment()
  const { metadata, questions } = assessmentDefinition
  const [secondsRemaining, setSecondsRemaining] = useState(() =>
    getSecondsRemaining(assessmentSession),
  )

  const currentQuestion = questions[currentQuestionIndex]
  const selectedOptionId = answers[currentQuestion?.id]
  const answeredCount = getAnsweredCount(answers)
  const progressPercent = Math.round((answeredCount / questions.length) * 100)
  const isFirstQuestion = currentQuestionIndex === 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const isSubmitting = completionState.status === 'submitting'
  const submitError = completionState.status === 'error' ? completionState.message : ''

  useEffect(() => {
    setSecondsRemaining(getSecondsRemaining(assessmentSession))
  }, [assessmentSession])

  useEffect(() => {
    if (!assessmentSession) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      const nextRemaining = getSecondsRemaining(assessmentSession)
      setSecondsRemaining(nextRemaining)

      if (nextRemaining === 0) {
        window.clearInterval(intervalId)
      }
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [assessmentSession])

  useEffect(() => {
    if (
      secondsRemaining !== 0 ||
      isSubmitting ||
      !assessmentSession ||
      completionState.status === 'success'
    ) {
      return
    }

    async function handleExpiry() {
      try {
        await submitAssessment('timer_expired')
        navigate('/thank-you', {
          replace: true,
        })
      } catch {
        // The shared completion state already exposes the error.
      }
    }

    handleExpiry()
  }, [
    assessmentSession,
    completionState.status,
    isSubmitting,
    navigate,
    secondsRemaining,
    submitAssessment,
  ])

  useEffect(() => {
    function handleBeforeUnload(event) {
      if (!assessmentSession || assessmentSession.status === 'submitted') {
        return
      }

      event.preventDefault()
      event.returnValue =
        'Your assessment is in progress. Leaving now may interrupt your attempt.'
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [assessmentSession])

  if (!assessmentSession) {
    return <Navigate replace to="/assessment-instructions" />
  }

  if (
    assessmentSession.status === 'submitted' ||
    completionState.status === 'success'
  ) {
    return <Navigate replace to="/thank-you" />
  }

  function handleSelect(optionId) {
    setAnswer(currentQuestion.id, optionId)
  }

  function handlePrevious() {
    if (!isFirstQuestion) {
      goToQuestion(currentQuestionIndex - 1)
    }
  }

  function handleNext() {
    if (!isLastQuestion) {
      goToQuestion(currentQuestionIndex + 1)
    }
  }

  async function handleSubmit() {
    try {
      await submitAssessment('manual_submit')
      navigate('/thank-you')
    } catch {
      // The shared completion state already exposes the error.
    }
  }

  return (
    <SessionShell
      action={<TimerBadge secondsRemaining={secondsRemaining} />}
      eyebrow="Assessment in progress"
      subtitle="Move question by question. Selections are preserved while you navigate, and the timer continues running until submission or expiry."
      title={metadata.assessmentTitle}
    >
      <section className="assessment-overview">
        <article className="info-card info-card--highlight">
          <p className="info-card__label">Progress</p>
          <h2>
            Question {currentQuestionIndex + 1} of {questions.length}
          </h2>
          <div aria-hidden="true" className="progress-track">
            <div className="progress-track__bar" style={{ width: `${progressPercent}%` }} />
          </div>
          <p>{answeredCount} answered so far.</p>
        </article>

        <article className="info-card">
          <p className="info-card__label">Guardrail</p>
          <h2>Live attempt protection</h2>
          <p>
            The app warns before browser unload, and submission payloads retain start,
            expiry, and answer state for later backend verification.
          </p>
        </article>
      </section>

      <section className="assessment-layout">
        <article className="question-card">
          <div className="question-card__meta">
            <p className="info-card__label">
              {currentQuestion.section} · {currentQuestion.topic}
            </p>
            <h2>{currentQuestion.prompt}</h2>
          </div>

          <div className="option-list" role="radiogroup" aria-label="Question options">
            {currentQuestion.options.map((option) => {
              const isActive = selectedOptionId === option.id

              return (
                <button
                  aria-checked={isActive}
                  className={isActive ? 'option-button option-button--active' : 'option-button'}
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  role="radio"
                  type="button"
                >
                  <span className="option-button__key">{option.id}</span>
                  <span>{option.label}</span>
                </button>
              )
            })}
          </div>

          {submitError ? (
            <div className="form-message form-message--error" role="alert">
              {submitError}
            </div>
          ) : null}

          {isSubmitting ? (
            <div className="form-message form-message--info" role="status">
              {completionState.message}
            </div>
          ) : null}

          <div className="question-actions">
            <button
              className="secondary-button secondary-button--tight"
              disabled={isFirstQuestion}
              onClick={handlePrevious}
              type="button"
            >
              Previous
            </button>

            <div className="question-actions__right">
              {!isLastQuestion ? (
                <button className="primary-button" onClick={handleNext} type="button">
                  Next
                </button>
              ) : (
                <button
                  className="primary-button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  type="button"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit, Thanks & Exit'}
                </button>
              )}
            </div>
          </div>
        </article>

        <aside className="question-sidebar">
          <p className="info-card__label">Question map</p>
          <div className="question-map">
            {questions.map((question, index) => {
              const isCurrent = index === currentQuestionIndex
              const isAnswered = Boolean(answers[question.id])
              const className = [
                'question-chip',
                isCurrent ? 'question-chip--current' : '',
                isAnswered ? 'question-chip--answered' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <button
                  className={className}
                  key={question.id}
                  onClick={() => goToQuestion(index)}
                  type="button"
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
        </aside>
      </section>
    </SessionShell>
  )
}

export default AssessmentPage
