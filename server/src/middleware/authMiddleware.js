import { COOKIE_NAME, verifyAuthToken } from '../config/auth.js'

export function requireAuth(request, response, next) {
  const token = request.cookies?.[COOKIE_NAME]

  if (!token) {
    return response.status(401).json({
      message: 'Authentication required.',
    })
  }

  try {
    request.user = verifyAuthToken(token)
    return next()
  } catch {
    return response.status(401).json({
      message: 'Session is invalid or expired.',
    })
  }
}

export function requireRole(...allowedRoles) {
  return function enforceRole(request, response, next) {
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      console.warn(
        `[server] unauthorized access attempt: ${request.user?.email || 'anonymous'} -> ${request.originalUrl}`,
      )
      return response.status(403).json({
        message: 'You do not have access to this resource.',
      })
    }

    return next()
  }
}

export const requireAdmin = [requireAuth, requireRole('admin')]
