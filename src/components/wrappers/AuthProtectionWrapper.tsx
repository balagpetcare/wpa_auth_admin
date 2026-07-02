'use client'
import { useAuth } from '@/context/useAuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { Suspense, useEffect } from 'react'

import type { ChildrenType } from '@/types/component-props'
import FallbackLoading from '../FallbackLoading'

const AuthProtectionWrapper = ({ children }: ChildrenType) => {
  const { admin, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !admin && pathname !== '/auth/sign-in') {
      router.replace(`/auth/sign-in?redirectTo=${pathname}`)
    }
  }, [admin, loading, pathname, router])

  if (loading) {
    return <FallbackLoading />
  }

  if (!admin) {
    return <FallbackLoading />
  }

  return <Suspense>{children}</Suspense>
}

export default AuthProtectionWrapper
