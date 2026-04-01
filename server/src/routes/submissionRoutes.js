import { Router } from 'express'
import { submitAssessment } from '../controllers/submissionController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/', requireAuth, submitAssessment)

export default router
