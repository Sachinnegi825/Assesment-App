import { useState } from 'react'
import { assessmentDefinition } from '../data/assessmentDefinition'
import { submitAssessmentPayload } from '../services/api'
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
    if (typeof value === 'string' && value) {
      return value
    }

    if (value && typeof value === 'object') {
      const nestedMessage = getFirstErrorMessage(value)

      if (nestedMessage) {
        return nestedMessage
      }
    }
  }

  return ''
}

export function AssessmentProvider({ children }) {
  const [candidateDetails, setCandidateDetails] = useState(initialCandidateDetails)
  const [assessmentSession, setAssessmentSession] = useState(null)
  const [answers, setAnswers] = useState(() =>
    getInitialAnswers(assessmentDefinition.questions),
  )
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [submissionSnapshot, setSubmissionSnapshot] = useState(null)
  const [submissionResult, setSubmissionResult] = useState(null)
  const [completionState, setCompletionState] = useState({
    message: '',
    status: 'idle',
  })

  function saveCandidateDetails(nextDetails) {
    setCandidateDetails(nextDetails)
  }

  function startAssessment() {
    const nextSession = createAssessmentSession(assessmentDefinition.metadata)

    setAssessmentSession(nextSession)
    setAnswers(getInitialAnswers(assessmentDefinition.questions))
    setCurrentQuestionIndex(0)
    setSubmissionSnapshot(null)
    setSubmissionResult(null)
    setCompletionState({
      message: '',
      status: 'idle',
    })

    return nextSession
  }

  function setAnswer(questionId, optionId) {
    setAnswers((current) => ({
      ...current,
      [questionId]: optionId,
    }))
  }

  function goToQuestion(index) {
    setCurrentQuestionIndex(index)
  }

  async function submitAssessment(reason) {
    if (completionState.status === 'success') {
      return {
        payload: submissionSnapshot,
        result: submissionResult,
      }
    }

    const payload = buildSubmissionPayload({
      answers,
      assessmentDefinition,
      candidateDetails,
      currentQuestionIndex,
      reason,
      session: assessmentSession,
    })

    setSubmissionSnapshot(payload)
    setCompletionState({
      message: 'Submitting your assessment. Please stay on this page.',
      status: 'submitting',
    })

    try {
      const result = await submitAssessmentPayload(payload)

      setSubmissionResult(result)
      setCompletionState({
        message: 'Assessment submitted successfully.',
        status: 'success',
      })
      setAssessmentSession((current) =>
        current
          ? {
              ...current,
              status: 'submitted',
            }
          : current,
      )

      return {
        payload,
        result,
      }
    } catch (error) {
      const validationMessage = getFirstErrorMessage(error.details)

      setCompletionState({
        message:
          validationMessage ||
          error.message ||
          'The assessment could not be submitted right now.',
        status: 'error',
      })
      throw error
    }
  }

  const value = {
    assessmentDefinition,
    answers,
    assessmentSession,
    candidateDetails,
    currentQuestionIndex,
    completionState,
    goToQuestion,
    saveCandidateDetails,
    setAnswer,
    startAssessment,
    submissionSnapshot,
    submissionResult,
    submitAssessment,
  }

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  )
}
