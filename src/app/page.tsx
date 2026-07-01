'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RootPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Check if token is still valid
    const token = localStorage.getItem('accessToken')
    const expiresAt = localStorage.getItem('accessTokenExpiresAt')

    if (token && token !== 'null' && token !== 'undefined') {
      // Check if token is expired
      if (expiresAt) {
        const isExpired = Date.now() > parseInt(expiresAt)
        if (isExpired) {
          // Token expired, clear storage and go to sign-in
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('adminData')
          localStorage.removeItem('accessTokenExpiresAt')
          setChecking(false)
          router.push('/auth/sign-in')
          return
        }
      }

      // Token exists and is valid, go to dashboard
      setChecking(false)
      router.push('/dashboard')
    } else {
      // No token, go to sign-in
      setChecking(false)
      router.push('/auth/sign-in')
    }
  }, [router])

  if (checking) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}>
        <p style={{ fontSize: '16px', color: '#666' }}>Checking authentication...</p>
      </div>
    )
  }

  return null
}
