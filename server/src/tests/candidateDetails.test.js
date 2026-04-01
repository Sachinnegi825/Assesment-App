import assert from 'node:assert/strict'
import test from 'node:test'
import request from 'supertest'
import { createApp } from '../app.js'

async function loginAndGetCookie(app) {
  const response = await request(app).post('/api/auth/login').send({
    email: 'candidate@sidlabs.com',
    password: 'SidLabs@2026',
  })

  return response.headers['set-cookie'][0]
}

test('POST /api/candidate-details/validate accepts valid candidate details', async () => {
  const app = createApp()
  const cookie = await loginAndGetCookie(app)

  const response = await request(app)
    .post('/api/candidate-details/validate')
    .set('Cookie', cookie)
    .send({
      age: '24',
      email: 'Candidate@SidLabs.com',
      fullName: 'Sid Demo',
      location: 'Bengaluru',
      roleApplied: 'Product Analyst',
    })

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.candidateDetails.email, 'candidate@sidlabs.com')
})

test('POST /api/candidate-details/validate rejects invalid email values', async () => {
  const app = createApp()
  const cookie = await loginAndGetCookie(app)

  const response = await request(app)
    .post('/api/candidate-details/validate')
    .set('Cookie', cookie)
    .send({
      age: '24',
      email: 'candidate..bad@sidlabs',
      fullName: 'Sid Demo',
      location: 'Bengaluru',
      roleApplied: 'Product Analyst',
    })

  assert.equal(response.statusCode, 400)
  assert.equal(response.body.errors.email, 'Enter a valid email address.')
})
