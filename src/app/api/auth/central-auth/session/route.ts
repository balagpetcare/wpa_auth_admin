// Stage 2 (Central Auth SSO): GET /api/auth/central-auth/session
//
// Thin server-side proxy: reads the HttpOnly Central Auth cookie session
// (transparently refreshing it if near expiry - see
// src/lib/centralAuthSession.ts), then makes an authenticated call to
// wpa-auth-api on the caller's behalf. Client-side JS never sees the access
// token itself, only this endpoint's { authenticated, user } response. This
// is what proves the flow end-to-end: login -> HttpOnly cookie session ->
// authenticated server-side call to GET /admin/auth/me succeeds.
//
// Consumed by useAuthContext's refreshAdmin() so the app shell recognizes a
// Central-Auth-originated session in addition to the pre-existing
// localStorage-token session (see src/context/useAuthContext.tsx).
import { NextResponse } from 'next/server'
import { getCentralAuthAccessToken } from '@/lib/centralAuthSession'
import { centralAuthConfig } from '@/lib/centralAuthConfig'

export const dynamic = 'force-dynamic'

export async function GET() {
  const accessToken = await getCentralAuthAccessToken()
  if (!accessToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  try {
    const res = await fetch(centralAuthConfig.meUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const data = await res.json().catch(() => null)
    if (!data?.success || !data?.user) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({ authenticated: true, user: data.user })
  } catch (err) {
    console.error('Central Auth session proxy call failed:', err instanceof Error ? err.message : 'unknown error')
    return NextResponse.json({ authenticated: false }, { status: 502 })
  }
}
