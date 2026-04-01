const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:5001'

async function request(path, options = {}) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    })
  } catch (error) {
    const networkError = new Error(
      `Unable to reach the server at ${API_BASE_URL}. Start the backend and try again.`,
    )

    networkError.code = 'NETWORK_ERROR'
    networkError.cause = error

    throw networkError
  }

  let payload = null

  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const error = new Error(
      payload?.message || `Request failed with status ${response.status}`,
    )

    error.details = payload?.errors || null

    throw error
  }

  return payload
}

export function fetchSession() {
  return request('/api/auth/session')
}

export function loginCandidate(credentials) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function loginAdmin(credentials) {
  return request('/api/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function logoutCandidate() {
  return request('/api/auth/logout', {
    method: 'POST',
  })
}

export function fetchAdminDashboard() {
  return request('/api/admin/dashboard')
}

export function fetchAdminSubmissions(params = {}) {
  const searchParams = new URLSearchParams()

  if (params.page) {
    searchParams.set('page', String(params.page))
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit))
  }

  if (params.query) {
    searchParams.set('query', params.query)
  }

  if (params.status && params.status !== 'all') {
    searchParams.set('status', params.status)
  }

  const queryString = searchParams.toString()

  return request(`/api/admin/submissions${queryString ? `?${queryString}` : ''}`)
}

export function changeAdminPassword(payload) {
  return request('/api/auth/admin/password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function validateCandidateDetailsOnServer(candidateDetails) {
  return request('/api/candidate-details/validate', {
    method: 'POST',
    body: JSON.stringify(candidateDetails),
  })
}

export function submitAssessmentPayload(payload) {
  return request('/api/submissions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export { API_BASE_URL }
