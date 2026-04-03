import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { AdminUserModel } from '../models/adminUserModel.js'

const ADMIN_NAME = 'SidLabs Evaluator'
const PASSWORD_SALT_ROUNDS = 12

const defaultRepository = {
  async findByEmail(email) {
    return AdminUserModel.findOne({ email }).lean()
  },
  async updatePasswordByEmail(email, update) {
    return AdminUserModel.findOneAndUpdate(
      { email },
      {
        $set: {
          passwordChangedAt: update.passwordChangedAt,
          passwordHash: update.passwordHash,
        },
      },
      {
        new: true,
      },
    ).lean()
  },
}

let adminUserRepository = defaultRepository

export async function hashPassword(password) {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS)
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash)
}

export async function ensureSeedAdminUser() {
  if (mongoose.connection.readyState !== 1) {
    return false
  }

  if (!env.adminInitialPassword) {
    console.warn('[server] admin seed skipped: ADMIN_INITIAL_PASSWORD is not set')
    return false
  }

  const normalizedEmail = env.adminEmail.trim().toLowerCase()
  const existingAdmin = await AdminUserModel.findOne({ email: normalizedEmail }).lean()

  if (existingAdmin) {
    return true
  }

  const passwordHash = await hashPassword(env.adminInitialPassword)

  await AdminUserModel.create({
    email: normalizedEmail,
    name: ADMIN_NAME,
    passwordHash,
    role: 'admin',
  })

  console.info(`[server] admin account seeded: ${normalizedEmail}`)
  return true
}

export async function findAdminUserByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase()

  return adminUserRepository.findByEmail(normalizedEmail)
}

export function validateAdminPasswordChangeInput({
  confirmNewPassword,
  currentPassword,
  newPassword,
} = {}) {
  const errors = {}

  if (!currentPassword) {
    errors.currentPassword = 'Current password is required.'
  }

  if (!newPassword) {
    errors.newPassword = 'New password is required.'
  } else {
    if (newPassword.length < 12) {
      errors.newPassword = 'New password must be at least 12 characters.'
    } else if (!/[a-z]/.test(newPassword)) {
      errors.newPassword = 'New password must include at least one lowercase letter.'
    } else if (!/[A-Z]/.test(newPassword)) {
      errors.newPassword = 'New password must include at least one uppercase letter.'
    } else if (!/\d/.test(newPassword)) {
      errors.newPassword = 'New password must include at least one number.'
    } else if (!/[^A-Za-z0-9]/.test(newPassword)) {
      errors.newPassword = 'New password must include at least one special character.'
    } else if (newPassword === currentPassword) {
      errors.newPassword = 'New password must be different from the current password.'
    }
  }

  if (!confirmNewPassword) {
    errors.confirmNewPassword = 'Please confirm the new password.'
  } else if (newPassword && confirmNewPassword !== newPassword) {
    errors.confirmNewPassword = 'Confirmation does not match the new password.'
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  }
}

export function checkAdminPasswordChangeThrottle(_email) {
  return {
    allowed: true,
  }
}

export async function updateAdminPassword({
  currentPassword,
  email,
  newPassword,
}) {
  const adminUser = await findAdminUserByEmail(email)


  if (!adminUser) {
    return {
      code: 'ADMIN_NOT_FOUND',
      success: false,
    }
  }

  const isCurrentPasswordValid = await verifyPassword(currentPassword, adminUser.passwordHash)

  if (!isCurrentPasswordValid) {
    return {
      code: 'INVALID_CURRENT_PASSWORD',
      success: false,
    }
  }

  const passwordHash = await hashPassword(newPassword)
  const passwordChangedAt = new Date()
  const updatedAdmin = await adminUserRepository.updatePasswordByEmail(email, {
    passwordChangedAt,
    passwordHash,
  })

  return {
    adminUser: updatedAdmin,
    success: true,
  }
}

export function toAdminSessionUser(adminUser) {
  return {
    email: adminUser.email,
    id: String(adminUser._id || adminUser.id),
    name: adminUser.name || ADMIN_NAME,
    role: 'admin',
  }
}

export function setAdminUserRepository(repository) {
  adminUserRepository = repository
}

export function resetAdminUserRepository() {
  adminUserRepository = defaultRepository
}
