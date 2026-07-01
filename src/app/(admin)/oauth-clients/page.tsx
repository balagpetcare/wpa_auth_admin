'use client'

import Link from 'next/link'

export default function OAuthClientsPage() {
  return (
    <div>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700', color: '#2c3e50' }}>
          OAuth Clients
        </h1>
        <p style={{ margin: '0', fontSize: '16px', color: '#7f8c8d' }}>
          Manage OAuth 2.0 applications and API clients
        </p>
      </div>

      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef',
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔑</div>
        <h2 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>OAuth Clients</h2>
        <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>
          This feature is currently under development. You'll be able to manage OAuth clients and credentials here.
        </p>
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
