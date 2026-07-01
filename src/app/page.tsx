'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    // Try to get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

    if (token && token !== 'null' && token !== 'undefined') {
      // User is authenticated, redirect to dashboard
      router.push('/dashboard')
    } else {
      // User is not authenticated, redirect to sign-in
      router.push('/auth/sign-in')
    }
  }, [router])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
    }}>
      <p>Redirecting...</p>
    </div>
  )
}
