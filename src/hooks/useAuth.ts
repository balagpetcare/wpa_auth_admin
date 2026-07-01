'use client'
import { useSession, signOut } from 'next-auth/react'
import { useCallback } from 'react'
import { apiClient } from '@/lib/apiClient'

export function useAuth() {
  const { data: session, status } = useSession()

  const logout = useCallback(async () => {
    try {
      if (session?.accessToken) {
        await apiClient(session.accessToken).post('/admin/auth/logout', {
          refreshToken: session.refreshToken,
        }
      }
    } catch {
      // Best-effort — always sign out locally regardless
    }
    await signOut({ callbackUrl: '/auth/sign-in' }
  }, [session]

  return {
    user: session?.user ?? null,
    accessToken: session?.accessToken ?? null,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    fetchMe: useCallback(async () => {
      if (session?.accessToken) {
        return await apiClient(session.accessToken).get<{ success: boolean; user: any }>('/admin/auth/me'
      }
      return null
    }, [session]),
    logout,
  }
}
