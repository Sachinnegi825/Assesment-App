import jwt from 'jsonwebtoken'
import { env } from './env.js'

const TOKEN_EXPIRY = '8h'
const COOKIE_NAME = 'assessment_token'

export function signAuthToken(payload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: TOKEN_EXPIRY,
  })
}

export function verifyAuthToken(token) {
  return jwt.verify(token, env.jwtSecret)
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
  }
}

export { COOKIE_NAME }
