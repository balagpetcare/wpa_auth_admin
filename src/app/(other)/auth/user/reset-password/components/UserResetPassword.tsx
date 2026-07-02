'use client'

// Phase 2.5 (docs/phase-2-5-public-auth-rs256-oidc.md): reads `token` from
// the query string — the link sent by POST /auth/forgot-password now points
// here (fixed a pre-existing bug where it pointed at the API server itself
// instead of a real frontend page; see auth.service.ts).

import React, { useState } from 'react'
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap'
import Link from 'next/link'
import PublicAuthBrand from '@/components/PublicAuthBrand'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import useQueryParams from '@/hooks/useQueryParams'
import { endUserApiClient, EndUserApiError } from '@/lib/endUserApiClient'

export default function UserResetPassword() {
  const query = useQueryParams()
  const token = query['token']
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError('This reset link is missing or invalid. Please request a new one.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await endUserApiClient.post('/auth/reset-password', { token, password })
      setDone(true)
    } catch (err: any) {
      console.error('Reset password failed:', err)
      setError(err instanceof EndUserApiError ? err.message : 'This reset link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100 p-3 bg-body-tertiary">
      <PublicAuthBrand />
      <Card className="shadow-sm border-0" style={{ maxWidth: 420, width: '100%' }}>
        <Card.Body className="p-4 p-md-5">
          {done ? (
            <div className="text-center">
              <IconifyIcon icon="solar:check-circle-bold-duotone" className="text-success fs-40 mb-2" />
              <h5 className="fw-bold">Password reset</h5>
              <p className="text-muted fs-13 mb-3">Your password has been updated. You can now sign in.</p>
              <Link href="/auth/user/sign-in" className="btn btn-primary btn-sm">
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h4 className="fw-bold mb-1">Reset Password</h4>
              <p className="text-muted fs-13 mb-4">Choose a new password for your account.</p>

              {!token && (
                <Alert variant="warning" className="fs-13">
                  This link is missing a reset token. Please use the link from your email, or request a new one.
                </Alert>
              )}

              {error && (
                <Alert variant="danger" className="fs-13">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    autoComplete="new-password"
                  />
                </Form.Group>
                <div className="d-grid mb-3">
                  <Button type="submit" variant="primary" disabled={loading || !token}>
                    {loading ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                    Reset Password
                  </Button>
                </div>
              </Form>
            </>
          )}

          {!done && (
            <p className="text-center fs-13 mb-0">
              <Link href="/auth/user/sign-in" className="fw-semibold">
                Back to sign in
              </Link>
            </p>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}
