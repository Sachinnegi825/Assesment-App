import { Router } from 'express'
import { getAdminDashboard } from '../controllers/adminDashboardController.js'
import { requireAdmin } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/', ...requireAdmin, getAdminDashboard)

export default router
