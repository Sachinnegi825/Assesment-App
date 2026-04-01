import mongoose from 'mongoose'
import { assessmentDefinition } from '../config/assessmentDefinition.js'
import { AssessmentSubmissionModel } from '../models/assessmentSubmissionModel.js'
import { validateCandidateDetails } from './candidateDetailsService.js'

const submissionTracker = new Set()

export function validateSubmissionPayload(payload) {
  const errors = {}

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      errors: {
        payload: 'Submission payload must be an object.',
      },
      isValid: false,
    }
  }

  const candidateResult = validateCandidateDetails(payload.candidateDetails)

  if (!candidateResult.isValid) {
    errors.candidateDetails = candidateResult.errors
  }

  if (payload.assessmentId !== assessmentDefinition.metadata.assessmentId) {
    errors.assessmentId = 'Assessment identifier is invalid.'
  }

  if (!payload.metadata || typeof payload.metadata !== 'object') {
    errors.metadata = 'Assessment metadata is required.'
  } else {
    if (
      payload.metadata.durationInMinutes !==
      assessmentDefinition.metadata.durationInMinutes
    ) {
      errors.metadataDuration = 'Assessment duration does not match the server definition.'
    }

    if (
      payload.metadata.totalQuestions !== assessmentDefinition.metadata.totalQuestions
    ) {
      errors.metadataQuestionCount =
        'Assessment question count does not match the server definition.'
    }
  }

  const answersResult = validateAnswers(payload.answers)

  if (!answersResult.isValid) {
    errors.answers = answersResult.errors
  }

  if (!Number.isInteger(payload.currentQuestionIndex)) {
    errors.currentQuestionIndex = 'Current question index must be an integer.'
  } else if (
    payload.currentQuestionIndex < 0 ||
    payload.currentQuestionIndex >= assessmentDefinition.metadata.totalQuestions
  ) {
    errors.currentQuestionIndex = 'Current question index is out of range.'
  }

  if (!['manual_submit', 'timer_expired'].includes(payload.reason)) {
    errors.reason = 'Submission reason is invalid.'
  }

  const sessionResult = validateSession(payload.session, payload.submittedAt)

  if (!sessionResult.isValid) {
    errors.session = sessionResult.errors
  }

  const submittedAt = Date.parse(payload.submittedAt)

  if (Number.isNaN(submittedAt)) {
    errors.submittedAt = 'Submitted timestamp must be a valid ISO date.'
  }

  const submissionKey = buildSubmissionKey({
    assessmentId: payload.assessmentId,
    email: candidateResult.candidateDetails.email,
    startedAt: payload.session?.startedAt,
  })

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    normalizedPayload: {
      ...payload,
      answers: answersResult.normalizedAnswers,
      candidateDetails: candidateResult.candidateDetails,
      submissionKey,
    },
    submissionKey,
  }
}

function validateAnswers(answers) {
  const errors = {}

  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return {
      errors: {
        payload: 'Answers payload must be an object.',
      },
      isValid: false,
      normalizedAnswers: {},
    }
  }

  const normalizedAnswers = {}

  for (const questionId of Object.keys(assessmentDefinition.questionMap)) {
    if (!(questionId in answers)) {
      errors[questionId] = 'Answer entry is missing.'
      continue
    }

    const optionId = answers[questionId]
    const validOptionIds = assessmentDefinition.questionMap[questionId].optionIds

    if (optionId === null) {
      normalizedAnswers[questionId] = null
      continue
    }

    if (typeof optionId !== 'string' || !validOptionIds.includes(optionId)) {
      errors[questionId] = 'Answer option is invalid.'
      continue
    }

    normalizedAnswers[questionId] = optionId
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    normalizedAnswers,
  }
}

function validateSession(session, submittedAtValue) {
  const errors = {}

  if (!session || typeof session !== 'object' || Array.isArray(session)) {
    return {
      errors: {
        payload: 'Submission session data is required.',
      },
      isValid: false,
    }
  }

  if (session.assessmentId !== assessmentDefinition.metadata.assessmentId) {
    errors.assessmentId = 'Session assessment identifier is invalid.'
  }

  if (session.durationInMinutes !== assessmentDefinition.metadata.durationInMinutes) {
    errors.durationInMinutes = 'Session duration does not match the assessment definition.'
  }

  if (!Number.isFinite(session.startedAt) || !Number.isFinite(session.expiresAt)) {
    errors.timestamps = 'Session timestamps must be numeric.'
  } else {
    const expectedDurationMs =
      assessmentDefinition.metadata.durationInMinutes * 60 * 1000

    if (session.expiresAt - session.startedAt !== expectedDurationMs) {
      errors.durationWindow = 'Session timing window is invalid.'
    }

    const submittedAt = Date.parse(submittedAtValue)

    if (!Number.isNaN(submittedAt) && submittedAt < session.startedAt) {
      errors.submittedAt = 'Submission time cannot be before session start.'
    }
  }

  if (session.status !== 'in_progress') {
    errors.status = 'Session status must be in_progress at submission time.'
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  }
}

export function ensureSubmissionNotDuplicate(submissionKey) {
  if (submissionTracker.has(submissionKey)) {
    return false
  }

  submissionTracker.add(submissionKey)
  return true
}

export function releaseSubmissionKey(submissionKey) {
  submissionTracker.delete(submissionKey)
}

export async function mirrorSubmission(normalizedPayload) {
  if (mongoose.connection.readyState !== 1) {
    console.info('[server] submission retained in request memory only')
    return {
      stored: false,
    }
  }

  try {
    await AssessmentSubmissionModel.create(normalizedPayload)
    console.info('[server] submission stored in mongodb')

    return {
      stored: true,
    }
  } catch (error) {
    if (error?.code === 11000) {
      throw new Error('duplicate_submission')
    }

    throw error
  }
}

export function buildSubmissionKey({ assessmentId, email, startedAt }) {
  return `${assessmentId}::${email}::${startedAt}`
}

export function resetSubmissionTracker() {
  submissionTracker.clear()
}
