import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import request from 'supertest'
import { createApp } from '../app.js'
import {
  hashPassword,
  resetAdminUserRepository,
  setAdminUserRepository,
} from '../services/adminAccountService.js'
import {
  resetAdminSubmissionRepository,
  setAdminSubmissionRepository,
} from '../services/adminSubmissionTableService.js'

async function createAdminCookie(app) {
  const passwordHash = await hashPassword('AdminStageA3!Pass')

  setAdminUserRepository({
    async findByEmail(email) {
      if (email !== 'evaluator@sidlabs.net') {
        return null
      }

      return {
        _id: 'admin-user-001',
        email: 'evaluator@sidlabs.net',
        name: 'SidLabs Evaluator',
        passwordHash,
        role: 'admin',
      }
    },
  })

  const loginResponse = await request(app).post('/api/auth/admin/login').send({
    email: 'evaluator@sidlabs.net',
    password: 'AdminStageA3!Pass',
  })

  return loginResponse.headers['set-cookie'][0]
}

afterEach(() => {
  resetAdminUserRepository()
  resetAdminSubmissionRepository()
})

test('GET /api/admin/submissions returns paginated table data for admin users', async () => {
  const app = createApp()
  const cookie = await createAdminCookie(app)

  setAdminSubmissionRepository({
    async countDocuments() {
      return 2
    },
    async findSubmissions(_filter, options) {
      assert.equal(options.limit, 10)
      assert.equal(options.skip, 0)

      return [
        {
          answers: {
            1: 'C',
            2: 'C',
            3: 'B',
          },
          assessmentId: 'platoputer-research-assistant-pre-assessment',
          candidateDetails: {
            age: '24',
            email: 'candidate@sidlabs.com',
            fullName: 'Sid Demo',
            location: 'Bengaluru',
            roleApplied: 'Research Analyst',
          },
          reason: 'manual_submit',
          submittedAt: '2026-03-24T14:00:00.000Z',
        },
      ]
    },
  })

  const response = await request(app)
    .get('/api/admin/submissions?query=sid&status=all&page=1&limit=10')
    .set('Cookie', cookie)

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.success, true)
  assert.equal(response.body.data.items.length, 1)
  assert.equal(response.body.data.items[0].candidateName, 'Sid Demo')
  assert.equal(response.body.data.items[0].completionStatus, 'Completed manually')
  assert.equal(response.body.data.pagination.totalItems, 2)
  assert.equal(response.body.data.filters.query, 'sid')
})

test('GET /api/admin/submissions rejects non-admin users', async () => {
  const app = createApp()

  const candidateLoginResponse = await request(app).post('/api/auth/login').send({
    email: 'candidate@sidlabs.com',
    password: 'SidLabs@2026',
  })

  const candidateCookie = candidateLoginResponse.headers['set-cookie'][0]

  const response = await request(app)
    .get('/api/admin/submissions')
    .set('Cookie', candidateCookie)

  assert.equal(response.statusCode, 403)
  assert.equal(response.body.message, 'You do not have access to this resource.')
})
