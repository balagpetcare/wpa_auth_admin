// Stage 2 (Central Auth SSO): server-side session reader for the
// HttpOnly-cookie session set by src/app/api/auth/callback/central-auth/route.ts.
//
// IMPORTANT: functions here that mutate cookies (getCentralAuthAccessToken,
// clearCentralAuthSession, revokeCentralAuthSession) may only be called from
// a Route Handler or Server Action - Next.js throws if you try to write
// cookies during a Server Component render. Server Components that only
// need to know "is there a session" should use hasCentralAuthSessionCookie(),
// which is read-only.
//
// This module intentionally never returns tokens to client-side code -
// callers that need to make an authenticated API call should do so
// server-side (see src/app/api/auth/central-auth/session/route.ts for the
// pattern) and hand the browser back only the derived result.

import { cookies } from 'next/headers'
import { centralAuthConfig } from './centralAuthConfig'
import {
  CENTRAL_AUTH_ACCESS_COOKIE,
  CENTRAL_AUTH_REFRESH_COOKIE,
  CENTRAL_AUTH_EXPIRES_COOKIE,
  REFRESH_COOKIE_MAX_AGE_SECONDS,
  secureCookieBaseOptions,
} from './centralAuthCookies'

// Refresh a little before actual expiry so a request that's mid-flight
// doesn't get a token that expires before it reaches wpa-auth-api.
const EXPIRY_SKEW_MS = 30_000

interface CentralAuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

interface TokenGrantResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

async function readTokens(): Promise<CentralAuthTokens | null> {
  const store = await cookies()
  const accessToken = store.get(CENTRAL_AUTH_ACCESS_COOKIE)?.value
  const refreshToken = store.get(CENTRAL_AUTH_REFRESH_COOKIE)?.value
  if (!accessToken || !refreshToken) return null
  const expiresAtRaw = store.get(CENTRAL_AUTH_EXPIRES_COOKIE)?.value
  const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : 0
  return { accessToken, refreshToken, expiresAt: Number.isFinite(expiresAt) ? expiresAt : 0 }
}

async function persistTokens(tokens: TokenGrantResponse) {
  const store = await cookies()
  const expiresAt = Date.now() + tokens.expires_in * 1000
  store.set(CENTRAL_AUTH_ACCESS_COOKIE, tokens.access_token, { ...secureCookieBaseOptions, maxAge: tokens.expires_in })
  store.set(CENTRAL_AUTH_REFRESH_COOKIE, tokens.refresh_token, { ...secureCookieBaseOptions, maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS })
  store.set(CENTRAL_AUTH_EXPIRES_COOKIE, String(expiresAt), { ...secureCookieBaseOptions, maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS })
}

/** Clears the Central Auth session cookies locally. Does not call the
 *  revoke endpoint - use revokeCentralAuthSession() for logout. */
export async function clearCentralAuthSession() {
  const store = await cookies()
  store.set(CENTRAL_AUTH_ACCESS_COOKIE, '', { ...secureCookieBaseOptions, maxAge: 0 })
  store.set(CENTRAL_AUTH_REFRESH_COOKIE, '', { ...secureCookieBaseOptions, maxAge: 0 })
  store.set(CENTRAL_AUTH_EXPIRES_COOKIE, '', { ...secureCookieBaseOptions, maxAge: 0 })
}

async function refreshTokens(refreshToken: string): Promise<TokenGrantResponse | null> {
  if (!centralAuthConfig.clientId || !centralAuthConfig.clientSecret) return null
  try {
    const res = await fetch(centralAuthConfig.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: centralAuthConfig.clientId,
        client_secret: centralAuthConfig.clientSecret,
        refresh_token: refreshToken,
      }),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json().catch(() => null)
    if (!data?.access_token || !data?.refresh_token || typeof data?.expires_in !== 'number') return null
    return data as TokenGrantResponse
  } catch (err) {
    // Never log token values - only the fact that the call failed.
    console.error('Central Auth refresh_token grant failed:', err instanceof Error ? err.message : 'unknown error')
    return null
  }
}

/**
 * Returns a currently-valid Central Auth access token for the signed-in
 * browser session, transparently refreshing (and rotating the cookies) if
 * the stored token is at/near expiry. Returns null if there is no session
 * or refresh fails (in which case the cookies are cleared).
 *
 * Must be called from a Route Handler or Server Action.
 */
export async function getCentralAuthAccessToken(): Promise<string | null> {
  const tokens = await readTokens()
  if (!tokens) return null

  if (tokens.expiresAt - EXPIRY_SKEW_MS > Date.now()) {
    return tokens.accessToken
  }

  const refreshed = await refreshTokens(tokens.refreshToken)
  if (!refreshed) {
    await clearCentralAuthSession()
    return null
  }

  await persistTokens(refreshed)
  return refreshed.access_token
}

/** Read-only existence check, safe to call from Server Components. Does
 *  NOT validate/refresh the token - just reflects whether cookies are
 *  present. */
export async function hasCentralAuthSessionCookie(): Promise<boolean> {
  const store = await cookies()
  return Boolean(store.get(CENTRAL_AUTH_ACCESS_COOKIE)?.value || store.get(CENTRAL_AUTH_REFRESH_COOKIE)?.value)
}

/** Best-effort revoke at Central Auth, then clears the local cookies
 *  regardless of whether the revoke call succeeded. Safe to call even when
 *  no session exists (no-op). */
export async function revokeCentralAuthSession() {
  const tokens = await readTokens()
  if (tokens && centralAuthConfig.clientId && centralAuthConfig.clientSecret) {
    try {
      await fetch(centralAuthConfig.revokeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokens.refreshToken,
          client_id: centralAuthConfig.clientId,
          client_secret: centralAuthConfig.clientSecret,
        }),
        cache: 'no-store',
      })
    } catch (err) {
      console.error('Central Auth revoke call failed:', err instanceof Error ? err.message : 'unknown error')
    }
  }
  await clearCentralAuthSession()
}
