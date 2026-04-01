import { Router } from 'express'
import { getAdminSubmissions } from '../controllers/adminSubmissionController.js'
import { requireAdmin } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/', ...requireAdmin, getAdminSubmissions)

export default router
