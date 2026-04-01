import assert from 'node:assert/strict'
import test from 'node:test'
import request from 'supertest'
import { createApp } from '../app.js'
import { assessmentDefinition } from '../config/assessmentDefinition.js'
import { resetSubmissionTracker } from '../services/submissionService.js'

async function loginAndGetCookie(app) {
  const response = await request(app).post('/api/auth/login').send({
    email: 'candidate@sidlabs.com',
    password: 'SidLabs@2026',
  })

  return response.headers['set-cookie'][0]
}

function buildValidPayload() {
  const answers = {}

  for (let questionId = 1; questionId <= assessmentDefinition.metadata.totalQuestions; questionId += 1) {
    answers[questionId] = null
  }

  answers[1] = 'C'

  const startedAt = Date.now() - 60_000

  return {
    answers,
    assessmentId: assessmentDefinition.metadata.assessmentId,
    candidateDetails: {
      age: '24',
      email: 'candidate@sidlabs.com',
      fullName: 'Sid Demo',
      location: 'Bengaluru',
      roleApplied: 'Product Analyst',
    },
    currentQuestionIndex: 24,
    metadata: {
      durationInMinutes: assessmentDefinition.metadata.durationInMinutes,
      totalQuestions: assessmentDefinition.metadata.totalQuestions,
    },
    reason: 'manual_submit',
    session: {
      assessmentId: assessmentDefinition.metadata.assessmentId,
      durationInMinutes: assessmentDefinition.metadata.durationInMinutes,
      expiresAt:
        startedAt + assessmentDefinition.metadata.durationInMinutes * 60 * 1000,
      startedAt,
      status: 'in_progress',
    },
    submittedAt: new Date().toISOString(),
  }
}

test.beforeEach(() => {
  resetSubmissionTracker()
})

test('POST /api/submissions accepts a valid assessment submission', async () => {
  const app = createApp()
  const cookie = await loginAndGetCookie(app)
  const response = await request(app)
    .post('/api/submissions')
    .set('Cookie', cookie)
    .send(buildValidPayload())

  assert.equal(response.statusCode, 201)
  assert.equal(response.body.success, true)
  assert.equal(
    response.body.message,
    'Your assessment has been submitted successfully.',
  )
  assert.ok(response.body.data.submissionKey)
})

test('POST /api/submissions accepts a candidate email different from the shared login email', async () => {
  const app = createApp()
  const cookie = await loginAndGetCookie(app)
  const payload = buildValidPayload()

  payload.candidateDetails.email = 'applicant@sidlabs.net'

  const response = await request(app)
    .post('/api/submissions')
    .set('Cookie', cookie)
    .send(payload)

  assert.equal(response.statusCode, 201)
  assert.equal(response.body.success, true)
})

test('POST /api/submissions rejects invalid answer payloads', async () => {
  const app = createApp()
  const cookie = await loginAndGetCookie(app)
  const payload = buildValidPayload()
  payload.answers[1] = 'Z'

  const response = await request(app)
    .post('/api/submissions')
    .set('Cookie', cookie)
    .send(payload)

  assert.equal(response.statusCode, 400)
  assert.equal(response.body.success, false)
  assert.equal(response.body.errors.answers['1'], 'Answer option is invalid.')
})

test('POST /api/submissions rejects duplicate submissions for the same attempt', async () => {
  const app = createApp()
  const cookie = await loginAndGetCookie(app)
  const payload = buildValidPayload()

  const firstResponse = await request(app)
    .post('/api/submissions')
    .set('Cookie', cookie)
    .send(payload)

  const secondResponse = await request(app)
    .post('/api/submissions')
    .set('Cookie', cookie)
    .send(payload)

  assert.equal(firstResponse.statusCode, 201)
  assert.equal(secondResponse.statusCode, 409)
  assert.equal(secondResponse.body.code, 'DUPLICATE_SUBMISSION')
})
