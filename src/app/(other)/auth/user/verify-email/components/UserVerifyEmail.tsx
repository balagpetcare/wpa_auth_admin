'use client'

// Phase 2.5 (docs/phase-2-5-public-auth-rs256-oidc.md): confirms an email
// verification token via POST /auth/verify-email/confirm (public, no auth
// required — matches auth.routes.ts). Resending a verification email
// (POST /auth/verify-email/request) does require an authenticated session
// per the existing backend route, so that action is only offered when the
// visitor is currently signed in via the end-user session.

import React, { useEffect, useState } from 'react'
import { Card, Button, Alert, Spinner, Form } from 'react-bootstrap'
import Link from 'next/link'
import PublicAuthBrand from '@/components/PublicAuthBrand'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import useQueryParams from '@/hooks/useQueryParams'
import { endUserApiClient, EndUserApiError, getEndUserAccessToken } from '@/lib/endUserApiClient'

export default function UserVerifyEmail() {
  const query = useQueryParams()
  const token = query['token']
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const [resendEmail, setResendEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const isSignedIn = typeof window !== 'undefined' && Boolean(getEndUserAccessToken())

  useEffect(() => {
    if (!token) return
    setStatus('verifying')
    endUserApiClient
      .post('/auth/verify-email/confirm', { token })
      .then(() => setStatus('success'))
      .catch((err: any) => {
        console.error('Email verification failed:', err)
        setError(err instanceof EndUserApiError ? err.message : 'This verification link is invalid or has expired.')
        setStatus('error')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    setResendLoading(true)
    try {
      await endUserApiClient.post('/auth/verify-email/request', { email: resendEmail })
      setResendSent(true)
    } catch (err: any) {
      console.error('Resend verification failed:', err)
      setError(err instanceof EndUserApiError ? err.message : 'Unable to resend the verification email.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100 p-3 bg-body-tertiary">
      <PublicAuthBrand />
      <Card className="shadow-sm border-0" style={{ maxWidth: 420, width: '100%' }}>
        <Card.Body className="p-4 p-md-5">
          {status === 'verifying' && (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-3 mb-0 fs-13">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <IconifyIcon icon="solar:check-circle-bold-duotone" className="text-success fs-40 mb-2" />
              <h5 className="fw-bold">Email verified</h5>
              <p className="text-muted fs-13 mb-3">Your email address has been confirmed.</p>
              <Link href="/auth/user/sign-in" className="btn btn-primary btn-sm">
                Go to Sign In
              </Link>
            </div>
          )}

          {(status === 'error' || status === 'idle') && (
            <>
              {status === 'error' && (
                <Alert variant="danger" className="fs-13">
                  {error}
                </Alert>
              )}
              {status === 'idle' && !token && (
                <Alert variant="warning" className="fs-13">
                  This link is missing a verification token.
                </Alert>
              )}

              {isSignedIn ? (
                resendSent ? (
                  <div className="text-center">
                    <IconifyIcon icon="solar:letter-bold-duotone" className="text-primary fs-40 mb-2" />
                    <p className="text-muted fs-13 mb-0">A new verification email has been sent.</p>
                  </div>
                ) : (
                  <>
                    <h5 className="fw-bold mb-3 text-center">Resend Verification Email</h5>
                    <Form onSubmit={handleResend}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control
                          type="email"
                          required
                          value={resendEmail}
                          onChange={(e) => setResendEmail(e.target.value)}
                          placeholder="you@example.com"
                        />
                      </Form.Group>
                      <div className="d-grid">
                        <Button type="submit" variant="primary" disabled={resendLoading}>
                          {resendLoading ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                          Resend Verification Email
                        </Button>
                      </div>
                    </Form>
                  </>
                )
              ) : (
                <p className="text-center fs-13 text-muted mb-0">
                  Sign in to request a new verification email.
                  <br />
                  <Link href="/auth/user/sign-in" className="fw-semibold">
                    Go to Sign In
                  </Link>
                </p>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}
