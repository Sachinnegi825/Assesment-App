import { BrowserRouter, useLocation } from 'react-router-dom'
import SiteFooter from './components/SiteFooter'
import { AssessmentProvider } from './context/AssessmentContext'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import AppRoutes from './AppRoutes'
import { useEffect } from 'react'


function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }, [pathname]);

  return null;
}


function AssessmentWrapper() {
  const { user } = useAuth()
  // Using user?.id as a key ensures that AssessmentProvider resets its 
  // internal state (useState) completely whenever a different user logs in.


  return (
    <AssessmentProvider key={user?.id || 'guest'}>
      <ScrollToTop />
      <AppRoutes />
      <SiteFooter />
    </AssessmentProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AssessmentWrapper />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
