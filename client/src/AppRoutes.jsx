import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminSettingsPage from './pages/AdminSettingsPage'
import AdminSubmissionsPage from './pages/AdminSubmissionsPage'
import AssessmentPage from './pages/AssessmentPage'
import AssessmentInstructionsPage from './pages/AssessmentInstructionsPage'
import CandidateDetailsPage from './pages/CandidateDetailsPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import ThankYouPage from './pages/ThankYouPage'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="/login" />} />
      <Route path="/admin" element={<Navigate replace to="/admin/login" />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']} redirectTo="/admin/login">
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/submissions"
        element={
          <ProtectedRoute allowedRoles={['admin']} redirectTo="/admin/login">
            <AdminSubmissionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={['admin']} redirectTo="/admin/login">
            <AdminSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate-details"
        element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <CandidateDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assessment-instructions"
        element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <AssessmentInstructionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assessment"
        element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <AssessmentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assessment-submitted"
        element={<Navigate replace to="/thank-you" />}
      />
      <Route
        path="/thank-you"
        element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <ThankYouPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default AppRoutes
