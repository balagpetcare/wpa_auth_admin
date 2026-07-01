'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'

export const dynamic = 'force-dynamic'

function AcceptInviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided. Please check your invitation link.')
    }
  }, [token])

  const handleAcceptInvite = async () => {
    if (!token) {
      setError('No invitation token provided')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Call backend to accept invitation
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5010/api/v1'}/auth/accept-invite`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Failed to accept invitation')
        return
      }

      setSuccess(true)
      // Redirect to sign-in after successful acceptance
      setTimeout(() => {
        router.push('/auth/sign-in')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'An error occurred while accepting the invitation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
      }}>
        <h1 style={{ marginBottom: '20px', fontSize: '24px' }}>
          Accept Invitation
        </h1>

        {!token ? (
          <div style={{
            padding: '15px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            marginBottom: '20px',
          }}>
            <strong>Error:</strong> No invitation token provided. Please check your invitation link.
          </div>
        ) : success ? (
          <div>
            <div style={{
              padding: '15px',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '4px',
              marginBottom: '20px',
            }}>
              <strong>Success!</strong> Your invitation has been accepted. Redirecting to sign in...
            </div>
          </div>
        ) : (
          <div>
            {error && (
              <div style={{
                padding: '15px',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                borderRadius: '4px',
                marginBottom: '20px',
              }}>
                <strong>Error:</strong> {error}
              </div>
            )}

            <p style={{ marginBottom: '20px', color: '#666' }}>
              Click below to accept your invitation to join the WPA Central Auth Admin.
            </p>

            <p style={{
              fontSize: '12px',
              color: '#999',
              marginBottom: '20px',
              wordBreak: 'break-all',
            }}>
              Token: {token ? token.substring(0, 20) + '...' : 'None'}
            </p>

            <button
              onClick={handleAcceptInvite}
              disabled={loading || !token}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: !token || loading ? '#ccc' : '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: !token || loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              {loading ? 'Accepting...' : 'Accept Invitation'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AcceptInviteContent />
    </Suspense>
  )
}
