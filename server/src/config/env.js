import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const rootEnvPath = path.resolve(currentDir, '../../.env')
dotenv.config({
  path: rootEnvPath,
  quiet: true,
})



export const env = {
  adminEmail: process.env.ADMIN_EMAIL || 'evaluator@sidlabs.net',
  adminInitialPassword: process.env.ADMIN_INITIAL_PASSWORD || 'replace-with-a-strong-admin-password',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  demoUserEmail: process.env.DEMO_USER_EMAIL || 'candidate@gmail.com',
  demoUserPassword: process.env.DEMO_USER_PASSWORD || 'Candidate@2026',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  jwtSecret: process.env.JWT_SECRET || 'stage-two-demo-secret',
  mongoUri: process.env.MONGODB_URI || '',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5001,
}

