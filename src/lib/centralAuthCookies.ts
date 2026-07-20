// Stage 2 (Global Super Admin - Central Auth SSO): shared cookie names and
// options for the OAuth/PKCE login path against WPA Central Auth
// (auth.worldpetsassociation.com). All cookies here are HttpOnly - unlike
// the pre-existing local-login path (see src/lib/authTokens.ts), which
// stores its tokens in localStorage, this path must never expose tokens to
// client-side JS. Do not add a client-readable mirror of these values.

/** One-time cookie holding the PKCE code_verifier + state for the duration
 *  of the round trip to Central Auth's login page and back. Cleared as soon
 *  as the callback route consumes it. */
export const CENTRAL_AUTH_PKCE_COOKIE = 'wpa_ca_pkce'

/** Central-Auth-issued access token (JWT), mirrors its own expiry. */
export const CENTRAL_AUTH_ACCESS_COOKIE = 'wpa_ca_access_token'

/** Central-Auth-issued refresh token. */
export const CENTRAL_AUTH_REFRESH_COOKIE = 'wpa_ca_refresh_token'

/** Epoch-ms timestamp the access token expires at, so server-side readers
 *  can decide to refresh without needing to decode the JWT. */
export const CENTRAL_AUTH_EXPIRES_COOKIE = 'wpa_ca_access_expires_at'

/** Long enough to cover Central Auth's own login-page interaction, short
 *  enough that an abandoned attempt doesn't leave a stale cookie around. */
export const PKCE_COOKIE_MAX_AGE_SECONDS = 300

/** Ceiling for the refresh-token cookie lifetime. wpa-auth-api's own
 *  REFRESH_TOKEN_TTL (default 30d) governs actual validity server-side;
 *  this is just how long the browser is asked to hold onto the cookie. If
 *  the server-side token expires/rotates sooner, the refresh call simply
 *  fails and the session is cleared. */
export const REFRESH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

export const secureCookieBaseOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
}
