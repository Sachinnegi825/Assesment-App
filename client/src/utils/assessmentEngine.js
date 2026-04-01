export function createAssessmentSession(metadata, now = Date.now()) {
  const durationMs = metadata.durationInMinutes * 60 * 1000

  return {
    assessmentId: metadata.assessmentId,
    durationInMinutes: metadata.durationInMinutes,
    expiresAt: now + durationMs,
    startedAt: now,
    status: 'in_progress',
  }
}

export function getSecondsRemaining(session, now = Date.now()) {
  if (!session) {
    return 0
  }

  return Math.max(0, Math.ceil((session.expiresAt - now) / 1000))
}

export function formatRemainingTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function getInitialAnswers(questions) {
  return questions.reduce((accumulator, question) => {
    accumulator[question.id] = null
    return accumulator
  }, {})
}

export function getAnsweredCount(answers) {
  return Object.values(answers).filter(Boolean).length
}

export function buildSubmissionPayload({
  answers,
  assessmentDefinition,
  candidateDetails,
  currentQuestionIndex,
  reason,
  session,
}) {
  return {
    answers,
    assessmentId: assessmentDefinition.metadata.assessmentId,
    candidateDetails,
    currentQuestionIndex,
    metadata: {
      durationInMinutes: assessmentDefinition.metadata.durationInMinutes,
      totalQuestions: assessmentDefinition.metadata.totalQuestions,
    },
    reason,
    session,
    submittedAt: new Date().toISOString(),
  }
}
