// Stage 2 (Central Auth SSO): PKCE (RFC 7636) helpers. Server-side only -
// these run in Route Handlers, never in the browser.
import { randomBytes, createHash } from 'node:crypto'

function base64url(input: Buffer): string {
  return input.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** High-entropy random string, base64url-encoded per RFC 7636 (43-128 chars). */
export function generateCodeVerifier(): string {
  return base64url(randomBytes(32))
}

/** S256 code_challenge derived from a code_verifier. */
export function generateCodeChallenge(verifier: string): string {
  return base64url(createHash('sha256').update(verifier).digest())
}

/** Opaque anti-CSRF value for the OAuth `state` parameter. */
export function generateState(): string {
  return base64url(randomBytes(24))
}
