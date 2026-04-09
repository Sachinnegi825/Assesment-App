import mongoose from 'mongoose'
import { assessmentDefinition } from '../config/assessmentDefinition.js'
import { AssessmentSubmissionModel } from '../models/assessmentSubmissionModel.js'
import { validateCandidateDetails } from './candidateDetailsService.js'

const submissionTracker = new Set()

const AUTO_SAVE_REASONS = [
  'auto_save', 
  'user_left_tab_or_window', 
  'user_signout', 
  'user_closed_tab_or_browser'
];

const FINAL_REASONS = [
  'manual_submit', 
  'timer_expired', 
  'integrity_violation_limit'
];

// Added async here
export async function validateSubmissionPayload(payload) {
  const errors = {}

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      errors: { payload: 'Submission payload must be an object.' },
      isValid: false,
    }
  }

  // Added await here because validateCandidateDetails is async
  const candidateResult = await validateCandidateDetails(payload.candidateDetails)

  if (!candidateResult.isValid) {
    errors.candidateDetails = candidateResult.errors
  }

  if (payload.assessmentId !== assessmentDefinition.metadata.assessmentId) {
    errors.assessmentId = 'Assessment identifier is invalid.'
  }

  if (!payload.metadata || typeof payload.metadata !== 'object') {
    errors.metadata = 'Assessment metadata is required.'
  } else {
    if (payload.metadata.durationInMinutes !== assessmentDefinition.metadata.durationInMinutes) {
      errors.metadataDuration = 'Assessment duration does not match definition.'
    }
    if (payload.metadata.totalQuestions !== assessmentDefinition.metadata.totalQuestions) {
      errors.metadataQuestionCount = 'Question count does not match definition.'
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

  const isViolationSync = typeof payload.reason === 'string' && payload.reason.startsWith('violation_');
  const allValidReasons = [...AUTO_SAVE_REASONS, ...FINAL_REASONS];
  
  if (!allValidReasons.includes(payload.reason) && !isViolationSync) {
    errors.reason = 'Submission reason is invalid.';
  }

  const sessionResult = validateSession(payload.session, payload.submittedAt)
  if (!sessionResult.isValid) {
    errors.session = sessionResult.errors
  }

  if (Number.isNaN(Date.parse(payload.submittedAt))) {
    errors.submittedAt = 'Submitted timestamp must be a valid ISO date.'
  }

  const submissionKey = buildSubmissionKey({
    assessmentId: payload.assessmentId,
    email: candidateResult?.candidateDetails?.email,
    startedAt: payload.session?.startedAt,
  })

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    normalizedPayload: {
      ...payload,
      answers: answersResult.normalizedAnswers,
      candidateDetails: candidateResult.candidateDetails,
      session: { ...payload.session, status: 'submitted' },
      integrityReport: payload.integrityReport || { violationCount: 0, violationLog: [] },
      submissionKey,
    },
    submissionKey,
  }
}

// ... Keep validateAnswers, validateSession, ensureSubmissionNotDuplicate, etc exactly as they are ...
// (No changes needed in those functions)

export function validateAnswers(answers) {
  const errors = {}
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return { errors: { payload: 'Answers must be an object.' }, isValid: false, normalizedAnswers: {} }
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
  return { errors, isValid: Object.keys(errors).length === 0, normalizedAnswers }
}

function validateSession(session, submittedAtValue) {
  const errors = {}
  if (!session || typeof session !== 'object') {
    return { errors: { payload: 'Session data is required.' }, isValid: false }
  }
  if (session.assessmentId !== assessmentDefinition.metadata.assessmentId) {
    errors.assessmentId = 'Session assessment identifier is invalid.'
  }
  if (session.durationInMinutes !== assessmentDefinition.metadata.durationInMinutes) {
    errors.durationInMinutes = 'Session duration does not match definition.'
  }
  if (!Number.isFinite(session.startedAt) || !Number.isFinite(session.expiresAt)) {
    errors.timestamps = 'Session timestamps must be numeric.'
  } else {
    const expectedDurationMs = assessmentDefinition.metadata.durationInMinutes * 60 * 1000
    if (session.expiresAt - session.startedAt !== expectedDurationMs) {
      errors.durationWindow = 'Session timing window is invalid.'
    }
    const submittedAt = Date.parse(submittedAtValue)
    if (!Number.isNaN(submittedAt) && submittedAt < session.startedAt) {
      errors.submittedAt = 'Submission time cannot be before session start.'
    }
  }
  if (!['in_progress', 'submitted'].includes(session.status)) {
    errors.status = 'Session status is invalid.'
  }
  return { errors, isValid: Object.keys(errors).length === 0 }
}

export function ensureSubmissionNotDuplicate(submissionKey, reason) {
  if (submissionTracker.has(`${submissionKey}::FINAL`)) return false
  if (FINAL_REASONS.includes(reason)) submissionTracker.add(`${submissionKey}::FINAL`)
  return true
}

export function releaseSubmissionKey(submissionKey) {
  submissionTracker.delete(submissionKey)
  submissionTracker.delete(`${submissionKey}::FINAL`)
}

export async function mirrorSubmission(normalizedPayload) {
  if (mongoose.connection.readyState !== 1) return { stored: false }
  try {
    await AssessmentSubmissionModel.findOneAndUpdate(
      { submissionKey: normalizedPayload.submissionKey },
      normalizedPayload,
      { upsert: true, new: true }
    )
    return { stored: true }
  } catch (error) {
    if (error?.code === 11000) throw new Error('duplicate_submission')
    throw error
  }
}

export function buildSubmissionKey({ assessmentId, email, startedAt }) {
  return `${assessmentId}::${email}::${startedAt}`
}

export function resetSubmissionTracker() {
  submissionTracker.clear()
}