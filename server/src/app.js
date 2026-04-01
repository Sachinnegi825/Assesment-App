import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import adminDashboardRoutes from './routes/adminDashboardRoutes.js'
import adminSubmissionRoutes from './routes/adminSubmissionRoutes.js'
import authRoutes from './routes/authRoutes.js'
import candidateDetailsRoutes from './routes/candidateDetailsRoutes.js'
import { env } from './config/env.js'
import healthRoutes from './routes/healthRoutes.js'
import { captureAccessLog } from './middleware/accessLogMiddleware.js'
import submissionRoutes from './routes/submissionRoutes.js'

export function createApp() {
  const app = express()
  app.set('trust proxy', true)

  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  )
  app.use(cookieParser())
  app.use(express.json())
  app.use(captureAccessLog)

  app.get('/', (_request, response) => {
    response.json({
      message: 'Assessment Engine API is running.',
    })
  })

  app.use('/api/health', healthRoutes)
  app.use('/api/auth', authRoutes)
  app.use('/api/admin/dashboard', adminDashboardRoutes)
  app.use('/api/admin/submissions', adminSubmissionRoutes)
  app.use('/api/candidate-details', candidateDetailsRoutes)
  app.use('/api/submissions', submissionRoutes)

  app.use((request, response) => {
    response.status(404).json({
      message: `Route not found: ${request.method} ${request.originalUrl}`,
    })
  })

  app.use((error, _request, response, _next) => {
    console.error('[server] unhandled error', error)
    response.status(500).json({
      message: 'Internal server error.',
    })
  })

  return app
}
