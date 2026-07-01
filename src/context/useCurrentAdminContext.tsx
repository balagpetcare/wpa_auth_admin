'use client'

import { createContext, useContext, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/apiClient'
import type { ChildrenType } from '@/types/component-props'
import type { CurrentAdmin } from '@/types/admin'

type CurrentAdminContextType = {
  admin: CurrentAdmin | null
  loading: boolean
  refreshAdmin: () => Promise<void>
  setAdmin: Dispatch<SetStateAction<CurrentAdmin | null>>
}

const CurrentAdminContext = createContext<CurrentAdminContextType | undefined>(undefined

// Public auth routes that don't require authenticated admin context
const PUBLIC_AUTH_ROUTES = [
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/accept-invite',
  '/auth/reset-pass',
  '/auth/forgot-password',
  '/auth/lock-screen',
]

export function useCurrentAdmin() {
  const context = useContext(CurrentAdminContext
  if (!context) {
    throw new Error('useCurrentAdmin must be used within CurrentAdminProvider')
  }
  return context
}

export function CurrentAdminProvider({ children }: ChildrenType) {
  const { accessToken, user } = useAuth()
  const pathname = usePathname()

  // Check if current route is a public auth route
  const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.some(route => pathname.startsWith(route

  const [admin, setAdmin] = useState<CurrentAdmin | null>()
    user
      ? {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          status: user.status,
          roles: user.roles,
          createdAt: user.createdAt,
        }
      : null,
  
  const [loading, setLoading] = useState(true

  const refreshAdmin = async () => {
    if (!accessToken) {
      setAdmin(null
      setLoading(false
      return
    }

    try {
      const res: any = await apiClient(accessToken).get('/admin/account/me'
      setAdmin(res.account
    } catch (error) {
      setAdmin(null
    }
  }

  useEffect(() => {
    let active = true

    const run = async () => {
      // Skip fetching on public auth routes
      if (isPublicAuthRoute) {
        if (active) {
          setAdmin(null
          setLoading(false
        }
        return
      }

      if (!accessToken) {
        if (active) {
          setAdmin(null
          setLoading(false
        }
        return
      }

      try {
        const res: any = await apiClient(accessToken).get('/admin/account/me'
        if (active) setAdmin(res.account
      } catch (error) {
        // On protected routes, auth errors should be handled by route guards
        if (active) setAdmin(null
      } finally {
        if (active) setLoading(false
      }
    }

    void run()

    return () => {
      active = false
    }
  }, [accessToken, isPublicAuthRoute]

  return ()
    <CurrentAdminContext.Provider value={{ admin, loading, refreshAdmin, setAdmin }}>
      {children}
    </CurrentAdminContext.Provider>
  
}
