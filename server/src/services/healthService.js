import { getDatabaseStatus } from '../config/db.js'

export function getHealthPayload() {
  return {
    status: 'ok',
    message: 'Assessment Engine API is healthy.',
    timestamp: new Date().toISOString(),
    database: {
      status: getDatabaseStatus(),
    },
  }
}
