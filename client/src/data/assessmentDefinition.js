import masterAssessmentJson from './masterAssessment.json'
import { normalizeAssessment } from '../utils/assessmentSchema'

export const assessmentDefinition = normalizeAssessment(masterAssessmentJson)
