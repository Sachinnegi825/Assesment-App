import { useContext } from 'react'
import { AssessmentContext } from './assessmentContextObject'

export function useAssessment() {
  const context = useContext(AssessmentContext)

  if (!context) {
    throw new Error('useAssessment must be used within AssessmentProvider')
  }

  return context
}
