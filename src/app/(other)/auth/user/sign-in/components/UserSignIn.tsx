'use client'

// Phase 2.5 (docs/phase-2-5-public-auth-rs256-oidc.md): public end-user
// sign-in — completely separate from the admin sign-in at /auth/sign-in
// (different account type, different token storage/session, different
// backend route: POST /auth/login vs POST /admin/auth/login).

import React, { useState } from 'react'
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PublicAuthBrand from '@/components/PublicAuthBrand'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import useQueryParams from '@/hooks/useQueryParams'
import { endUserApiClient, EndUserApiError, setEndUserAccessToken, setEndUserRefreshToken } from '@/lib/endUserApiClient'

export default function UserSignIn() {
  const router = useRouter()
  const query = useQueryParams()
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signedIn, setSignedIn] = useState(false)

  const returnTo = query['returnTo']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const response = await endUserApiClient.post<{ success: boolean; accessToken: string; refreshToken?: string }>('/auth/login', {
        emailOrUsername,
        password,
      })
      if (response.success && response.accessToken) {
        setEndUserAccessToken(response.accessToken)
        if (response.refreshToken) setEndUserRefreshToken(response.refreshToken)
        if (returnTo) {
          router.replace(returnTo)
        } else {
          // This app has no end-user dashboard of its own — the primary
          // reason an end user signs in here is to continue an OAuth
          // consent handoff (returnTo set) or to manage their account via
          // a first-party client. With no returnTo, just confirm success
          // in place rather than redirecting somewhere that doesn't exist.
          setSignedIn(true)
        }
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err)
      setError(err instanceof EndUserApiError ? err.message : 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  if (signedIn) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100 p-3 bg-body-tertiary">
        <PublicAuthBrand />
        <Card className="shadow-sm border-0 text-center" style={{ maxWidth: 420, width: '100%' }}>
          <Card.Body className="p-4 p-md-5">
            <IconifyIcon icon="solar:check-circle-bold-duotone" className="text-success fs-40 mb-2" />
            <h5 className="fw-bold">You&apos;re signed in</h5>
            <p className="text-muted fs-13 mb-0">You can now close this window or return to the application that sent you here.</p>
          </Card.Body>
        </Card>
      </div>
    )
  }

  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100 p-3 bg-body-tertiary">
      <PublicAuthBrand />
      <Card className="shadow-sm border-0" style={{ maxWidth: 420, width: '100%' }}>
        <Card.Body className="p-4 p-md-5">
          <h4 className="fw-bold mb-1">Sign In</h4>
          <p className="text-muted fs-13 mb-4">Sign in to your WPA Central Auth account.</p>

          {query['registered'] && !error && (
            <Alert variant="success" className="fs-13">
              Account created. Please verify your email if you provided one, then sign in below.
            </Alert>
          )}

          {error && (
            <Alert variant="danger" className="fs-13">
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email or Username</Form.Label>
              <Form.Control
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="you@example.com"
                autoComplete="username"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <div className="d-flex justify-content-between">
                <Form.Label>Password</Form.Label>
                <Link href="/auth/user/forgot-password" className="fs-12">
                  Forgot password?
                </Link>
              </div>
              <Form.Control
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </Form.Group>
            <div className="d-grid mb-3">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                Sign In
              </Button>
            </div>
          </Form>

          <p className="text-center fs-13 mb-0">
            Don&apos;t have an account?{' '}
            <Link href={{ pathname: '/auth/user/register', query: returnTo ? { returnTo } : undefined }} className="fw-semibold">
              Create one
            </Link>
          </p>
        </Card.Body>
      </Card>
    </div>
  )
}
