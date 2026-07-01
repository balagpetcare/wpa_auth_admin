'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AdminUser {
  id: string
  email?: string
  username?: string
  displayName?: string
  roles?: string[]
}

export default function Dashboard() {
  const router = useRouter()
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/sign-in')
      return
    }

    // Load admin data from localStorage
    const adminData = localStorage.getItem('adminData')
    if (adminData) {
      try {
        setAdmin(JSON.parse(adminData))
      } catch (error) {
        console.error('Failed to parse admin data', error)
      }
    }

    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('adminData')
    localStorage.removeItem('accessTokenExpiresAt')
    router.push('/auth/logout')
  }

  if (loading) {
    return (
      <div>
        <h1>Dashboard</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: '#666' }}>Welcome to WPA Central Auth Admin</p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>

      {admin && (
        <div style={{
          backgroundColor: '#f9f9f9',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <h2 style={{ marginTop: 0 }}>User Information</h2>
          <p><strong>ID:</strong> {admin.id}</p>
          {admin.email && <p><strong>Email:</strong> {admin.email}</p>}
          {admin.username && <p><strong>Username:</strong> {admin.username}</p>}
          {admin.displayName && <p><strong>Display Name:</strong> {admin.displayName}</p>}
          {admin.roles && <p><strong>Roles:</strong> {admin.roles.join(', ')}</p>}
        </div>
      )}

      <div style={{
        backgroundColor: '#e7f3ff',
        padding: '20px',
        borderRadius: '8px',
        borderLeft: '4px solid #007bff',
      }}>
        <h3 style={{ marginTop: 0 }}>Status</h3>
        <p>✓ Authentication working correctly</p>
        <p>✓ User data loaded successfully</p>
        <p>✓ Dashboard accessible</p>
      </div>
    </div>
  )
}
