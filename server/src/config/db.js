import mongoose from 'mongoose'
import { env } from './env.js'

let databaseStatus = 'disconnected'

export async function connectDatabase() {

  console.log("env",env)

  if (!env.mongoUri) {
    databaseStatus = 'failed'
    console.error(
      '[server] db failed: MONGODB_URI is not set. Continuing without database connection.',
    )
    return false
  }

  try {
    await mongoose.connect(env.mongoUri)
    databaseStatus = 'connected'
    console.info('[server] db connected')
    return true
  } catch (error) {
    databaseStatus = 'failed'
    console.error('[server] db failed', error.message)
    return false
  }
}

export function getDatabaseStatus() {
  if (mongoose.connection.readyState === 1) {
    return 'connected'
  }

  return databaseStatus
}
