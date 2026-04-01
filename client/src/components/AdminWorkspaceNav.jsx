import { NavLink } from 'react-router-dom'

function AdminWorkspaceNav() {
  return (
    <nav aria-label="Admin workspace" className="admin-workspace-nav">
      <NavLink
        className={({ isActive }) =>
          `admin-workspace-nav__link${isActive ? ' admin-workspace-nav__link--active' : ''}`
        }
        to="/admin/dashboard"
      >
        Dashboard
      </NavLink>
      <NavLink
        className={({ isActive }) =>
          `admin-workspace-nav__link${isActive ? ' admin-workspace-nav__link--active' : ''}`
        }
        to="/admin/submissions"
      >
        Submission Table
      </NavLink>
      <NavLink
        className={({ isActive }) =>
          `admin-workspace-nav__link${isActive ? ' admin-workspace-nav__link--active' : ''}`
        }
        to="/admin/settings"
      >
        Account Settings
      </NavLink>
    </nav>
  )
}

export default AdminWorkspaceNav
