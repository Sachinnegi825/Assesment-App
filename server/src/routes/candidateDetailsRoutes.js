import { Router } from 'express'
import { validateCandidateDetailsInput } from '../controllers/candidateDetailsController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/validate', requireAuth, validateCandidateDetailsInput)

export default router
