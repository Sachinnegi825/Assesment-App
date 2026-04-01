import mongoose from 'mongoose'
import { AccessLogModel } from '../models/accessLogModel.js'

const MAX_MEMORY_LOGS = 100

const memoryAccessLogs = []

const defaultRepository = {
  async create(entry) {
    return AccessLogModel.create(entry)
  },
  async countDistinctIpAddresses() {
    const values = await AccessLogModel.distinct('ipAddress', {
      ipAddress: { $ne: '' },
    })

    return values.length
  },
  async findRecent(limit) {
    return AccessLogModel.find({})
      .sort({ accessedAt: -1 })
      .limit(limit)
      .lean()
  },
}

let accessLogRepository = defaultRepository

export function normalizeAccessLogEntry(request, response) {
  const forwardedForHeader = request.headers['x-forwarded-for']
  const forwardedFor = Array.isArray(forwardedForHeader)
    ? forwardedForHeader.join(', ')
    : forwardedForHeader || ''
  const ipAddress =
    request.ip ||
    request.headers['x-real-ip'] ||
    request.socket?.remoteAddress ||
    ''
  const country =
    request.headers['cf-ipcountry'] ||
    request.headers['x-vercel-ip-country'] ||
    request.headers['x-country-code'] ||
    ''
  const region =
    request.headers['x-vercel-ip-country-region'] || request.headers['x-region'] || ''
  const city = request.headers['x-vercel-ip-city'] || request.headers['x-city'] || ''
  const sourceLabel = [city, region, country].filter(Boolean).join(', ') || 'Unknown source'

  return {
    accessedAt: new Date(),
    actorEmail: request.user?.email || '',
    city,
    country,
    forwardedFor,
    ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : String(ipAddress),
    method: request.method,
    path: request.originalUrl,
    region,
    sourceLabel,
    statusCode: response.statusCode,
    userRole: request.user?.role || 'anonymous',
  }
}

export async function recordAccessLog(entry) {
  if (!shouldTrackEntry(entry)) {
    return
  }

  if (mongoose.connection.readyState !== 1) {
    pushMemoryAccessLog(entry)
    return
  }

  try {
    await accessLogRepository.create(entry)
  } catch (error) {
    console.warn('[server] access log write failed', error.message)
    pushMemoryAccessLog(entry)
  }
}

export async function getAccessLogOverview(limit = 8) {
  const isUsingDefaultRepository = accessLogRepository === defaultRepository

  if (mongoose.connection.readyState !== 1 && isUsingDefaultRepository) {
    return buildMemoryOverview(limit)
  }

  const [uniqueIpCount, recentAccess] = await Promise.all([
    accessLogRepository.countDistinctIpAddresses(),
    accessLogRepository.findRecent(limit),
  ])

  return {
    recentAccess: recentAccess.map(toAccessLogSummary),
    uniqueIpCount,
  }
}

function buildMemoryOverview(limit) {
  const recentAccess = [...memoryAccessLogs]
    .sort((left, right) => right.accessedAt.getTime() - left.accessedAt.getTime())
    .slice(0, limit)
    .map(toAccessLogSummary)
  const uniqueIpCount = new Set(memoryAccessLogs.map((entry) => entry.ipAddress).filter(Boolean))
    .size

  return {
    recentAccess,
    uniqueIpCount,
  }
}

function toAccessLogSummary(entry) {
  return {
    accessedAt: entry.accessedAt,
    actorEmail: entry.actorEmail || '',
    ipAddress: entry.ipAddress || 'Unavailable',
    method: entry.method,
    path: entry.path,
    sourceLabel: entry.sourceLabel || 'Unknown source',
    statusCode: entry.statusCode,
    userRole: entry.userRole || 'anonymous',
  }
}

function pushMemoryAccessLog(entry) {
  memoryAccessLogs.unshift(entry)

  if (memoryAccessLogs.length > MAX_MEMORY_LOGS) {
    memoryAccessLogs.length = MAX_MEMORY_LOGS
  }
}

function shouldTrackEntry(entry) {
  if (!entry?.path) {
    return false
  }

  if (entry.method === 'OPTIONS') {
    return false
  }

  if (entry.path.startsWith('/api/health')) {
    return false
  }

  return entry.path === '/' || entry.path.startsWith('/api/')
}

export function setAccessLogRepository(repository) {
  accessLogRepository = repository
}

export function resetAccessLogRepository() {
  accessLogRepository = defaultRepository
}

export function resetMemoryAccessLogs() {
  memoryAccessLogs.length = 0
}
