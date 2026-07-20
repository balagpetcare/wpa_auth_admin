// Stage 2 (Central Auth SSO): POST /api/auth/central-auth/logout
//
// Best-effort logout for the Central Auth SSO path: revokes the refresh
// token at Central Auth's /oauth/revoke and clears the HttpOnly session
// cookies. Safe to call unconditionally - it's a no-op when no Central Auth
// cookie session exists, so useAuthContext's logout() (see
// src/context/useAuthContext.tsx) calls this alongside its existing
// POST /admin/auth/logout without needing to know which path signed the
// user in.
import { NextResponse } from 'next/server'
import { hasCentralAuthSessionCookie, revokeCentralAuthSession } from '@/lib/centralAuthSession'

export const dynamic = 'force-dynamic'

export async function POST() {
  if (await hasCentralAuthSessionCookie()) {
    await revokeCentralAuthSession()
  }
  return NextResponse.json({ success: true })
}
