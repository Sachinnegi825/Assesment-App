import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AdminWorkspaceNav from '../components/AdminWorkspaceNav'
import SessionShell from '../components/SessionShell'
import { fetchAdminSubmissions } from '../services/api'

function formatSubmissionTime(value) {
  if (!value) {
    return 'No timestamp available'
  }

  const timestamp = new Date(value)

  if (Number.isNaN(timestamp.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp)
}

function AdminSubmissionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [formState, setFormState] = useState({
    query: searchParams.get('query') || '',
    status: searchParams.get('status') || 'all',
  })

  const page = Number.parseInt(searchParams.get('page') || '1', 10) || 1
  const limit = Number.parseInt(searchParams.get('limit') || '10', 10) || 10
  const query = searchParams.get('query') || ''
  const status = searchParams.get('status') || 'all'

  useEffect(() => {
    setFormState({
      query,
      status,
    })
  }, [query, status])

  useEffect(() => {
    let isMounted = true

    async function loadSubmissions() {
      try {
        setIsLoading(true)
        setErrorMessage('')

        const payload = await fetchAdminSubmissions({
          limit,
          page,
          query,
          status,
        })

        if (isMounted) {
          setData(payload.data)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || 'Submission records could not be loaded.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSubmissions()

    return () => {
      isMounted = false
    }
  }, [limit, page, query, status])

  function updateSearchParams(nextValues) {
    const nextParams = new URLSearchParams()

    nextParams.set('page', String(nextValues.page || 1))
    nextParams.set('limit', String(nextValues.limit || limit))

    if (nextValues.query) {
      nextParams.set('query', nextValues.query)
    }

    if (nextValues.status && nextValues.status !== 'all') {
      nextParams.set('status', nextValues.status)
    }

    setSearchParams(nextParams)
  }

  function handleFormChange(event) {
    const { name, value } = event.target

    setFormState((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleSearchSubmit(event) {
    event.preventDefault()
    updateSearchParams({
      limit,
      page: 1,
      query: formState.query.trim(),
      status: formState.status,
    })
  }

  function handleResetFilters() {
    setFormState({
      query: '',
      status: 'all',
    })
    setSearchParams(
      new URLSearchParams({
        limit: String(limit),
        page: '1',
      }),
    )
  }

  function handlePageChange(nextPage) {
    updateSearchParams({
      limit,
      page: nextPage,
      query,
      status,
    })
  }

  const items = data?.items || []
  const pagination = data?.pagination || {
    hasNextPage: false,
    hasPreviousPage: false,
    page,
    totalItems: 0,
    totalPages: 1,
  }

  return (
    <SessionShell
      action={
        <div className="admin-header-actions">
          <Link className="secondary-button secondary-button--tight" to="/admin/settings">
            Account Settings
          </Link>
          <Link className="secondary-button secondary-button--tight" to="/admin/dashboard">
            Back to Dashboard
          </Link>
        </div>
      }
      eyebrow="Evaluator workspace"
      logoutRedirectTo="/admin/login"
      subtitle="Search, scan, and review submitted candidate records from MongoDB in a clean evaluator table."
      title="Submission Table"
    >
      <AdminWorkspaceNav />

      <section className="dashboard-grid dashboard-grid--single">
        <article className="dashboard-panel">
          <div className="admin-table-toolbar">
            <div>
              <p className="info-card__label">Submission records</p>
              <h2>Candidate assessment data</h2>
              <p className="dashboard-panel__copy">
                Review stored candidate and assessment fields with lightweight search
                and status filtering.
              </p>
            </div>

            <form className="admin-filter-form" onSubmit={handleSearchSubmit}>
              <label className="field field--compact">
                <span>Search</span>
                <input
                  className="input"
                  name="query"
                  onChange={handleFormChange}
                  placeholder="Name, email, location, role"
                  type="search"
                  value={formState.query}
                />
              </label>

              <label className="field field--compact">
                <span>Status</span>
                <select
                  className="input"
                  name="status"
                  onChange={handleFormChange}
                  value={formState.status}
                >
                  <option value="all">All statuses</option>
                  <option value="manual_submit">Completed manually</option>
                  <option value="timer_expired">Expired on timer</option>
                </select>
              </label>

              <div className="admin-filter-actions">
                <button className="primary-button primary-button--admin" type="submit">
                  Apply
                </button>
                <button
                  className="secondary-button secondary-button--tight"
                  onClick={handleResetFilters}
                  type="button"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          <div className="admin-table-summary">
            <span>{pagination.totalItems} record(s)</span>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
          </div>

          {errorMessage ? (
            <div className="form-message form-message--error" role="alert">
              {errorMessage}
            </div>
          ) : null}

          {isLoading ? (
            <p className="dashboard-empty">Loading submission records…</p>
          ) : items.length === 0 ? (
            <p className="dashboard-empty">
              No submission records match the current filters.
            </p>
          ) : (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table dashboard-table--dense">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Age</th>
                    <th>Location</th>
                    <th>Role</th>
                    <th>Assessment</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={`${item.candidateEmail}-${item.submissionTime}`}>
                      <td>
                        <strong>{item.candidateName}</strong>
                        <span>{item.candidateEmail}</span>
                      </td>
                      <td>{item.age || 'N/A'}</td>
                      <td>{item.location || 'N/A'}</td>
                      <td>{item.roleApplied || 'N/A'}</td>
                      <td>
                        <strong>{item.assessmentTitle}</strong>
                        <span>{item.assessmentId}</span>
                      </td>
                      <td>
                        <span
                          className={`dashboard-badge dashboard-badge--${
                            item.completionStatus === 'Expired on timer'
                              ? 'warning'
                              : 'success'
                          }`}
                        >
                          {item.completionStatus}
                        </span>
                      </td>
                      <td>{item.score}</td>
                      <td>{formatSubmissionTime(item.submissionTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="admin-pagination">
            <button
              className="secondary-button secondary-button--tight"
              disabled={!pagination.hasPreviousPage || isLoading}
              onClick={() => handlePageChange(pagination.page - 1)}
              type="button"
            >
              Previous
            </button>
            <button
              className="secondary-button secondary-button--tight"
              disabled={!pagination.hasNextPage || isLoading}
              onClick={() => handlePageChange(pagination.page + 1)}
              type="button"
            >
              Next
            </button>
          </div>
        </article>
      </section>
    </SessionShell>
  )
}

export default AdminSubmissionsPage
