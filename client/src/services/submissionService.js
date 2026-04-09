import { buildSubmissionPayload } from '../utils/assessmentEngine'
import { API_BASE_URL } from './api'

export function syncProgressToBackend({
  answers,
  assessmentDefinition,
  candidateDetails,
  currentQuestionIndex,
  assessmentSession,
  reason = 'auto_save'
}) {
  if (!assessmentSession || assessmentSession.status === 'submitted') {
    return false
  }

  const payload = buildSubmissionPayload({
    answers,
    assessmentDefinition,
    candidateDetails,
    currentQuestionIndex,
    reason,
    session: assessmentSession,
  })

  const url = `${API_BASE_URL}/api/submissions`
  const body = JSON.stringify(payload)
  
  try {
    // 1. Try navigator.sendBeacon first - it's the most reliable for "fire and forget" on exit
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      const success = navigator.sendBeacon(url, blob)
      if (success) return true
    }
    
    // 2. Fallback to fetch with keepalive: true
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      keepalive: true,
      credentials: 'include',
    }).catch(() => {}) // Silent catch for background request
    
    return true
  } catch (error) {
    console.error('Background sync failed', error)
    return false
  }
}
