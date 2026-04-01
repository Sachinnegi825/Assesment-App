import { BrowserRouter } from 'react-router-dom'
import SiteFooter from './components/SiteFooter'
import { AssessmentProvider } from './context/AssessmentContext'
import { AuthProvider } from './context/AuthContext'
import AppRoutes from './AppRoutes'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AssessmentProvider>
          <AppRoutes />
          <SiteFooter />
        </AssessmentProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
