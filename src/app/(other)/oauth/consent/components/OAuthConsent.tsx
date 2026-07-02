'use client'

// Phase 2 module (docs/phase-2-core-identity-admin-modules.md): OAuth
// consent screen for THIRD_PARTY_APP clients. FIRST_PARTY_APP/SERVICE
// clients never reach this page — GET /oauth/authorize auto-approves them
// server-side and this page would just immediately redirect through.
//
// Route is intentionally NOT under /auth/* so useAuthContext's
// isAuthPage-based redirect logic (which forces any already-authenticated
// admin away from /auth/* pages back to /dashboard) doesn't interfere with
// an authenticated user landing here to approve a third-party app. It's
// also explicitly excluded from that same redirect logic's "no admin
// session -> force to admin sign-in" rule (see useAuthContext.tsx) since
// this page is meant for end users, not admins.
//
// Phase 2.5 (docs/phase-2-5-public-auth-rs256-oidc.md): switched from the
// admin apiClient/session to the separate end-user session
// (lib/endUserApiClient.ts) — "admin-only accounts should not be required
// for OAuth consent". If the visitor has no end-user session (or it's
// expired), they're redirected to the public sign-in page with a `returnTo`
// pointing back at this exact consent URL, and sent back here after signing
// in or registering.

import React, { useEffect, useState } from 'react'
import { Card, Button, Spinner, Badge } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PublicAuthBrand from '@/components/PublicAuthBrand'
import useQueryParams from '@/hooks/useQueryParams'
import { endUserApiClient, EndUserApiError } from '@/lib/endUserApiClient'

interface AuthorizeResponse {
  success: boolean
  requiresConsent: boolean
  consentTicket?: string
  client?: { name: string; slug: string }
  scopes?: string[]
  redirectUri?: string
  state?: string
  code?: string
}

interface ConsentResponse {
  success: boolean
  approved: boolean
  redirectUri: string
  state?: string
  code?: string
  error?: string
}

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  openid: 'Confirm your identity',
  profile: 'View your basic profile information (name, username)',
  email: 'View your email address',
  phone: 'View your phone number',
}

function redirectWithParams(baseUrl: string, params: Record<string, string | undefined>) {
  const url = new URL(baseUrl)
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value)
  })
  window.location.href = url.toString()
}

export default function OAuthConsent() {
  const query = useQueryParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [deciding, setDeciding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consent, setConsent] = useState<AuthorizeResponse | null>(null)

  useEffect(() => {
    const start = async () => {
      const { client_id, redirect_uri, scope, state, code_challenge, code_challenge_method, nonce } = query
      if (!client_id || !redirect_uri) {
        setError('Missing required authorization parameters (client_id, redirect_uri).')
        setLoading(false)
        return
      }

      try {
        const params = new URLSearchParams({
          response_type: 'code',
          client_id,
          redirect_uri,
          scope: scope || 'openid',
        })
        if (state) params.set('state', state)
        if (code_challenge) params.set('code_challenge', code_challenge)
        if (code_challenge_method) params.set('code_challenge_method', code_challenge_method)
        if (nonce) params.set('nonce', nonce)

        const response = await endUserApiClient.get<AuthorizeResponse>(`/oauth/authorize?${params.toString()}`)

        if (!response.requiresConsent) {
          // First-party/trusted client — already approved server-side, just
          // carry the browser through to the redirect_uri with the code.
          redirectWithParams(redirect_uri, { code: response.code, state: response.state })
          return
        }

        setConsent(response)
      } catch (err: any) {
        console.error('Failed to start OAuth authorization:', err)
        if (err instanceof EndUserApiError && err.status === 401) {
          // No end-user session (or it expired and could not be silently
          // refreshed) — send the visitor to sign in, then bring them right
          // back to this exact authorize request.
          const returnTo = window.location.pathname + window.location.search
          router.replace(`/auth/user/sign-in?returnTo=${encodeURIComponent(returnTo)}`)
          return
        }
        setError(err instanceof EndUserApiError ? err.message : 'Unable to start the authorization request.')
      } finally {
        setLoading(false)
      }
    }

    start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDecision = async (decision: 'approve' | 'deny') => {
    if (!consent?.consentTicket) return
    setDeciding(true)
    try {
      const response = await endUserApiClient.post<ConsentResponse>('/oauth/consent', {
        consentTicket: consent.consentTicket,
        decision,
      })

      if (response.approved) {
        redirectWithParams(response.redirectUri, { code: response.code, state: response.state })
      } else {
        redirectWithParams(response.redirectUri, { error: response.error || 'access_denied', state: response.state })
      }
    } catch (err: any) {
      console.error('Failed to resolve consent:', err)
      setError(err instanceof EndUserApiError ? err.message : 'Unable to process your decision. Please try again.')
      setDeciding(false)
    }
  }

  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100 p-3 bg-body-tertiary">
      <PublicAuthBrand />

      <Card className="shadow-sm border-0" style={{ maxWidth: 440, width: '100%' }}>
        <Card.Body className="p-4 p-md-5">
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-3 mb-0 fs-13">Preparing authorization request...</p>
            </div>
          ) : error ? (
            <div className="text-center py-3">
              <IconifyIcon icon="solar:danger-triangle-bold-duotone" className="text-danger fs-40 mb-2" />
              <h5 className="fw-bold">Authorization Error</h5>
              <p className="text-muted fs-13">{error}</p>
            </div>
          ) : consent ? (
            <>
              <div className="text-center mb-4">
                <h5 className="fw-bold mb-1">{consent.client?.name || 'Third-Party Application'}</h5>
                <p className="text-muted fs-13 mb-0">wants to access your WPA Central Auth account</p>
              </div>

              <div className="bg-light rounded p-3 mb-4">
                <p className="fw-semibold fs-13 mb-2">This application will be able to:</p>
                <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                  {(consent.scopes || []).map((scope) => (
                    <li key={scope} className="d-flex align-items-start gap-2 fs-13">
                      <IconifyIcon icon="solar:check-circle-bold-duotone" className="text-success fs-16 mt-1 flex-shrink-0" />
                      <span>
                        {SCOPE_DESCRIPTIONS[scope] || scope}
                        <Badge bg="soft-secondary" className="text-secondary ms-2 fs-10 align-middle">
                          {scope}
                        </Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-muted fs-11 text-center mb-4">
                By approving, you allow this application to access the information above. You can revoke access at any time
                from your account security settings.
              </p>

              <div className="d-flex flex-column flex-sm-row gap-2">
                <Button
                  variant="light"
                  className="flex-fill order-2 order-sm-1"
                  disabled={deciding}
                  onClick={() => handleDecision('deny')}
                >
                  Deny
                </Button>
                <Button
                  variant="primary"
                  className="flex-fill order-1 order-sm-2"
                  disabled={deciding}
                  onClick={() => handleDecision('approve')}
                >
                  {deciding ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                  Approve
                </Button>
              </div>
            </>
          ) : null}
        </Card.Body>
      </Card>
    </div>
  )
}
