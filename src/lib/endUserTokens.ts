// Phase 2.5 (docs/phase-2-5-public-auth-rs256-oidc.md): deliberately
// separate localStorage keys from lib/authTokens.ts (the admin session).
// End users and admin operators are different account types (see
// auth.service.ts registerUser/loginUser vs admin.routes.ts adminAuthRouter)
// and must never share a browser-side session — an end user completing
// OAuth consent must not overwrite (or be overwritten by) an admin's
// logged-in session in the same browser profile.
const ACCESS_TOKEN_KEY = 'wpa_enduser_access_token'
const REFRESH_TOKEN_KEY = 'wpa_enduser_refresh_token'

const isBrowser = () => typeof window !== 'undefined'

export const getEndUserAccessToken = () => {
  if (!isBrowser()) return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export const setEndUserAccessToken = (token: string) => {
  if (!isBrowser()) return
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export const getEndUserRefreshToken = () => {
  if (!isBrowser()) return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export const setEndUserRefreshToken = (token: string) => {
  if (!isBrowser()) return
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export const clearEndUserTokens = () => {
  if (!isBrowser()) return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export const hasEndUserAccessToken = () => Boolean(getEndUserAccessToken())
