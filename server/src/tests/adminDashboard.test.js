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
  resetAdminDashboardRepository,
  setAdminDashboardRepository,
} from '../services/adminDashboardService.js'
import {
  resetAccessLogRepository,
  setAccessLogRepository,
} from '../services/accessLogService.js'

async function createAdminCookie(app) {
  const passwordHash = await hashPassword('AdminStageA2!Pass')

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
    password: 'AdminStageA2!Pass',
  })

  return loginResponse.headers['set-cookie'][0]
}

afterEach(() => {
  resetAccessLogRepository()
  resetAdminUserRepository()
  resetAdminDashboardRepository()
})

test('GET /api/admin/dashboard returns dashboard summary data for an admin', async () => {
  const app = createApp()
  const cookie = await createAdminCookie(app)

  setAdminDashboardRepository({
    async getDashboardSnapshot() {
      return {
        latestSubmissions: [
          {
            candidateEmail: 'candidate@sidlabs.com',
            candidateName: 'Sid Demo',
            location: 'Bengaluru',
            reason: 'manual_submit',
            roleApplied: 'Research Analyst',
            submittedAt: '2026-03-24T13:30:00.000Z',
          },
        ],
        overview: [
          {
            completedAssessments: 3,
            expiredAssessments: 1,
            totalSubmissions: 4,
          },
        ],
        totalCandidates: [{ totalCandidates: 3 }],
      }
    },
  })

  setAccessLogRepository({
    async countDistinctIpAddresses() {
      return 2
    },
    async create() {
      return null
    },
    async findRecent() {
      return [
        {
          accessedAt: new Date('2026-03-24T13:25:00.000Z'),
          actorEmail: 'evaluator@sidlabs.net',
          ipAddress: '203.0.113.10',
          method: 'POST',
          path: '/api/auth/admin/login',
          sourceLabel: 'Bengaluru, KA, IN',
          statusCode: 200,
          userRole: 'admin',
        },
      ]
    },
  })

  const response = await request(app)
    .get('/api/admin/dashboard')
    .set('Cookie', cookie)

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.success, true)
  assert.equal(response.body.data.overview.totalCandidates, 3)
  assert.equal(response.body.data.overview.totalSubmissions, 4)
  assert.equal(response.body.data.overview.completionRate, 75)
  assert.equal(response.body.data.latestSubmissions[0].statusLabel, 'Completed manually')
  assert.equal(response.body.data.accessOverview.uniqueIpCount, 2)
  assert.equal(response.body.data.accessOverview.recentAccess[0].ipAddress, '203.0.113.10')
})

test('GET /api/admin/dashboard returns empty-state data gracefully', async () => {
  const app = createApp()
  const cookie = await createAdminCookie(app)

  setAdminDashboardRepository({
    async getDashboardSnapshot() {
      return {
        latestSubmissions: [],
        overview: [],
        totalCandidates: [],
      }
    },
  })

  setAccessLogRepository({
    async countDistinctIpAddresses() {
      return 0
    },
    async create() {
      return null
    },
    async findRecent() {
      return []
    },
  })

  const response = await request(app)
    .get('/api/admin/dashboard')
    .set('Cookie', cookie)

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.success, true)
  assert.equal(response.body.data.overview.totalSubmissions, 0)
  assert.equal(response.body.data.latestSubmissions.length, 0)
  assert.equal(response.body.data.activity.length, 0)
  assert.equal(response.body.data.statusBreakdown[2].count, null)
  assert.equal(response.body.data.accessOverview.uniqueIpCount, 0)
})

test('GET /api/admin/dashboard rejects candidate access', async () => {
  const app = createApp()

  const candidateLoginResponse = await request(app).post('/api/auth/login').send({
    email: 'candidate@sidlabs.com',
    password: 'SidLabs@2026',
  })

  const candidateCookie = candidateLoginResponse.headers['set-cookie'][0]

  const response = await request(app)
    .get('/api/admin/dashboard')
    .set('Cookie', candidateCookie)

  assert.equal(response.statusCode, 403)
  assert.equal(response.body.message, 'You do not have access to this resource.')
})
