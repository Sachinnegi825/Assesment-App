import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import request from 'supertest'
import { createApp } from '../app.js'
import {
  hashPassword,
  resetAdminUserRepository,
  setAdminUserRepository,
  verifyPassword,
} from '../services/adminAccountService.js'

async function createAdminCookie(app, repository) {
  setAdminUserRepository(repository)

  const loginResponse = await request(app).post('/api/auth/admin/login').send({
    email: 'evaluator@sidlabs.net',
    password: 'AdminStageA4!Pass',
  })

  return loginResponse.headers['set-cookie'][0]
}

afterEach(() => {
  resetAdminUserRepository()
})

test('POST /api/auth/admin/password updates the admin password with valid input', async () => {
  const app = createApp()
  const startingHash = await hashPassword('AdminStageA4!Pass')
  let savedUpdate = null

  const cookie = await createAdminCookie(app, {
    async findByEmail() {
      return {
        _id: 'admin-user-001',
        email: 'evaluator@sidlabs.net',
        name: 'Evaluator',
        passwordHash: startingHash,
        role: 'admin',
      }
    },
    async updatePasswordByEmail(email, update) {
      savedUpdate = {
        email,
        ...update,
      }

      return {
        _id: 'admin-user-001',
        email,
        name: 'SidLabs Evaluator',
        passwordChangedAt: update.passwordChangedAt,
        passwordHash: update.passwordHash,
        role: 'admin',
      }
    },
  })

  const response = await request(app)
    .post('/api/auth/admin/password')
    .set('Cookie', cookie)
    .send({
      confirmNewPassword: 'ChangedAdmin!2026',
      currentPassword: 'AdminStageA4!Pass',
      newPassword: 'ChangedAdmin!2026',
    })

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.success, true)
  assert.equal(response.body.message, 'Admin password updated successfully.')
  assert.equal(savedUpdate.email, 'evaluator@sidlabs.net')
  assert.notEqual(savedUpdate.passwordHash, 'ChangedAdmin!2026')
  assert.equal(await verifyPassword('ChangedAdmin!2026', savedUpdate.passwordHash), true)
})

test('POST /api/auth/admin/password rejects the wrong current password', async () => {
  const app = createApp()
  const startingHash = await hashPassword('AdminStageA4!Pass')

  const cookie = await createAdminCookie(app, {
    async findByEmail() {
      return {
        _id: 'admin-user-001',
        email: 'evaluator@sidlabs.net',
        name: 'SidLabs Evaluator',
        passwordHash: startingHash,
        role: 'admin',
      }
    },
    async updatePasswordByEmail() {
      throw new Error('should_not_be_called')
    },
  })

  const response = await request(app)
    .post('/api/auth/admin/password')
    .set('Cookie', cookie)
    .send({
      confirmNewPassword: 'ChangedAdmin!2026',
      currentPassword: 'WrongCurrentPass!1',
      newPassword: 'ChangedAdmin!2026',
    })

  assert.equal(response.statusCode, 400)
  assert.equal(response.body.success, false)
  assert.equal(
    response.body.errors.currentPassword,
    'Current password is incorrect.',
  )
})

test('POST /api/auth/admin/password rejects an invalid new password', async () => {
  const app = createApp()
  const startingHash = await hashPassword('AdminStageA4!Pass')

  const cookie = await createAdminCookie(app, {
    async findByEmail() {
      return {
        _id: 'admin-user-001',
        email: 'evaluator@sidlabs.net',
        name: 'SidLabs Evaluator',
        passwordHash: startingHash,
        role: 'admin',
      }
    },
    async updatePasswordByEmail() {
      throw new Error('should_not_be_called')
    },
  })

  const response = await request(app)
    .post('/api/auth/admin/password')
    .set('Cookie', cookie)
    .send({
      confirmNewPassword: 'short1!',
      currentPassword: 'AdminStageA4!Pass',
      newPassword: 'short1!',
    })

  assert.equal(response.statusCode, 400)
  assert.equal(response.body.success, false)
  assert.equal(
    response.body.errors.newPassword,
    'New password must be at least 12 characters.',
  )
})

test('POST /api/auth/admin/password rejects a mismatched confirmation password', async () => {
  const app = createApp()
  const startingHash = await hashPassword('AdminStageA4!Pass')

  const cookie = await createAdminCookie(app, {
    async findByEmail() {
      return {
        _id: 'admin-user-001',
        email: 'evaluator@sidlabs.net',
        name: 'SidLabs Evaluator',
        passwordHash: startingHash,
        role: 'admin',
      }
    },
    async updatePasswordByEmail() {
      throw new Error('should_not_be_called')
    },
  })

  const response = await request(app)
    .post('/api/auth/admin/password')
    .set('Cookie', cookie)
    .send({
      confirmNewPassword: 'ChangedAdmin!2027',
      currentPassword: 'AdminStageA4!Pass',
      newPassword: 'ChangedAdmin!2026',
    })

  assert.equal(response.statusCode, 400)
  assert.equal(response.body.success, false)
  assert.equal(
    response.body.errors.confirmNewPassword,
    'Confirmation does not match the new password.',
  )
})
