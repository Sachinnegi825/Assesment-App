import { Router } from 'express'
import { getSettings, updateSettings } from '../controllers/adminSettingsController.js'
import { requireAdmin } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/', ...requireAdmin, getSettings)
router.patch('/', ...requireAdmin, updateSettings)

export default router
