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

const initialCandidateDetails = { age: '', email: '', fullName: '', location: '', roleApplied: '' }

function getFirstErrorMessage(details) {
  if (!details || typeof details !== 'object') return ''
  for (const value of Object.values(details)) {
    if (typeof value === 'string' && value) return value
    if (value && typeof value === 'object') {
      const nested = getFirstErrorMessage(value)
      if (nested) return nested
    }
  }
  return ''
}

export function AssessmentProvider({ children }) {
  const [candidateDetails, setCandidateDetails] = useState(initialCandidateDetails)
  const [assessmentSession, setAssessmentSession] = useState(null)
  const [answers, setAnswers] = useState(() => getInitialAnswers(assessmentDefinition.questions))
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Integrity States
  const [violationCount, setViolationCount] = useState(0)
  const [violationLog, setViolationLog] = useState([])
  const [activeViolation, setActiveViolation] = useState(null)
  const [minorToast, setMinorToast] = useState(null)
  
  // Submission Status States
  const [submissionSnapshot, setSubmissionSnapshot] = useState(null)
  const [submissionResult, setSubmissionResult] = useState(null)
  const [completionState, setCompletionState] = useState({ message: '', status: 'idle' })
  
  // Counters and Timers
  const minorHits = useRef({ phone: 0, face: 0, voice: 0, gaze: 0 })
  const lastHitTime = useRef({ phone: 0, face: 0, voice: 0, gaze: 0 })
  const isModalOpen = useRef(false)
  const VIOLATION_LIMIT = 5
  const HIT_COOLDOWN_MS = 5000 // 5 seconds gap between counting the same type of error

  function saveCandidateDetails(nextDetails) { setCandidateDetails(nextDetails); }
  function setAnswer(questionId, optionId) { setAnswers((curr) => ({ ...curr, [questionId]: optionId })); }
  function goToQuestion(index) { setCurrentQuestionIndex(index); }

  function syncProgress(reason = 'auto_save') {
    if (!assessmentSession || assessmentSession.status === 'submitted') return
    syncProgressToBackend({ answers, assessmentDefinition, assessmentSession, candidateDetails, currentQuestionIndex, reason })
  }

  function recordViolation(type, message) {
    const newViolation = { type, detail: message, timestamp: new Date().toISOString() }
    setViolationLog(prev => [...prev, newViolation])
    setViolationCount(prev => {
      const nextCount = prev + 1
      if (nextCount >= VIOLATION_LIMIT) {
        autoSubmit('integrity_violation_limit')
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
      } else {
        isModalOpen.current = true
        setActiveViolation({ type, message, count: nextCount })
      }
      return nextCount
    })
    syncProgress(`violation_${type}`)
  }

  function dismissViolation() {
    setActiveViolation(null)
    isModalOpen.current = false
    minorHits.current = { phone: 0, face: 0, voice: 0, gaze: 0 }
    lastHitTime.current = { phone: 0, face: 0, voice: 0, gaze: 0 }
  }

  function handleAiDetection(type, message) {
    if (isModalOpen.current) return
    const now = Date.now()

    // 1. Cooldown Check: Ignore if this type happened < 5s ago
    if (now - lastHitTime.current[type] < HIT_COOLDOWN_MS) return
    lastHitTime.current[type] = now

    // 2. Visual Toast
    setMinorToast({ message })
    setTimeout(() => setMinorToast(null), 3000)

    // 3. Counter Logic
    minorHits.current[type] += 1

    // 4. Rule: 3 hits = 1 Major
    if (minorHits.current[type] >= 4) {
      minorHits.current[type] = 0
      recordViolation(type === 'phone' ? 'mobile_phone' : type, `Security Alert: Repeated ${type} warning.`);
    }
  }

  function startAssessment() {
    const nextSession = createAssessmentSession(assessmentDefinition.metadata)
    setAssessmentSession(nextSession); setAnswers(getInitialAnswers(assessmentDefinition.questions));
    setCurrentQuestionIndex(0); setViolationCount(0); setViolationLog([]);
    minorHits.current = { phone: 0, face: 0, voice: 0, gaze: 0 };
    isModalOpen.current = false; setActiveViolation(null);
    setCompletionState({ message: '', status: 'idle' });
    return nextSession
  }

  function resetAssessment() {
    setCandidateDetails(initialCandidateDetails); setAssessmentSession(null);
    setAnswers(getInitialAnswers(assessmentDefinition.questions));
    setCurrentQuestionIndex(0); setViolationCount(0); setViolationLog([]);
    minorHits.current = { phone: 0, face: 0, voice: 0, gaze: 0 };
    isModalOpen.current = false; setActiveViolation(null);
    setCompletionState({ message: '', status: 'idle' });
  }

  async function autoSubmit(reason = 'auto_save') {
    if (!assessmentSession || assessmentSession.status === 'submitted') return
    setAssessmentSession(curr => curr ? { ...curr, status: 'submitted' } : curr)
    await submitAssessment(reason)
  }

  async function submitAssessment(reason) {
    if (completionState.status === 'success') return { payload: submissionSnapshot, result: submissionResult }
    const payload = buildSubmissionPayload({ answers, assessmentDefinition, candidateDetails, currentQuestionIndex, reason, session: assessmentSession, integrityReport: { violationCount, violationLog } })
    setSubmissionSnapshot(payload)
    setCompletionState({ message: 'Submitting...', status: 'submitting' })
    try {
      const result = await submitAssessmentPayload(payload)
      setSubmissionResult(result); setCompletionState({ message: 'Success', status: 'success' });
      setAssessmentSession(curr => curr ? { ...curr, status: 'submitted' } : curr);
      return { payload, result }
    } catch (error) {
      setCompletionState({ message: getFirstErrorMessage(error.details) || error.message, status: 'error' })
      throw error
    }
  }

  const value = {
    assessmentDefinition, answers, assessmentSession, autoSubmit,
    candidateDetails, currentQuestionIndex, completionState,
    goToQuestion, resetAssessment, saveCandidateDetails, setAnswer,
    startAssessment, submissionSnapshot, submissionResult, submitAssessment,
    violationCount, violationLog, activeViolation, dismissViolation,
    recordViolation, VIOLATION_LIMIT, syncProgress, minorToast, handleAiDetection
  }

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>
}