import mongoose from 'mongoose'
import { assessmentDefinition } from '../config/assessmentDefinition.js'
import { AssessmentSubmissionModel } from '../models/assessmentSubmissionModel.js'

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

  const filters = normalizeFilters(searchParams)
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
    items: submissions.map(toAdminTableRow),
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
  const normalizedStatus =
    searchParams.status === 'timer_expired' || searchParams.status === 'manual_submit'
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

  if (filters.status !== 'all') {
    mongoFilter.reason = filters.status
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

function toAdminTableRow(submission) {
  const answers = normalizeAnswers(submission.answers)
  const score = calculateScore(answers)

  return {
    age: submission.candidateDetails?.age || '',
    assessmentId: submission.assessmentId,
    assessmentTitle: assessmentDefinition.metadata.assessmentTitle,
    candidateEmail: submission.candidateDetails?.email || '',
    candidateName: submission.candidateDetails?.fullName || 'Unnamed candidate',
    completionStatus: 
  submission.reason === 'manual_submit' ? 'Completed manually' :
  submission.reason === 'timer_expired' ? 'Expired on timer' :
  submission.reason === 'integrity_violation_limit' ? 'Terminated: Security violations' :
  submission.reason === 'user_signout' ? 'Partial: Signed out' :
  submission.reason === 'user_left_tab_or_window' ? 'Partial: Tab switched' :
  submission.reason === 'user_closed_tab_or_browser' ? 'Partial: Browser closed' :
  'Auto-saved progress',
    location: submission.candidateDetails?.location || '',
    roleApplied: submission.candidateDetails?.roleApplied || '',
    score,
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
