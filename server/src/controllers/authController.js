import {
  COOKIE_NAME,
  getAuthCookieOptions,
  verifyAuthToken,
} from '../config/auth.js'
import {
  checkAdminPasswordChangeThrottle,
  updateAdminPassword,
  validateAdminPasswordChangeInput,
} from '../services/adminAccountService.js'
import {
  authenticateAdmin,
  authenticateCandidate,
  validateLoginInput,
  verifyGoogleToken,
} from '../services/authService.js'

function buildSessionPayload(request) {
  return {
    user: {
      email: request.user.email,
      id: request.user.sub,
      name: request.user.name,
      role: request.user.role,
    },
  }
}

export async function login(request, response) {
  console.info('[server] auth route hit: login')

  const validationError = validateLoginInput(request.body)

  if (validationError) {
    console.warn('[server] login failure: validation')
    return response.status(400).json({
      message: validationError,
    })
  }

  const result = await authenticateCandidate(request.body)

  if (!result) {
    console.warn(`[server] login failure: ${request.body.email}`)
    return response.status(401).json({
      message: 'Invalid email or password.',
    })
  }

  response.cookie(COOKIE_NAME, result.token, getAuthCookieOptions())

  console.info(`[server] login success: ${result.user.email}`)
  return response.status(200).json({
    message: 'Login successful.',
    user: result.user,
  })
}

export async function googleLogin(request, response) {
  console.info('[server] auth route hit: google login')

  const { credential } = request.body

  if (!credential) {
    return response.status(400).json({
      message: 'Google ID token is required.',
    })
  }

  const result = await verifyGoogleToken(credential)

  if (!result) {
    return response.status(401).json({
      message: 'Invalid Google token.',
    })
  }

  response.cookie(COOKIE_NAME, result.token, getAuthCookieOptions())

  console.info(`[server] google login success: ${result.user.email}`)
  return response.status(200).json({
    message: 'Google login successful.',
    user: result.user,
  })
}

export async function loginAdmin(request, response) {
  console.info('[server] auth route hit: admin login')

  const validationError = validateLoginInput(request.body)

  console.log('Validation error:', validationError) // Debug log
  console.log('Request body:', request.body) // Debug log
  

  if (validationError) {
    console.warn('[server] admin login failure: validation')
    return response.status(400).json({
      message: validationError,
    })
  }


  const result = await authenticateAdmin(request.body)

  if (!result) {
    console.warn(`[server] admin login failure: ${request.body.email}`)
    return response.status(401).json({
      message: 'Invalid email or password.',
    })
  }

  response.cookie(COOKIE_NAME, result.token, getAuthCookieOptions())

  console.info(`[server] admin login success: ${result.user.email}`)
  return response.status(200).json({
    message: 'Admin login successful.',
    user: result.user,
  })
}

export function getSession(request, response) {
  console.info('[server] auth route hit: session')
  const token = request.cookies?.[COOKIE_NAME]

  if (!token) {
    return response.status(200).json({
      user: null,
    })
  }

  try {
    request.user = verifyAuthToken(token)

    return response.status(200).json(buildSessionPayload(request))
  } catch {
    return response.status(200).json({
      user: null,
    })
  }
}

export function getAdminSession(request, response) {
  console.info('[server] auth route hit: admin session')
  return response.status(200).json(buildSessionPayload(request))
}

export function logout(_request, response) {
  console.info('[server] auth route hit: logout')
  response.clearCookie(COOKIE_NAME, getAuthCookieOptions())
  return response.status(200).json({
    message: 'Logout successful.',
  })
}

export async function changeAdminPassword(request, response) {
  console.info(`[server] password change requested: ${request.user.email}`)

  const throttle = checkAdminPasswordChangeThrottle(request.user.email)

  if (!throttle.allowed) {
    console.warn(`[server] password change failed: throttled ${request.user.email}`)
    return response.status(429).json({
      message: 'Too many password change attempts. Please try again later.',
    })
  }

  const validation = validateAdminPasswordChangeInput(request.body)

  if (!validation.isValid) {
    console.warn(`[server] password change failed: validation ${request.user.email}`)
    return response.status(400).json({
      errors: validation.errors,
      message: 'Password change request is invalid.',
      success: false,
    })
  }

  const result = await updateAdminPassword({
    currentPassword: request.body.currentPassword,
    email: request.user.email,
    newPassword: request.body.newPassword,
  })

  if (!result.success) {
    console.warn(`[server] password change failed: ${result.code} ${request.user.email}`)
    return response.status(400).json({
      errors: {
        currentPassword: 'Current password is incorrect.',
      },
      message: 'Password change request is invalid.',
      success: false,
    })
  }

  console.info(`[server] password change succeeded: ${request.user.email}`)
  return response.status(200).json({
    message: 'Admin password updated successfully.',
    success: true,
  })
}
