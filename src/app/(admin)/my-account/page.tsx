'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type AdminData = {
  id?: string
  username?: string
  email?: string
  fullName?: string
  displayName?: string
}

export default function MyAccountPage() {
  const [adminData, setAdminData] = useState<AdminData | null>(null)

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

  return (
    <div>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700', color: '#2c3e50' }}>
          My Account
        </h1>
        <p style={{ margin: '0', fontSize: '16px', color: '#7f8c8d' }}>
          Manage your profile and account settings
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '30px',
      }}>
        {/* Profile Information */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef',
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>
            Profile Information
          </h3>

          {adminData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {adminData.displayName && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#7f8c8d',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}>
                    Display Name
                  </label>
                  <p style={{ margin: 0, fontSize: '16px', color: '#2c3e50' }}>
                    {adminData.displayName}
                  </p>
                </div>
              )}

              {adminData.username && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#7f8c8d',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}>
                    Username
                  </label>
                  <p style={{ margin: 0, fontSize: '16px', color: '#2c3e50' }}>
                    {adminData.username}
                  </p>
                </div>
              )}

              {adminData.email && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#7f8c8d',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}>
                    Email
                  </label>
                  <p style={{ margin: 0, fontSize: '16px', color: '#2c3e50' }}>
                    {adminData.email}
                  </p>
                </div>
              )}

              {adminData.id && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#7f8c8d',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}>
                    User ID
                  </label>
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#7f8c8d',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                  }}>
                    {adminData.id}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: '#7f8c8d' }}>No profile information available</p>
          )}
        </div>

        {/* Account Settings */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef',
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>
            Account Settings
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              disabled
              style={{
                padding: '10px 16px',
                backgroundColor: '#e9ecef',
                color: '#7f8c8d',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'not-allowed',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              ⚙️ Change Password
            </button>

            <button
              disabled
              style={{
                padding: '10px 16px',
                backgroundColor: '#e9ecef',
                color: '#7f8c8d',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'not-allowed',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              🔐 Two-Factor Authentication
            </button>

            <button
              disabled
              style={{
                padding: '10px 16px',
                backgroundColor: '#e9ecef',
                color: '#7f8c8d',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'not-allowed',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              🔔 Notification Preferences
            </button>
          </div>

          <div style={{
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #e9ecef',
            color: '#7f8c8d',
            fontSize: '12px',
          }}>
            Coming soon: Additional account settings will be available here
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: '#fff',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '500',
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
