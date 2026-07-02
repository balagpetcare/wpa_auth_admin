'use client'

// Phase 2.5 (docs/phase-2-5-public-auth-rs256-oidc.md): POST /auth/forgot-password
// always returns 200 with the same generic message regardless of whether the
// email exists (see auth.routes.ts — deliberate anti-enumeration behavior),
// so this page always shows the same success state and never reveals
// account existence.

import React, { useState } from 'react'
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap'
import Link from 'next/link'
import PublicAuthBrand from '@/components/PublicAuthBrand'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { endUserApiClient, EndUserApiError } from '@/lib/endUserApiClient'

export default function UserForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await endUserApiClient.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err: any) {
      console.error('Forgot-password request failed:', err)
      setError(err instanceof EndUserApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100 p-3 bg-body-tertiary">
      <PublicAuthBrand />
      <Card className="shadow-sm border-0" style={{ maxWidth: 420, width: '100%' }}>
        <Card.Body className="p-4 p-md-5">
          {sent ? (
            <div className="text-center">
              <IconifyIcon icon="solar:letter-bold-duotone" className="text-primary fs-40 mb-2" />
              <h5 className="fw-bold">Check your email</h5>
              <p className="text-muted fs-13 mb-0">If an account exists for that email, a password reset link has been sent.</p>
            </div>
          ) : (
            <>
              <h4 className="fw-bold mb-1">Forgot Password</h4>
              <p className="text-muted fs-13 mb-4">Enter your email address and we&apos;ll send you a reset link.</p>

              {error && (
                <Alert variant="danger" className="fs-13">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                </Form.Group>
                <div className="d-grid mb-3">
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                    Send Reset Link
                  </Button>
                </div>
              </Form>
            </>
          )}

          <p className="text-center fs-13 mb-0">
            <Link href="/auth/user/sign-in" className="fw-semibold">
              Back to sign in
            </Link>
          </p>
        </Card.Body>
      </Card>
    </div>
  )
}
