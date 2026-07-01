'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, ReactNode } from 'react'

export default function AuthProtection({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check if user has valid auth token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      const expiresAt = localStorage.getItem('accessTokenExpiresAt')

      if (!token) {
        // No token, redirect to sign-in
        router.push(`/auth/sign-in?redirectTo=${encodeURIComponent(pathname)}`)
        return
      }

      // Check if token is expired
      if (expiresAt) {
        const expiryTime = parseInt(expiresAt, 10)
        if (Date.now() >= expiryTime) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('adminData')
          localStorage.removeItem('accessTokenExpiresAt')
          router.push(`/auth/sign-in?redirectTo=${encodeURIComponent(pathname)}`)
          return
        }
      }

      setIsAuthorized(true)
    }
    setIsChecking(false)
  }, [router, pathname])

  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e9ecef',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
          }} />
          <p style={{ color: '#666' }}>Loading...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
