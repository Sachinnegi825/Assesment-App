import { Router } from 'express'
import {
  changeAdminPassword,
  getAdminSession,
  getSession,
  login,
  loginAdmin,
  logout,
} from '../controllers/authController.js'
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/login', login)
router.post('/admin/login', loginAdmin)
router.post('/admin/password', ...requireAdmin, changeAdminPassword)
router.get('/session', getSession)
router.get('/admin/session', requireAdmin, getAdminSession)
router.post('/logout', logout)

export default router
