import { useState, useRef } from 'react'
import { assessmentDefinition } from '../data/assessmentDefinition'
import { submitAssessmentPayload } from '../services/api'
import { syncProgressToBackend } from '../services/submissionService'
import { AssessmentContext } from './assessmentContextObject'
import {
  buildSubmissionPayload,
  createAssessmentSession,
  getInitialAnswers,
} from '../utils/assessmentEngine'

const initialCandidateDetails = {
  age: '',
  email: '',
  fullName: '',
  location: '',
  roleApplied: '',
}

function getFirstErrorMessage(details) {
  if (!details || typeof details !== 'object') {
    return ''
  }
  for (const value of Object.values(details)) {
    if (typeof value === 'string' && value) return value
    if (value && typeof value === 'object') {
      const nestedMessage = getFirstErrorMessage(value)
      if (nestedMessage) return nestedMessage
    }
  }
  return ''
}

export function AssessmentProvider({ children }) {
  // Core States
  const [candidateDetails, setCandidateDetails] = useState(initialCandidateDetails)
  const [assessmentSession, setAssessmentSession] = useState(null)
  const [answers, setAnswers] = useState(() => getInitialAnswers(assessmentDefinition.questions))
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Integrity/Security States
  const [violationCount, setViolationCount] = useState(0)
  const [violationLog, setViolationLog] = useState([])
  const [activeViolation, setActiveViolation] = useState(null)
  const lastAiViolationTime = useRef(0) // Used for 1-minute grace period
  
  const VIOLATION_LIMIT = 5
  const AI_GRACE_PERIOD = 120000 // 2 Minute

  // Submission States
  const [submissionSnapshot, setSubmissionSnapshot] = useState(null)
  const [submissionResult, setSubmissionResult] = useState(null)
  const [completionState, setCompletionState] = useState({
    message: '',
    status: 'idle',
  })

  // --- Logic Functions ---

  function syncProgress(reason = 'auto_save') {
    if (!assessmentSession || assessmentSession.status === 'submitted') return
    syncProgressToBackend({
      answers,
      assessmentDefinition,
      assessmentSession,
      candidateDetails,
      currentQuestionIndex,
      reason,
    })
  }

  function recordViolation(type, message) {
    const now = Date.now()
    const isAiViolation = ['face_missing', 'multiple_faces'].includes(type)

    // Handle 1-minute grace period for AI detection only
    if (isAiViolation) {
      if (now - lastAiViolationTime.current < AI_GRACE_PERIOD) {
        return // Skip recording if within 1 minute
      }
      lastAiViolationTime.current = now
    }

    const newViolation = { type, detail: message, timestamp: new Date().toISOString() }
    
    setViolationLog(prev => [...prev, newViolation])
    setViolationCount(prev => {
      const nextCount = prev + 1
      if (nextCount >= VIOLATION_LIMIT) {
        autoSubmit('integrity_violation_limit')
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
      } else {
        setActiveViolation({ type, message, count: nextCount })
      }
      return nextCount
    })

    // Immediately sync to backend so the log is updated
    syncProgress(`violation_${type}`)
  }

  function saveCandidateDetails(nextDetails) {
    setCandidateDetails(nextDetails)
  }

  function startAssessment() {
    const nextSession = createAssessmentSession(assessmentDefinition.metadata)
    setAssessmentSession(nextSession)
    setAnswers(getInitialAnswers(assessmentDefinition.questions))
    setCurrentQuestionIndex(0)
    setViolationCount(0)
    setViolationLog([])
    setActiveViolation(null)
    setSubmissionSnapshot(null)
    setSubmissionResult(null)
    lastAiViolationTime.current = 0
    setCompletionState({ message: '', status: 'idle' })
    return nextSession
  }

  function setAnswer(questionId, optionId) {
    setAnswers((current) => ({ ...current, [questionId]: optionId }))
  }

  function goToQuestion(index) {
    setCurrentQuestionIndex(index)
  }

  function resetAssessment() {
    setCandidateDetails(initialCandidateDetails)
    setAssessmentSession(null)
    setAnswers(getInitialAnswers(assessmentDefinition.questions))
    setCurrentQuestionIndex(0)
    setViolationCount(0)
    setViolationLog([])
    setActiveViolation(null)
    setSubmissionSnapshot(null)
    setSubmissionResult(null)
    setCompletionState({ message: '', status: 'idle' })
  }

  async function autoSubmit(reason = 'auto_save') {
    if (!assessmentSession || assessmentSession.status === 'submitted') return
    // Mark as submitted locally to prevent double triggers
    setAssessmentSession((current) => current ? { ...current, status: 'submitted' } : current)
    await submitAssessment(reason)
  }

  async function submitAssessment(reason) {
    if (completionState.status === 'success') {
      return { payload: submissionSnapshot, result: submissionResult }
    }

    const payload = buildSubmissionPayload({
      answers,
      assessmentDefinition,
      candidateDetails,
      currentQuestionIndex,
      reason,
      session: assessmentSession,
      // Sending the integrity data to the server
      integrityReport: {
        violationCount,
        violationLog
      }
    })

    setSubmissionSnapshot(payload)
    setCompletionState({
      message: 'Submitting your assessment. Please stay on this page.',
      status: 'submitting',
    })

    try {

      const result = await submitAssessmentPayload(payload)
      setSubmissionResult(result)
      setCompletionState({ message: 'Assessment submitted successfully.', status: 'success' })
      setAssessmentSession((current) => current ? { ...current, status: 'submitted' } : current)
      return { payload, result }
    } catch (error) {
      const validationMessage = getFirstErrorMessage(error.details)
      setCompletionState({
        message: validationMessage || error.message || 'The assessment could not be submitted.',
        status: 'error',
      })
      throw error
    }
  }

  const value = {
    assessmentDefinition,
    answers,
    assessmentSession,
    autoSubmit,
    candidateDetails,
    currentQuestionIndex,
    completionState,
    goToQuestion,
    resetAssessment,
    saveCandidateDetails,
    setAnswer,
    startAssessment,
    submissionSnapshot,
    submissionResult,
    submitAssessment,
    violationCount,
    violationLog,
    activeViolation,
    setActiveViolation,
    recordViolation,
    VIOLATION_LIMIT,
    syncProgress
  }

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  )
}