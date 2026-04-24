import mongoose from 'mongoose'
import { assessmentDefinition } from '../config/assessmentDefinition.js'
import { AssessmentSubmissionModel } from '../models/assessmentSubmissionModel.js'
import { getGlobalSettings } from './adminSettingsService.js'

const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 25

const defaultRepository = {
  countDocuments(filter) {
    return AssessmentSubmissionModel.countDocuments(filter)
  },
  findSubmissions(filter, { limit, skip }) {
    return AssessmentSubmissionModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
  },
}

let adminSubmissionRepository = defaultRepository

export async function getAdminSubmissionTableData(searchParams = {}) {
  const isUsingDefaultRepository = adminSubmissionRepository === defaultRepository

  if (isUsingDefaultRepository && mongoose.connection.readyState !== 1) {
    throw new Error('database_unavailable')
  }

  const [filters, settings] = await Promise.all([
    normalizeFilters(searchParams),
    getGlobalSettings(),
  ])
  
  const mongoFilter = buildMongoFilter(filters)
  const skip = (filters.page - 1) * filters.limit

  const [totalItems, submissions] = await Promise.all([
    adminSubmissionRepository.countDocuments(mongoFilter),
    adminSubmissionRepository.findSubmissions(mongoFilter, {
      limit: filters.limit,
      skip,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalItems / filters.limit))

  return {
    filters: {
      query: filters.query,
      status: filters.status,
    },
    items: submissions.map(submission => toAdminTableRow(submission, settings)),
    pagination: {
      hasNextPage: filters.page < totalPages,
      hasPreviousPage: filters.page > 1,
      limit: filters.limit,
      page: filters.page,
      totalItems,
      totalPages,
    },
  }
}

function normalizeFilters(searchParams) {
  const requestedLimit = Number.parseInt(searchParams.limit, 10)
  const requestedPage = Number.parseInt(searchParams.page, 10)
  
  // UPDATED: Allow integrity_violation_limit and partial in normalization
  const validStatuses = [
    'manual_submit', 
    'timer_expired', 
    'integrity_violation_limit', 
    'partial'
  ]
  
  const normalizedStatus = validStatuses.includes(searchParams.status)
    ? searchParams.status
    : 'all'

  return {
    limit:
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE,
    page: Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    query: typeof searchParams.query === 'string' ? searchParams.query.trim() : '',
    status: normalizedStatus,
  }
}

function buildMongoFilter(filters) {
  const mongoFilter = {}

  // UPDATED: Handle partial category vs specific reasons
  if (filters.status !== 'all') {
    if (filters.status === 'partial') {
      mongoFilter.reason = { 
        $in: ['user_signout', 'user_left_tab_or_window', 'user_closed_tab_or_browser', 'auto_save'] 
      }
    } else {
      mongoFilter.reason = filters.status
    }
  }

  if (filters.query) {
    const queryRegex = new RegExp(escapeRegex(filters.query), 'i')

    mongoFilter.$or = [
      { 'candidateDetails.fullName': queryRegex },
      { 'candidateDetails.email': queryRegex },
      { 'candidateDetails.location': queryRegex },
      { 'candidateDetails.roleApplied': queryRegex },
    ]
  }

  return mongoFilter
}

function toAdminTableRow(submission, settings) {
  const answers = normalizeAnswers(submission.answers)
  const score = calculateScore(answers)
  
  const maxScore = assessmentDefinition.sourceQuestions.reduce((acc, q) => {
    return acc + (assessmentDefinition.scoring.correct || q.score || 0)
  }, 0)
  
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  const isQualified = percentage >= (settings?.qualifyingThreshold || 60)

  return {
    age: submission.candidateDetails?.age || '',
    assessmentId: submission.assessmentId,
    assessmentTitle: assessmentDefinition.metadata.assessmentTitle,
    candidateEmail: submission.candidateDetails?.email || '',
    candidateName: submission.candidateDetails?.fullName || 'Unnamed candidate',
    completionStatus: 
      submission.reason === 'manual_submit' ? 'Completed manually' :
      submission.reason === 'timer_expired' ? 'Expired on timer' :
      submission.reason === 'integrity_violation_limit' ? 'Security violation' :
      submission.reason === 'user_signout' ? 'Partial: Signed out' :
      submission.reason === 'user_left_tab_or_window' ? 'Partial: Tab switched' :
      submission.reason === 'user_closed_tab_or_browser' ? 'Partial: Browser closed' :
      submission.reason === 'auto_save' ? 'Auto-saved progress' :
      submission.reason?.startsWith('violation_') ? 'Partial: Security warning' :
      'Incomplete attempt',
    location: submission.candidateDetails?.location || '',
    roleApplied: submission.candidateDetails?.roleApplied || '',
    score,
    maxScore,
    percentage,
    isQualified,
    submissionTime: submission.submittedAt,
  }
}

function normalizeAnswers(answers) {
  if (!answers) {
    return {}
  }

  if (answers instanceof Map) {
    return Object.fromEntries(answers.entries())
  }

  return answers
}

function calculateScore(answers) {
  let score = 0

  for (const question of assessmentDefinition.sourceQuestions) {
    const answer = answers[String(question.id)] || null

    if (!answer) {
      score += assessmentDefinition.scoring.unanswered || 0
      continue
    }

    // Check if the provided answer is in the correct answers array
    if (question.ans.includes(answer)) {
      score += assessmentDefinition.scoring.correct || question.score || 0
      continue
    }

    score += assessmentDefinition.scoring.incorrect || 0
  }

  return score
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function setAdminSubmissionRepository(repository) {
  adminSubmissionRepository = repository
}

export function resetAdminSubmissionRepository() {
  adminSubmissionRepository = defaultRepository
}