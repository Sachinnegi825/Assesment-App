import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminWorkspaceNav from '../components/AdminWorkspaceNav'
import SessionShell from '../components/SessionShell'
import { fetchAdminDashboard } from '../services/api'

function formatDashboardTimestamp(value) {
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

function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      try {
        setIsLoading(true)
        setErrorMessage('')
        const payload = await fetchAdminDashboard()

        if (isMounted) {
          setDashboard(payload.data)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || 'Dashboard data could not be loaded.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  const overview = dashboard?.overview || {
    completedAssessments: 0,
    completionRate: 0,
    expiredAssessments: 0,
    incompleteAttempts: null,
    incompleteTracked: false,
    totalCandidates: 0,
    totalSubmissions: 0,
  }

  const latestSubmissions = dashboard?.latestSubmissions || []
  const statusBreakdown = dashboard?.statusBreakdown || []
  const activity = dashboard?.activity || []
  const accessOverview = dashboard?.accessOverview || {
    recentAccess: [],
    uniqueIpCount: 0,
  }

  console.log("latest suvmies",latestSubmissions)

  return (
    <SessionShell
      action={
        <div className="status-card__detail">
          Live dashboard context from Mongo-backed submission records.
        </div>
      }
      eyebrow="Evaluator workspace"
      logoutRedirectTo="/admin/login"
      subtitle="Review completion signals, recent assessment movement, and current submission health from the evaluator workspace."
      title="Admin Dashboard"
    >
      <AdminWorkspaceNav />

      <section className="dashboard-grid">
        <article className="dashboard-panel dashboard-panel--hero">
          <p className="info-card__label">Operational summary</p>
          <h2>Assessment activity at a glance</h2>
          <p className="dashboard-panel__copy">
            Use this dashboard to track current submission volume, completion quality,
            and the most recent assessment activity entering the platform.
          </p>
          <div className="dashboard-quick-actions">
            <div className="dashboard-chip">Mongo-backed metrics</div>
            <div className="dashboard-chip">Admin-only access</div>
            <div className="dashboard-chip">Live submission summary</div>
          </div>
          <div className="dashboard-hero-actions">
            <Link className="primary-button primary-button--admin" to="/admin/submissions">
              Open Submission Table
            </Link>
            <Link className="secondary-button secondary-button--tight" to="/admin/settings">
              Account Settings
            </Link>
          </div>
        </article>

        <article className="dashboard-panel dashboard-panel--side">
          <p className="info-card__label">Quick actions</p>
          <h2>Next evaluator steps</h2>
          <ul className="dashboard-list">
            <li>Review recent submissions for screening signals.</li>
            <li>Track timer-expired attempts against manual completions.</li>
            <li>Prepare the table review stage for candidate-level inspection.</li>
          </ul>
          <Link className="auth-inline-link" to="/admin/submissions">
            Go to detailed table view
          </Link>
          <Link className="auth-inline-link" to="/admin/settings">
            Update admin password
          </Link>
        </article>
      </section>

      {errorMessage ? (
        <section className="dashboard-grid dashboard-grid--single">
          <article className="dashboard-panel dashboard-panel--error">
            <p className="info-card__label">Dashboard unavailable</p>
            <h2>Data could not be loaded</h2>
            <p>{errorMessage}</p>
          </article>
        </section>
      ) : null}

      <section className="dashboard-overview-grid">
        <article className="metric-card">
          <p className="info-card__label">Candidates</p>
          <h2>{overview.totalCandidates}</h2>
          <p>Distinct applicants represented in stored submissions.</p>
        </article>

        <article className="metric-card">
          <p className="info-card__label">Submissions</p>
          <h2>{overview.totalSubmissions}</h2>
          <p>Total assessment payloads stored in MongoDB.</p>
        </article>

        <article className="metric-card">
          <p className="info-card__label">Completed</p>
          <h2>{overview.completedAssessments}</h2>
          <p>Manual completions successfully submitted by candidates.</p>
        </article>

        <article className="metric-card">
          <p className="info-card__label">Expired</p>
          <h2>{overview.expiredAssessments}</h2>
          <p>Assessments auto-submitted after the timer elapsed.</p>
        </article>

        <article className="metric-card metric-card--accent">
          <p className="info-card__label">Completion rate</p>
          <h2>{overview.completionRate}%</h2>
          <p>Share of stored submissions that completed manually.</p>
        </article>

        <article className="metric-card">
          <p className="info-card__label">Incomplete attempts</p>
          <h2>
            {overview.incompleteTracked && overview.incompleteAttempts !== null
              ? overview.incompleteAttempts
              : 'Not tracked'}
          </h2>
          <p>
            Partial attempts are not yet written to Mongo. Expired final submissions
            are tracked separately.
          </p>
        </article>

        <article className="metric-card">
          <p className="info-card__label">Access sources</p>
          <h2>{accessOverview.uniqueIpCount}</h2>
          <p>Unique IP addresses seen across tracked API access logs.</p>
        </article>
      </section>

      <section className="dashboard-content-grid">
        <article className="dashboard-panel dashboard-panel--table">
          <div className="dashboard-panel__header">
            <div>
              <p className="info-card__label">Recent submissions</p>
              <h2>Latest assessment entries</h2>
            </div>
          </div>

          {isLoading ? (
            <p className="dashboard-empty">Loading recent submissions…</p>
          ) : latestSubmissions.length === 0 ? (
            <p className="dashboard-empty">
              No submissions are stored yet. Once candidates submit assessments, the
              latest entries will appear here.
            </p>
          ) : (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Role</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {latestSubmissions.map((submission) => (
                    <tr key={`${submission.candidateEmail}-${submission.submittedAt}`}>
                      <td>
                        <strong>{submission.candidateName || 'Unnamed candidate'}</strong>
                        <span>{submission.candidateEmail}</span>
                      </td>
                      <td>{submission.roleApplied || 'Not provided'}</td>
                      <td>{submission.location || 'Not provided'}</td>
                      <td>
                        <span
  className={`dashboard-badge dashboard-badge--${
    submission.statusLabel === 'Completed manually'
      ? 'success'
      : submission.reason === 'integrity_violation_limit'
      ? 'danger'
      : 'warning'
  }`}
>
  {submission.statusLabel}
</span>
                      </td>
                      <td>{formatDashboardTimestamp(submission.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <div className="dashboard-stack">
          <article className="dashboard-panel">
            <p className="info-card__label">Status breakdown</p>
            <h2>Completion posture</h2>
            {isLoading ? (
              <p className="dashboard-empty">Loading status breakdown…</p>
            ) : (
              <div className="dashboard-breakdown">
                {statusBreakdown.map((item) => (
                  <div className="dashboard-breakdown__row" key={item.label}>
                    <div>
                      <strong>{item.label}</strong>
                      <p>
                        {item.count === null
                          ? 'Not recorded yet'
                          : `${item.count} assessment${item.count === 1 ? '' : 's'}`}
                      </p>
                    </div>
                    <span className={`dashboard-badge dashboard-badge--${item.tone}`}>
                      {item.count === null ? 'N/A' : item.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="dashboard-panel">
            <p className="info-card__label">Server access logs</p>
            <h2>Recent IP and source signals</h2>
            {isLoading ? (
              <p className="dashboard-empty">Loading access logs…</p>
            ) : accessOverview.recentAccess.length === 0 ? (
              <p className="dashboard-empty">
                No tracked access events are available yet.
              </p>
            ) : (
              <div className="dashboard-activity">
                {accessOverview.recentAccess.map((item) => (
                  <div
                    className="dashboard-activity__item"
                    key={`${item.ipAddress}-${item.path}-${item.accessedAt}`}
                  >
                    <span className="dashboard-dot dashboard-dot--info" />
                    <div>
                      <strong>{item.ipAddress}</strong>
                      <p>
                        {item.sourceLabel} · {item.method} {item.path}
                      </p>
                      <small>
                        {item.userRole}
                        {item.actorEmail ? ` · ${item.actorEmail}` : ''}
                        {` · ${formatDashboardTimestamp(item.accessedAt)}`}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="dashboard-panel">
            <p className="info-card__label">Recent activity</p>
            <h2>Evaluator context feed</h2>
            {isLoading ? (
              <p className="dashboard-empty">Loading recent activity…</p>
            ) : activity.length === 0 ? (
              <p className="dashboard-empty">
                Activity feed will populate once submission records exist.
              </p>
            ) : (
              <div className="dashboard-activity">
                {activity.map((item) => (
                  <div className="dashboard-activity__item" key={`${item.title}-${item.submittedAt}`}>
                    <span className={`dashboard-dot dashboard-dot--${item.tone}`} />
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                      <small>{formatDashboardTimestamp(item.submittedAt)}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>
    </SessionShell>
  )
}

export default AdminDashboardPage
