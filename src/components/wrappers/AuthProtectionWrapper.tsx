'use client'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { Suspense, useEffect } from 'react'

import type { ChildrenType } from '@/types/component-props'
import FallbackLoading from '../FallbackLoading'
import { apiClient } from '@/lib/apiClient'

const AuthProtectionWrapper = ({ children }: ChildrenType) => {
  const { data: session, status } = useSession()
  const { replace } = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'unauthenticated' && !pathname.startsWith('/auth/sign-in')) {
      replace(`/auth/sign-in?redirectTo=${encodeURIComponent(pathname)}`
    }
  }, [status, pathname, replace]

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      apiClient(session.accessToken
        .get('/admin/auth/me'
        .catch(() => {
          // If the backend rejects our token, force logout
          if (!pathname.startsWith('/auth/sign-in')) {
            void signOut({ callbackUrl: `/auth/sign-in?redirectTo=${encodeURIComponent(pathname)}` }
          } else {
            void signOut({ callbackUrl: '/auth/sign-in' }
          }
        }
    }
  }, [status, session, pathname]

  if (status === 'loading' || status === 'unauthenticated') {
    return <FallbackLoading />
  }

  return <Suspense>{children}</Suspense>
}

export default AuthProtectionWrapper
