import masterAssessmentJson from './masterAssessment_v2.json'
import { normalizeAssessment } from '../utils/assessmentSchema'

export const assessmentDefinition = normalizeAssessment(masterAssessmentJson)
