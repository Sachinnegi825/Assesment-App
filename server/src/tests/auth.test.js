import assert from 'node:assert/strict'
import { afterEach } from 'node:test'
import test from 'node:test'
import request from 'supertest'
import { createApp } from '../app.js'
import {
  hashPassword,
  resetAdminUserRepository,
  setAdminUserRepository,
} from '../services/adminAccountService.js'

afterEach(() => {
  resetAdminUserRepository()
})

test('POST /api/auth/login authenticates the seeded demo user', async () => {
  const app = createApp()

  const response = await request(app).post('/api/auth/login').send({
    email: 'candidate@sidlabs.com',
    password: 'SidLabs@2026',
  })

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.user.email, 'candidate@sidlabs.com')
  assert.match(response.headers['set-cookie'][0], /assessment_token=/)
})

test('POST /api/auth/login rejects invalid credentials', async () => {
  const app = createApp()

  const response = await request(app).post('/api/auth/login').send({
    email: 'candidate@sidlabs.com',
    password: 'wrong-pass',
  })

  assert.equal(response.statusCode, 401)
  assert.equal(response.body.message, 'Invalid email or password.')
})

test('POST /api/auth/admin/login authenticates a seeded admin user', async () => {
  const app = createApp()
  const passwordHash = await hashPassword('StageA1!SecurePass')

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

  const response = await request(app).post('/api/auth/admin/login').send({
    email: 'evaluator@sidlabs.net',
    password: 'StageA1!SecurePass',
  })

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.user.email, 'evaluator@sidlabs.net')
  assert.equal(response.body.user.role, 'admin')
  assert.match(response.headers['set-cookie'][0], /assessment_token=/)
})

test('POST /api/auth/admin/login rejects invalid credentials', async () => {
  const app = createApp()
  const passwordHash = await hashPassword('StageA1!SecurePass')

  setAdminUserRepository({
    async findByEmail() {
      return {
        _id: 'admin-user-001',
        email: 'evaluator@sidlabs.net',
        name: 'SidLabs Evaluator',
        passwordHash,
        role: 'admin',
      }
    },
  })

  const response = await request(app).post('/api/auth/admin/login').send({
    email: 'evaluator@sidlabs.net',
    password: 'WrongPassword123',
  })

  assert.equal(response.statusCode, 401)
  assert.equal(response.body.message, 'Invalid email or password.')
})

test('GET /api/auth/session returns a null user without an authenticated cookie', async () => {
  const app = createApp()

  const response = await request(app).get('/api/auth/session')

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.user, null)
})

test('GET /api/auth/admin/session rejects non-admin authenticated users', async () => {
  const app = createApp()

  const loginResponse = await request(app).post('/api/auth/login').send({
    email: 'candidate@sidlabs.com',
    password: 'SidLabs@2026',
  })

  const cookie = loginResponse.headers['set-cookie'][0]

  const response = await request(app).get('/api/auth/admin/session').set('Cookie', cookie)

  assert.equal(response.statusCode, 403)
  assert.equal(response.body.message, 'You do not have access to this resource.')
})
