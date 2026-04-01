import { useEffect, useState } from 'react'
import {
  fetchSession,
  loginAdmin as loginAdminRequest,
  loginCandidate,
  logoutCandidate,
} from '../services/api'
import { AuthContext } from './authContextObject'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function restoreSession() {
      try {
        const payload = await fetchSession()

        if (isMounted) {
          setUser(payload.user)
        }
      } catch {
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false)
        }
      }
    }

    restoreSession()

    return () => {
      isMounted = false
    }
  }, [])

  async function login(credentials) {
    const payload = await loginCandidate(credentials)
    setUser(payload.user)
    return payload.user
  }

  async function loginAdmin(credentials) {
    const payload = await loginAdminRequest(credentials)
    setUser(payload.user)
    return payload.user
  }

  async function logout() {
    await logoutCandidate()
    setUser(null)
  }

  const value = {
    isAdmin: user?.role === 'admin',
    isAuthenticated: Boolean(user),
    isAuthLoading,
    loginAdmin,
    login,
    logout,
    user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
