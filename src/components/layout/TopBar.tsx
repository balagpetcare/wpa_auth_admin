'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type AdminData = {
  id?: string
  username?: string
  email?: string
  fullName?: string
  displayName?: string
}

export default function TopBar() {
  const router = useRouter()
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('adminData')
      if (data) {
        try {
          setAdminData(JSON.parse(data))
        } catch (e) {
          console.error('Failed to parse admin data:', e)
        }
      }
    }
  }, [])

  const handleLogout = async () => {
    try {
      // Call logout endpoint
      await fetch('http://localhost:5010/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      }).catch(() => {
        // Continue logout even if API call fails
      })
    } finally {
      // Clear local storage
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('adminData')
      localStorage.removeItem('accessTokenExpiresAt')
      router.push('/auth/sign-in')
    }
  }

  const displayName = adminData?.displayName || adminData?.fullName || adminData?.username || 'Admin'
  const email = adminData?.email || ''

  return (
    <header style={{
      backgroundColor: '#fff',
      borderBottom: '1px solid #e9ecef',
      padding: '15px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>
          WPA Central Auth Admin
        </h2>
      </div>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 15px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.backgroundColor = '#e9ecef'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.backgroundColor = '#f8f9fa'
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            backgroundColor: '#3498db',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '14px',
          }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: '600', fontSize: '14px', color: '#2c3e50' }}>
              {displayName}
            </div>
            {email && (
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '2px' }}>
                {email}
              </div>
            )}
          </div>
          <span style={{ color: '#7f8c8d', marginLeft: '5px' }}>▼</span>
        </button>

        {showDropdown && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '5px',
            backgroundColor: '#fff',
            border: '1px solid #e9ecef',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            minWidth: '200px',
            zIndex: 1000,
          }}>
            <Link
              href="/my-account"
              onClick={() => setShowDropdown(false)}
              style={{
                display: 'block',
                padding: '12px 16px',
                color: '#2c3e50',
                textDecoration: 'none',
                borderBottom: '1px solid #e9ecef',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.backgroundColor = '#f8f9fa'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.backgroundColor = 'transparent'
              }}
            >
              My Account
            </Link>
            <button
              onClick={() => {
                setShowDropdown(false)
                handleLogout()
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 16px',
                color: '#e74c3c',
                backgroundColor: 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.backgroundColor = '#f8f9fa'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.backgroundColor = 'transparent'
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
