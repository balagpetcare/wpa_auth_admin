'use client'

// Phase 2.5 (docs/phase-2-5-public-auth-rs256-oidc.md): public end-user
// registration. POST /auth/register creates a plain USER account
// (PENDING_VERIFICATION status, no admin role) — see auth.service.ts
// registerUser(). It does not return tokens, so after a successful
// registration this redirects to sign-in (carrying returnTo through) rather
// than attempting to auto-log-in.

import React, { useState } from 'react'
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PublicAuthBrand from '@/components/PublicAuthBrand'
import useQueryParams from '@/hooks/useQueryParams'
import { endUserApiClient, EndUserApiError } from '@/lib/endUserApiClient'

export default function UserRegister() {
  const router = useRouter()
  const query = useQueryParams()
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const returnTo = query['returnTo']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

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
      await endUserApiClient.post('/auth/register', {
        email,
        password,
        displayName: displayName || undefined,
      })
      const signInUrl = returnTo ? `/auth/user/sign-in?returnTo=${encodeURIComponent(returnTo)}` : '/auth/user/sign-in'
      router.replace(`${signInUrl}${returnTo ? '&' : '?'}registered=1`)
    } catch (err: any) {
      console.error('Registration failed:', err)
      setError(err instanceof EndUserApiError ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100 p-3 bg-body-tertiary">
      <PublicAuthBrand />
      <Card className="shadow-sm border-0" style={{ maxWidth: 420, width: '100%' }}>
        <Card.Body className="p-4 p-md-5">
          <h4 className="fw-bold mb-1">Create Account</h4>
          <p className="text-muted fs-13 mb-4">Register a new WPA Central Auth account.</p>

          {error && (
            <Alert variant="danger" className="fs-13">
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Display Name (optional)</Form.Label>
              <Form.Control type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Jane Doe" autoComplete="name" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
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
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
            </Form.Group>
            <div className="d-grid mb-3">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                Create Account
              </Button>
            </div>
          </Form>

          <p className="text-center fs-13 mb-0">
            Already have an account?{' '}
            <Link href={{ pathname: '/auth/user/sign-in', query: returnTo ? { returnTo } : undefined }} className="fw-semibold">
              Sign in
            </Link>
          </p>
        </Card.Body>
      </Card>
    </div>
  )
}
