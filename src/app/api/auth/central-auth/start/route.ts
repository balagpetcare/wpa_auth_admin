// Stage 2 (Central Auth SSO): GET /api/auth/central-auth/start
//
// Entry point for "Sign in with WPA Central Auth". Generates a PKCE
// code_verifier/code_challenge (S256) and an anti-CSRF `state`, stashes them
// in a short-lived HttpOnly cookie, and redirects the browser to Central
// Auth's authorization endpoint. The callback route
// (src/app/api/auth/callback/central-auth/route.ts) reads that cookie back
// to verify `state` and complete the code exchange.
import { NextRequest, NextResponse } from 'next/server'
import { generateCodeChallenge, generateCodeVerifier, generateState } from '@/lib/pkce'
import { centralAuthConfig } from '@/lib/centralAuthConfig'
import { CENTRAL_AUTH_PKCE_COOKIE, PKCE_COOKIE_MAX_AGE_SECONDS, secureCookieBaseOptions } from '@/lib/centralAuthCookies'

export const dynamic = 'force-dynamic'

/** Only ever allow redirecting back into this app after login - never an
 *  absolute/external URL (open-redirect guard). */
function sanitizeReturnTo(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  return value
}

export async function GET(request: NextRequest) {
  if (!centralAuthConfig.clientId) {
    // Misconfiguration (missing CENTRAL_AUTH_CLIENT_ID) - fail generically,
    // do not surface any config detail to the browser.
    return NextResponse.redirect(new URL('/auth/sign-in?ssoError=config', centralAuthConfig.adminPanelUrl))
  }

  const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get('returnTo'))
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)
  const state = generateState()

  const authorizeUrl = new URL(centralAuthConfig.authorizeUrl)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('client_id', centralAuthConfig.clientId)
  authorizeUrl.searchParams.set('redirect_uri', centralAuthConfig.redirectUri)
  authorizeUrl.searchParams.set('scope', centralAuthConfig.scope)
  authorizeUrl.searchParams.set('state', state)
  authorizeUrl.searchParams.set('code_challenge', codeChallenge)
  authorizeUrl.searchParams.set('code_challenge_method', 'S256')

  const response = NextResponse.redirect(authorizeUrl)
  response.cookies.set(CENTRAL_AUTH_PKCE_COOKIE, JSON.stringify({ codeVerifier, state, returnTo }), {
    ...secureCookieBaseOptions,
    maxAge: PKCE_COOKIE_MAX_AGE_SECONDS,
  })
  return response
}
