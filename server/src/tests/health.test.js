import assert from 'node:assert/strict'
import test from 'node:test'
import request from 'supertest'
import { createApp } from '../app.js'

test('GET /api/health returns the API health payload', async () => {
  const app = createApp()
  const response = await request(app).get('/api/health')

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.status, 'ok')
  assert.equal(response.body.message, 'Assessment Engine API is healthy.')
  assert.ok(response.body.timestamp)
  assert.ok(response.body.database)
})
