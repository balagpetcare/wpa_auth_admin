'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { apiClient, clearAuthTokens, getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from '@/lib/apiClient'

export interface AdminUser {
  id: string
  email: string
  username: string
  displayName?: string
  avatarUrl?: string
  roles: string[]
  permissions: string[]
}

interface AuthContextProps {
  admin: AdminUser | null
  loading: boolean
  authError: string | null
  login: (emailOrUsername: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshAdmin: () => Promise<void>
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const sendPresenceHeartbeat = async () => {
    if (!admin || pathname?.startsWith('/auth/')) return
    try {
      await apiClient.post('/auth/presence/heartbeat', {})
    } catch {
      // Presence is best-effort only. Never log out the user if heartbeat fails.
    }
  }

  // Phase 1 audit fix (docs/central-auth-api-admin-scalability-audit.md):
  // token refresh-and-retry is now handled centrally inside apiClient's
  // request() for every endpoint, not just this one. This function no longer
  // needs its own bespoke refresh logic — apiClient already retried the
  // request with a refreshed access token before this call can fail with a
  // recoverable 401. If it still throws 401 here, the refresh itself failed
  // (refresh token missing/expired/reused) and apiClient has already cleared
  // tokens + dispatched `wpa_auth_unauthorized`, which `handleUnauthorized`
  // below reacts to. A 403 here means the session is valid but the account
  // lacks the required role/permission — that should not force a logout.
  const refreshAdmin = async () => {
    const token = getAccessToken()
    if (!token) {
      // Stage 2 (Central Auth SSO, docs referenced in
      // src/app/api/auth/callback/central-auth/route.ts): no local-storage
      // bearer token, but the browser may still hold an HttpOnly-cookie
      // session from the Central Auth OAuth/PKCE login path. That cookie is
      // never exposed to this client-side code by design - the only way to
      // check it is to ask a Route Handler that reads it server-side. This
      // recognizes the session for the app shell. Data calls use the
      // same-origin BFF when no legacy localStorage token is present.
      try {
        const res = await fetch('/api/auth/central-auth/session', { credentials: 'same-origin' })
        if (res.ok) {
          const data = await res.json().catch(() => null)
          if (data?.authenticated && data?.user) {
            setAdmin(data.user)
            setAuthError(null)
            setLoading(false)
            return
          }
        }
      } catch {
        // Best-effort only - fall through to signed-out state below.
      }
      setAdmin(null)
      setAuthError(null)
      setLoading(false)
      return
    }

    try {
      const response = await apiClient.get<{ success: boolean; user: AdminUser }>('/admin/auth/me')
      if (response.success && response.user) {
        setAdmin(response.user)
        setAuthError(null)
      } else {
        setAdmin(null)
        setAuthError('Unable to verify admin session.')
      }
    } catch (err: any) {
      if (err?.status === 401) {
        // apiClient already attempted a silent refresh and cleared tokens on
        // failure; nothing more to do here besides reflecting signed-out state.
        setAdmin(null)
        setAuthError(null)
      } else if (err?.status === 403) {
        // Valid session, insufficient role/permission for /admin/auth/me
        // (e.g. non-admin account). Do not clear tokens or force a redirect
        // loop — surface it as an auth error instead.
        setAdmin(null)
        setAuthError('Access denied: admin role required.')
      } else {
        console.error('Failed to load current admin:', err)
        setAdmin(null)
        setAuthError('Unable to verify admin session.')
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (emailOrUsername: string, password: string) => {
    setLoading(true)
    setAuthError(null)
    try {
      clearAuthTokens()
      const response = await apiClient.post<{
        success: boolean
        accessToken: string
        refreshToken?: string
        user: AdminUser
      }>('/admin/auth/login', { emailOrUsername, password })

      if (response.success && response.accessToken) {
        setAccessToken(response.accessToken)
        if (response.refreshToken) {
          setRefreshToken(response.refreshToken)
        }
        setAdmin(response.user)
      }
    } catch (err) {
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      const refreshToken = getRefreshToken() || undefined
      await apiClient.post('/admin/auth/logout', { refreshToken })
    } catch (err) {
      console.error('Failed to perform API logout:', err)
    } finally {
      // Stage 2 (Central Auth SSO): best-effort revoke + clear of the
      // HttpOnly cookie session, if one exists. No-ops safely for
      // local-login-only sessions - see
      // src/app/api/auth/central-auth/logout/route.ts.
      try {
        await fetch('/api/auth/central-auth/logout', { method: 'POST', credentials: 'same-origin' })
      } catch (err) {
        console.error('Failed to revoke Central Auth session:', err)
      }
      clearAuthTokens()
      setAdmin(null)
      setLoading(false)
      router.replace('/auth/sign-in')
    }
  }

  useEffect(() => {
    refreshAdmin()

    const handleUnauthorized = () => {
      clearAuthTokens()
      setAdmin(null)
      setAuthError(null)
      setLoading(false)
      if (pathname !== '/auth/sign-in') {
        router.replace('/auth/sign-in')
      }
    }

    window.addEventListener('wpa_auth_unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('wpa_auth_unauthorized', handleUnauthorized)
    }
  }, [])

  useEffect(() => {
    if (!admin || loading) return

    let interval: ReturnType<typeof setInterval> | null = null
    let canceled = false

    const heartbeat = async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      if (canceled) return
      await sendPresenceHeartbeat()
    }

    void heartbeat()
    interval = setInterval(() => {
      void heartbeat()
    }, 60_000)

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void heartbeat()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      canceled = true
      if (interval) clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [admin, loading, pathname])

  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname?.startsWith('/auth/')
      // Phase 2.5 (docs/phase-2-5-public-auth-rs256-oidc.md): /oauth/* (the
      // OAuth consent screen) is a public page reachable by anonymous
      // visitors and by end users authenticated only via the separate
      // end-user session (see lib/endUserApiClient.ts) — it must NOT be
      // force-redirected to the admin sign-in page just because no admin
      // session exists. It intentionally does not redirect a logged-in
      // admin away either (unlike /auth/* pages below) — an admin browsing
      // to /oauth/consent should still be able to complete consent using
      // their own account if they choose to, same as any other user.
      const isPublicOAuthPage = pathname?.startsWith('/oauth/')
      if (!admin && !isAuthPage && !isPublicOAuthPage) {
        router.replace('/auth/sign-in')
      } else if (admin && isAuthPage) {
        router.replace('/dashboard')
      }
    }
  }, [admin, loading, pathname])

  return (
    <AuthContext.Provider value={{ admin, loading, authError, login, logout, refreshAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
