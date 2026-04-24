import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AppRoutes from './AppRoutes'
import SiteFooter from './components/SiteFooter'
import { AssessmentContext } from './context/assessmentContextObject'
import { assessmentDefinition } from './data/assessmentDefinition'
import { AuthContext } from './context/authContextObject'
import {
  createAssessmentSession,
  formatRemainingTime,
  getSecondsRemaining,
} from './utils/assessmentEngine'
import { validateAdminPasswordForm } from './utils/adminPasswordValidation'
import { validateCandidateDetails } from './utils/candidateDetailsValidation'
import { validateLoginForm } from './utils/loginValidation'

function renderWithProviders(route, authValue, assessmentValue) {
  return render(
    <AuthContext.Provider value={authValue}>
      <AssessmentContext.Provider value={assessmentValue}>
        <MemoryRouter initialEntries={[route]}>
          <AppRoutes />
        </MemoryRouter>
      </AssessmentContext.Provider>
    </AuthContext.Provider>,
  )
}

describe('login validation', () => {
  it('returns field errors for invalid input', () => {
    expect(validateLoginForm({ email: 'bad-email', password: '123' })).toEqual({
      email: 'Enter a valid email address.',
      password: 'Password must be at least 8 characters.',
    })
  })

  it('passes valid login input', () => {
    expect(
      validateLoginForm({
        email: 'candidate@sidlabs.com',
        password: 'SidLabs@2026',
      }),
    ).toEqual({})
  })
})

describe('candidate details validation', () => {
  it('returns strict email validation errors', () => {
    expect(
      validateCandidateDetails({
        age: '23',
        email: 'candidate..bad@sidlabs',
        fullName: 'Sid Demo',
        location: 'Bengaluru',
        roleApplied: 'Product Analyst',
      }),
    ).toEqual({
      email: 'Enter a valid email address.',
    })
  })
})

describe('admin password validation', () => {
  it('returns a mismatch error when confirmation differs', () => {
    expect(
      validateAdminPasswordForm({
        confirmNewPassword: 'DifferentAdmin!2026',
        currentPassword: 'AdminStageA4!Pass',
        newPassword: 'ChangedAdmin!2026',
      }),
    ).toEqual({
      confirmNewPassword: 'Confirmation does not match the new password.',
    })
  })
})

describe('assessment timer utilities', () => {
  it('initializes the timer from assessment metadata', () => {
    const session = createAssessmentSession(assessmentDefinition.metadata, 1000)

    expect(session.durationInMinutes).toBe(25)
    expect(session.expiresAt).toBe(1501000)
  })

  it('formats remaining time and clamps at zero', () => {
    const session = createAssessmentSession(assessmentDefinition.metadata, 0)

    expect(getSecondsRemaining(session, 2000)).toBe(1498)
    expect(getSecondsRemaining(session, 2000000)).toBe(0)
    expect(formatRemainingTime(65)).toBe('01:05')
  })
})

describe('assessment flow', () => {
  const authState = {
    isAuthenticated: true,
    isAdmin: false,
    isAuthLoading: false,
    loginAdmin: async () => {},
    login: async () => {},
    logout: async () => {},
    user: {
      email: 'candidate@sidlabs.com',
      name: 'demo Candidate',
      role: 'candidate',
    },
  }

  const adminAuthState = {
    isAuthenticated: true,
    isAdmin: true,
    isAuthLoading: false,
    loginAdmin: async () => {},
    login: async () => {},
    logout: async () => {},
    user: {
      email: 'evaluator@sidlabs.net',
      name: 'Evaluator',
      role: 'admin',
    },
  }

  const baseAssessmentState = {
    assessmentDefinition,
    answers: {
      1: null,
      2: 'C',
      3: null,
    },
    assessmentSession: createAssessmentSession(assessmentDefinition.metadata, Date.now()),
    candidateDetails: {
      age: '23',
      email: 'candidate@sidlabs.com',
      fullName: 'Sid Demo',
      location: 'Bengaluru',
      roleApplied: 'Product Analyst',
    },
    currentQuestionIndex: 0,
    completionState: {
      message: '',
      status: 'idle',
    },
    goToQuestion: vi.fn(),
    saveCandidateDetails: vi.fn(),
    setAnswer: vi.fn(),
    startAssessment: vi.fn(),
    submissionSnapshot: null,
    submissionResult: null,
    submitAssessment: vi.fn(),
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-24T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders metadata on the explainer page', () => {
    renderWithProviders('/assessment-instructions', authState, baseAssessmentState)

    expect(
      screen.getByText('Platoputer Research Assistant Pre-Assessment'),
    ).toBeInTheDocument()
    expect(screen.getByText('25 minutes')).toBeInTheDocument()
  })

  it('opens a consent modal before continuing from candidate details', () => {
    renderWithProviders('/candidate-details', authState, baseAssessmentState)

    fireEvent.click(screen.getByRole('button', { name: 'Continue to Instructions' }))

    expect(screen.getByText('Data collection consent')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Disagree' }))

    expect(screen.queryByText('Data collection consent')).not.toBeInTheDocument()
    expect(screen.getByText('Candidate Details')).toBeInTheDocument()
  })

  it('preserves selected answers while navigating between questions', () => {
    renderWithProviders('/assessment', authState, baseAssessmentState)

    fireEvent.click(screen.getByRole('radio', { name: /5/i }))
    expect(baseAssessmentState.setAnswer).toHaveBeenCalledWith(1, 'C')

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(baseAssessmentState.goToQuestion).toHaveBeenCalledWith(1)
  })

  it('shows current progress and disables broken navigation states', () => {
    renderWithProviders('/assessment', authState, baseAssessmentState)

    expect(screen.getByText('Question 1 of 25')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
  })

  it('auto-submits when the timer expires', () => {
    const expiryState = {
      ...baseAssessmentState,
      assessmentSession: {
        assessmentId: assessmentDefinition.metadata.assessmentId,
        durationInMinutes: assessmentDefinition.metadata.durationInMinutes,
        expiresAt: Date.now() + 1000,
        startedAt: Date.now() - 1499000,
        status: 'in_progress',
      },
    }

    renderWithProviders('/assessment', authState, expiryState)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(expiryState.submitAssessment).toHaveBeenCalledWith('timer_expired')
  })

  it('redirects completed attempts to the thank-you page', () => {
    const completedState = {
      ...baseAssessmentState,
      assessmentSession: {
        ...baseAssessmentState.assessmentSession,
        status: 'submitted',
      },
      completionState: {
        message: 'Assessment submitted successfully.',
        status: 'success',
      },
      submissionSnapshot: {
        reason: 'manual_submit',
        submittedAt: '2026-03-24T12:20:00.000Z',
      },
    }

    renderWithProviders('/assessment', authState, completedState)

    expect(screen.getByText('Thank You')).toBeInTheDocument()
    expect(screen.getByText('Response received')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exit' })).toBeInTheDocument()
  })

  it('shows submission failure feedback without redirecting away', () => {
    const failureState = {
      ...baseAssessmentState,
      completionState: {
        message: 'Assessment submission could not be processed.',
        status: 'error',
      },
    }

    renderWithProviders('/assessment', authState, failureState)

    expect(
      screen.getByText('Assessment submission could not be processed.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Question 1 of 25')).toBeInTheDocument()
  })

  it('keeps unauthenticated users out of protected assessment routes', () => {
    renderWithProviders(
      '/assessment',
      {
        isAuthenticated: false,
        isAdmin: false,
        isAuthLoading: false,
        loginAdmin: async () => {},
        login: async () => {},
        logout: async () => {},
        user: null,
      },
      baseAssessmentState,
    )

    expect(screen.getByText('Candidate login')).toBeInTheDocument()
  })

  it('renders the shared sidlabs footer on public routes', () => {
    render(<SiteFooter />)

    expect(screen.getByText('Get In Touch')).toBeInTheDocument()
    expect(screen.getByText(/connect@sidlabs.net/i)).toBeInTheDocument()
  })

  it('keeps unauthenticated users out of admin routes', () => {
    renderWithProviders(
      '/admin/dashboard',
      {
        isAuthenticated: false,
        isAdmin: false,
        isAuthLoading: false,
        loginAdmin: async () => {},
        login: async () => {},
        logout: async () => {},
        user: null,
      },
      baseAssessmentState,
    )

    expect(screen.getByText('Admin login')).toBeInTheDocument()
  })

  it('redirects candidate users away from admin-only routes', () => {
    renderWithProviders('/admin/dashboard', authState, baseAssessmentState)

    expect(screen.getByText('Start Assessment')).toBeInTheDocument()
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument()
  })

  it('redirects admin users away from candidate-only routes', () => {
    renderWithProviders('/dashboard', adminAuthState, baseAssessmentState)

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Start Assessment')).not.toBeInTheDocument()
  })

  it('renders fetched access log rows on the admin dashboard', async () => {
    vi.useRealTimers()

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            accessOverview: {
              recentAccess: [
                {
                  accessedAt: '2026-03-24T13:25:00.000Z',
                  actorEmail: 'evaluator@sidlabs.net',
                  ipAddress: '203.0.113.10',
                  method: 'POST',
                  path: '/api/auth/admin/login',
                  sourceLabel: 'Bengaluru, KA, IN',
                  statusCode: 200,
                  userRole: 'admin',
                },
              ],
              uniqueIpCount: 3,
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
            statusBreakdown: [],
          },
          success: true,
        }),
      }),
    )

    renderWithProviders('/admin/dashboard', adminAuthState, baseAssessmentState)

    expect(await screen.findByText('203.0.113.10')).toBeInTheDocument()
    expect(screen.getByText('Recent IP and source signals')).toBeInTheDocument()
  })

  it('renders fetched admin submission rows in the table view', async () => {
    vi.useRealTimers()

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            filters: {
              query: '',
              status: 'all',
            },
            items: [
              {
                age: '24',
                assessmentId: 'platoputer-research-assistant-pre-assessment',
                assessmentTitle: 'Platoputer Research Assistant Pre-Assessment',
                candidateEmail: 'candidate@sidlabs.com',
                candidateName: 'Sid Demo',
                completionStatus: 'Completed manually',
                location: 'Bengaluru',
                roleApplied: 'Research Analyst',
                score: 18,
                submissionTime: '2026-03-24T14:00:00.000Z',
              },
            ],
            pagination: {
              hasNextPage: false,
              hasPreviousPage: false,
              page: 1,
              totalItems: 1,
              totalPages: 1,
            },
          },
          success: true,
        }),
      }),
    )

    renderWithProviders('/admin/submissions', adminAuthState, baseAssessmentState)

    expect(await screen.findByText('Sid Demo')).toBeInTheDocument()
    expect(screen.getByText('Research Analyst')).toBeInTheDocument()
    expect(screen.getAllByText('Completed manually')).toHaveLength(2)
  })

  it('renders the admin settings password form for admin users', () => {
    renderWithProviders('/admin/settings', adminAuthState, baseAssessmentState)

    expect(screen.getByText('Change admin password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update password' })).toBeInTheDocument()
  })
})
