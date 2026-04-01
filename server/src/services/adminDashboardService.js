import mongoose from 'mongoose'
import { getAccessLogOverview } from './accessLogService.js'
import { AssessmentSubmissionModel } from '../models/assessmentSubmissionModel.js'

const EMPTY_DASHBOARD = {
  accessOverview: {
    recentAccess: [],
    uniqueIpCount: 0,
  },
  activity: [],
  latestSubmissions: [],
  overview: {
    completedAssessments: 0,
    completionRate: 0,
    expiredAssessments: 0,
    incompleteAttempts: null,
    incompleteTracked: false,
    totalCandidates: 0,
    totalSubmissions: 0,
  },
  statusBreakdown: [
    {
      count: 0,
      label: 'Completed manually',
      tone: 'success',
    },
    {
      count: 0,
      label: 'Expired on timer',
      tone: 'warning',
    },
    {
      count: null,
      label: 'Incomplete attempts',
      tone: 'neutral',
    },
  ],
}

const defaultRepository = {
  async getDashboardSnapshot() {
    const [result] = await AssessmentSubmissionModel.aggregate([
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                completedAssessments: {
                  $sum: {
                    $cond: [{ $eq: ['$reason', 'manual_submit'] }, 1, 0],
                  },
                },
                expiredAssessments: {
                  $sum: {
                    $cond: [{ $eq: ['$reason', 'timer_expired'] }, 1, 0],
                  },
                },
                totalSubmissions: { $sum: 1 },
              },
            },
          ],
          totalCandidates: [
            {
              $group: {
                _id: '$candidateDetails.email',
              },
            },
            { $count: 'totalCandidates' },
          ],
          latestSubmissions: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 0,
                candidateEmail: '$candidateDetails.email',
                candidateName: '$candidateDetails.fullName',
                location: '$candidateDetails.location',
                reason: 1,
                roleApplied: '$candidateDetails.roleApplied',
                submittedAt: 1,
              },
            },
          ],
        },
      },
    ])

    return result || {
      latestSubmissions: [],
      overview: [],
      totalCandidates: [],
    }
  },
}

let adminDashboardRepository = defaultRepository

export async function getAdminDashboardData() {
  const isUsingDefaultRepository = adminDashboardRepository === defaultRepository

  if (isUsingDefaultRepository && mongoose.connection.readyState !== 1) {
    throw new Error('database_unavailable')
  }

  const snapshot = await adminDashboardRepository.getDashboardSnapshot()
  const accessOverview = await getAccessLogOverview()
  const overview = snapshot.overview?.[0]
  const totalCandidates = snapshot.totalCandidates?.[0]?.totalCandidates || 0
  const totalSubmissions = overview?.totalSubmissions || 0
  const completedAssessments = overview?.completedAssessments || 0
  const expiredAssessments = overview?.expiredAssessments || 0

  if (totalSubmissions === 0) {
    return {
      ...EMPTY_DASHBOARD,
      accessOverview,
    }
  }

  const latestSubmissions = (snapshot.latestSubmissions || []).map((submission) => ({
    candidateEmail: submission.candidateEmail,
    candidateName: submission.candidateName,
    location: submission.location,
    reason: submission.reason,
    roleApplied: submission.roleApplied,
    statusLabel:
      submission.reason === 'timer_expired' ? 'Expired on timer' : 'Completed manually',
    submittedAt: submission.submittedAt,
  }))

  return {
    accessOverview,
    activity: latestSubmissions.map((submission) => ({
      detail: `${submission.roleApplied || 'Assessment candidate'} from ${
        submission.location || 'Unknown location'
      }`,
      submittedAt: submission.submittedAt,
      title: `${submission.candidateName || submission.candidateEmail} ${submission.statusLabel.toLowerCase()}`,
      tone: submission.reason === 'timer_expired' ? 'warning' : 'success',
    })),
    latestSubmissions,
    overview: {
      completedAssessments,
      completionRate: Math.round((completedAssessments / totalSubmissions) * 100),
      expiredAssessments,
      incompleteAttempts: null,
      incompleteTracked: false,
      totalCandidates,
      totalSubmissions,
    },
    statusBreakdown: [
      {
        count: completedAssessments,
        label: 'Completed manually',
        tone: 'success',
      },
      {
        count: expiredAssessments,
        label: 'Expired on timer',
        tone: 'warning',
      },
      {
        count: null,
        label: 'Incomplete attempts',
        tone: 'neutral',
      },
    ],
  }
}

export function setAdminDashboardRepository(repository) {
  adminDashboardRepository = repository
}

export function resetAdminDashboardRepository() {
  adminDashboardRepository = defaultRepository
}
