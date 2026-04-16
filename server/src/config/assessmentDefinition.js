import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const masterAssessmentPath = path.resolve(
  currentDir,
  '../../../client/src/data/masterAssessment.json',
)

const masterAssessmentJson = JSON.parse(
  fs.readFileSync(masterAssessmentPath, 'utf8'),
)



const questionMap = masterAssessmentJson.questions.reduce((accumulator, question) => {
  accumulator[String(question.id)] = {
    id: question.id,
    optionIds: Object.keys(question.options),
    score: question.score,
  }

  return accumulator
}, {})

export const assessmentDefinition = {
  metadata: {
    assessmentId: slugify(masterAssessmentJson.assessment_meta.title),
    assessmentTitle: masterAssessmentJson.assessment_meta.title,
    durationInMinutes: masterAssessmentJson.assessment_meta.time_limit_minutes,
    totalQuestions: masterAssessmentJson.assessment_meta.total_questions,
  },
  questionMap,
  scoring: masterAssessmentJson.assessment_meta.scoring,
  sourceQuestions: masterAssessmentJson.questions,
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
