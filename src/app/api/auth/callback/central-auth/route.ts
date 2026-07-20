// Stage 2 (Central Auth SSO): GET /api/auth/callback/central-auth
//
// This path is fixed by the redirect_uri registered for this app in
// Central Auth (https://auth-admin.worldpetsassociation.com/api/auth/callback/central-auth)
// - do not rename/move this file without also updating the client
// registration.
//
// Verifies `state` against the PKCE cookie set by
// src/app/api/auth/central-auth/start/route.ts, exchanges the authorization
// `code` for tokens server-side (confidential client - sends
// CENTRAL_AUTH_CLIENT_SECRET), and sets the resulting access/refresh tokens
// as separate HttpOnly cookies. Errors are handled generically: no backend
// error detail, token value, or secret is ever logged or sent to the
// browser.
import { NextRequest, NextResponse } from 'next/server'
import { centralAuthConfig } from '@/lib/centralAuthConfig'
import {
  CENTRAL_AUTH_ACCESS_COOKIE,
  CENTRAL_AUTH_EXPIRES_COOKIE,
  CENTRAL_AUTH_PKCE_COOKIE,
  CENTRAL_AUTH_REFRESH_COOKIE,
  REFRESH_COOKIE_MAX_AGE_SECONDS,
  secureCookieBaseOptions,
} from '@/lib/centralAuthCookies'

export const dynamic = 'force-dynamic'

interface PkceCookiePayload {
  codeVerifier: string
  state: string
  returnTo: string
}

interface TokenGrantResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

function redirectToSignInWithError(request: NextRequest, code: string) {
  const url = new URL('/auth/sign-in', request.url)
  url.searchParams.set('ssoError', code)
  return NextResponse.redirect(url)
}

function clearPkceCookie(response: NextResponse) {
  response.cookies.set(CENTRAL_AUTH_PKCE_COOKIE, '', { ...secureCookieBaseOptions, maxAge: 0 })
  return response
}

function sanitizeReturnTo(value: string | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  return value
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const providerError = searchParams.get('error')
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const pkceCookieValue = request.cookies.get(CENTRAL_AUTH_PKCE_COOKIE)?.value

  // Central Auth itself reported a failure (e.g. access_denied) - generic
  // redirect, never echo the provider's error/description back verbatim.
  if (providerError) {
    return clearPkceCookie(redirectToSignInWithError(request, 'denied'))
  }

  if (!code || !state || !pkceCookieValue) {
    return clearPkceCookie(redirectToSignInWithError(request, 'invalid_request'))
  }

  let stored: PkceCookiePayload
  try {
    stored = JSON.parse(pkceCookieValue)
    if (!stored?.codeVerifier || !stored?.state) throw new Error('malformed pkce cookie')
  } catch {
    return clearPkceCookie(redirectToSignInWithError(request, 'invalid_request'))
  }

  // Anti-CSRF: the state Central Auth echoes back must match what we
  // generated for this browser in /api/auth/central-auth/start.
  if (stored.state !== state) {
    return clearPkceCookie(redirectToSignInWithError(request, 'state_mismatch'))
  }

  if (!centralAuthConfig.clientId || !centralAuthConfig.clientSecret) {
    return clearPkceCookie(redirectToSignInWithError(request, 'config'))
  }

  let tokens: TokenGrantResponse
  try {
    const tokenRes = await fetch(centralAuthConfig.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: centralAuthConfig.clientId,
        client_secret: centralAuthConfig.clientSecret,
        code,
        redirect_uri: centralAuthConfig.redirectUri,
        code_verifier: stored.codeVerifier,
      }),
      cache: 'no-store',
    })

    if (!tokenRes.ok) {
      // Log only the status, never the response body (may echo request
      // fields) or any token/secret value.
      console.error(`Central Auth token exchange failed with status ${tokenRes.status}`)
      return clearPkceCookie(redirectToSignInWithError(request, 'exchange_failed'))
    }

    const data = await tokenRes.json().catch(() => null)
    if (!data?.access_token || !data?.refresh_token || typeof data?.expires_in !== 'number') {
      return clearPkceCookie(redirectToSignInWithError(request, 'exchange_failed'))
    }
    tokens = data
  } catch (err) {
    console.error('Central Auth token exchange request failed:', err instanceof Error ? err.message : 'unknown error')
    return clearPkceCookie(redirectToSignInWithError(request, 'exchange_failed'))
  }

  const returnTo = sanitizeReturnTo(stored.returnTo)
  const response = NextResponse.redirect(new URL(returnTo, request.url))

  const expiresAt = Date.now() + tokens.expires_in * 1000
  response.cookies.set(CENTRAL_AUTH_ACCESS_COOKIE, tokens.access_token, {
    ...secureCookieBaseOptions,
    maxAge: tokens.expires_in,
  })
  response.cookies.set(CENTRAL_AUTH_REFRESH_COOKIE, tokens.refresh_token, {
    ...secureCookieBaseOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
  })
  response.cookies.set(CENTRAL_AUTH_EXPIRES_COOKIE, String(expiresAt), {
    ...secureCookieBaseOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
  })

  return clearPkceCookie(response)
}
