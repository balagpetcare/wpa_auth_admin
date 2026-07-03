# WPA Central Auth Production Deployment Handoff

Branch: `final/central-auth-production-readiness`
Date: 2026-07-03

## Final objective status

- Central authentication system: Complete
- API objective: Complete
- Admin UI objective: Complete
- Production deployment readiness: Ready with accepted dependency risk

## Accepted dependency risks

- API: `prisma` 7.8.0 transitive `@prisma/dev` -> `@hono/node-server`, moderate, dev/build-toolchain only
- Auth Web: `next` -> `postcss`, moderate, production dependency, no safe non-breaking fix identified
- Admin UI: `next` -> `postcss`, moderate
- Admin UI: `next-auth` -> `uuid`, moderate
- Admin UI: `react-quill-new` -> `quill`, low

There were no unresolved Critical or High dependency issues in the final audit pass. A fully clean `npm audit --omit=dev` would require breaking framework/auth/editor upgrades or replacements.

## Production checklist

Admin UI deployment order:

1. `npm ci`
2. `npm run build`
3. Reload or start the admin process with PM2

Infrastructure checklist:

- Confirm Nginx reverse proxy routes the admin domain correctly
- Confirm HTTPS is enabled and cookies are marked `secure=true` in production
- Confirm trusted CORS origins include only production auth web and admin origins
- Confirm the API base URL points to the production API
- Confirm Redis is reachable for the API before enabling production auth traffic
- Run smoke tests after deployment

## Smoke test checklist

- Admin login works
- Social provider enable/disable works from the admin UI
- Social provider public metadata API does not expose secrets
- Admin RBAC blocks unauthorized provider management
- OAuth callback with valid state succeeds
- OAuth callback with invalid or missing state fails safely
- Redirect and return URLs cannot target untrusted domains
- Build assets load correctly in light and dark theme

## Environment template notes

Required production variables should be documented without secrets:

- `NEXT_PUBLIC_APP_ENV`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_BRAND_NAME`
- `NEXT_PUBLIC_APP_TAGLINE`
- `NEXT_PUBLIC_SUPPORT_EMAIL`
- `NEXT_PUBLIC_AUTH_WEB_URL`
- `NEXT_PUBLIC_ADMIN_WEB_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_DEFAULT_REDIRECT_URL`

No real secret values should ever be committed to this document or to `.env.example`.
