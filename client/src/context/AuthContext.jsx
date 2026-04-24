import { useEffect, useState } from 'react'
import {
  fetchSession,
  loginAdmin as loginAdminRequest,
  loginCandidate,
  loginWithGoogle,
  logoutCandidate,
} from '../services/api'
import { AuthContext } from './authContextObject'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem('ae_user_session')
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  })
  
  // If we have a user in sessionStorage, we don't need a blocking loading state
  const [isAuthLoading, setIsAuthLoading] = useState(!user)

  useEffect(() => {
    let isMounted = true

    async function restoreSession() {
      try {
        const payload = await fetchSession()

        if (isMounted) {
          setUser(payload.user)
          if (payload.user) {
            sessionStorage.setItem('ae_user_session', JSON.stringify(payload.user))
          } else {
            sessionStorage.removeItem('ae_user_session')
          }
        }
      } catch (error) {
        if (isMounted) {
          // If the server says no session, clear our local cache
          setUser(null)
          sessionStorage.removeItem('ae_user_session')
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
    sessionStorage.setItem('ae_user_session', JSON.stringify(payload.user))
    return payload.user
  }

  async function googleLogin(credential) {
    const payload = await loginWithGoogle(credential)
    setUser(payload.user)
    sessionStorage.setItem('ae_user_session', JSON.stringify(payload.user))
    return payload.user
  }

  async function loginAdmin(credentials) {
    const payload = await loginAdminRequest(credentials)
    setUser(payload.user)
    sessionStorage.setItem('ae_user_session', JSON.stringify(payload.user))
    return payload.user
  }

  async function logout() {
    try {
      // 1. Call backend to invalidate the server session (cookies)
      await logoutCandidate()
    } catch (error) {
      console.error('Logout request failed', error)
    } finally {
      // 2. Clear all frontend storage
      sessionStorage.clear()
      localStorage.clear()

      // 3. Manually clear all accessible browser cookies
      const cookies = document.cookie.split(';')
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i]
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
      }

      // 4. Reset state
      setUser(null)
    }
  }

  const value = {
    isAdmin: user?.role === 'admin',
    isAuthenticated: Boolean(user),
    isAuthLoading,
    googleLogin,
    loginAdmin,
    login,
    logout,
    user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
