import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const rootEnvPath = path.resolve(currentDir, '../../../.env')

dotenv.config({
  path: rootEnvPath,
  quiet: true,
})

export const env = {
  adminEmail: process.env.ADMIN_EMAIL || 'evaluator@sidlabs.net',
  adminInitialPassword: process.env.ADMIN_INITIAL_PASSWORD || 'replace-with-a-strong-admin-password',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  demoUserEmail: process.env.DEMO_USER_EMAIL || 'candidate@sidlabs.com',
  demoUserPassword: process.env.DEMO_USER_PASSWORD || 'SidLabs@2026',
  jwtSecret: process.env.JWT_SECRET || 'stage-two-demo-secret',
  mongoUri: process.env.MONGODB_URI || 'mongodb+srv://fullstackdeveloper27:1aDTBKDCFmNQiJi5@cluster0.cbsrb.mongodb.net/assessment-engine?retryWrites=true&w=majority&appName=Cluster0',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5001,
}
