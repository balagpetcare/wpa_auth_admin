// Stage 2 (Central Auth SSO): server-side-only config for this app acting
// as an OAuth client of its own backend (wpa-auth-api / Central Auth). The
// client_id/client_secret are provisioned out-of-band in
// /srv/config/wpa/auth-admin.env (symlinked to .env.production.local) as
// CENTRAL_AUTH_CLIENT_ID / CENTRAL_AUTH_CLIENT_SECRET - referenced here by
// name only, never logged.

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const AUTH_WEB_URL = stripTrailingSlash(process.env.AUTH_WEB_URL || process.env.NEXT_PUBLIC_AUTH_WEB_URL || 'https://auth.worldpetsassociation.com')

const API_BASE_URL = stripTrailingSlash(process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://auth.worldpetsassociation.com/api/v1')

const ADMIN_PANEL_URL = stripTrailingSlash(process.env.ADMIN_PANEL_URL || process.env.NEXT_PUBLIC_ADMIN_WEB_URL || 'https://auth-admin.worldpetsassociation.com')

export const centralAuthConfig = {
  adminPanelUrl: ADMIN_PANEL_URL,
  clientId: process.env.CENTRAL_AUTH_CLIENT_ID,
  clientSecret: process.env.CENTRAL_AUTH_CLIENT_SECRET,

  // Browser-facing authorize page (auth-web), NOT the /api/v1 JSON API -
  // this is the URL that shows Central Auth's own branded login page when
  // the browser isn't already signed in there.
  authorizeUrl: `${AUTH_WEB_URL}/oauth/authorize`,

  // Server-to-server (confidential client) endpoints on wpa-auth-api.
  tokenUrl: `${API_BASE_URL}/oauth/token`,
  revokeUrl: `${API_BASE_URL}/oauth/revoke`,
  meUrl: `${API_BASE_URL}/admin/auth/me`,

  // Must exactly match the redirect_uri registered for this client in
  // Central Auth: https://auth-admin.worldpetsassociation.com/api/auth/callback/central-auth
  redirectUri: `${ADMIN_PANEL_URL}/api/auth/callback/central-auth`,

  scope: 'openid',
} as const
