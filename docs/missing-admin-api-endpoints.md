# Missing Admin API Endpoints

Audit date: 2026-07-02

This file tracks UI expectations that are not backed by a confirmed backend endpoint in the current API source tree.

## Confirmed Missing or Wrong Paths

No confirmed missing admin users or role/permission endpoints remain after the backend implementation in this pass.

The UI has been updated to use the canonical admin endpoints:
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/users/:id`
- `POST /api/v1/admin/users/invite`
- `PATCH /api/v1/admin/users/:id`
- `PATCH /api/v1/admin/users/:id/status`
- `PATCH /api/v1/admin/users/:id/roles`
- `GET /api/v1/admin/roles`
- `GET /api/v1/admin/permissions`
- `GET /api/v1/admin/roles/:id`
- `PATCH /api/v1/admin/roles/:id/permissions`

## Backend Endpoint Gaps

The following UI features are intentionally API-required placeholders or require final contract confirmation:

### Service tokens

- UI module: `src/features/service-tokens/api.ts`
- Current behavior: API-required placeholder
- Backend status: no confirmed mounted `/api/v1/admin/service-tokens` or equivalent endpoint was found
- Required backend endpoints if the feature is to be real:
  - `GET /api/v1/admin/service-tokens`
  - `POST /api/v1/admin/service-tokens`
  - `DELETE /api/v1/admin/service-tokens/:id`
  - `PATCH /api/v1/admin/service-tokens/:id/rotate`

### Communication / email settings

- UI module: `src/features/communication/api.ts`
- Backend routes are present in source and match the current frontend helper paths.
- The remaining work is response-shape verification for the top-level pages and dropdowns, not missing routes.
  - `GET /api/v1/admin/communication/providers`
  - `POST /api/v1/admin/communication/providers/:providerId/test-sms`
  - `POST /api/v1/admin/communication/providers/:providerId/test-email`
  - `GET /api/v1/admin/email-branding`
  - `PATCH /api/v1/admin/email-branding`
  - `GET /api/v1/admin/email-templates`
  - `POST /api/v1/admin/email-templates/:templateId/send-test`

## Runtime Contract Mismatch

### Notifications dropdown

- UI path: `GET /api/v1/admin/notifications`
- Backend path: exists
- Problem: frontend now normalizes nested payloads and unread-count responses
- Status: fixed in the UI

## Prioritized Follow-Up

1. Keep service tokens simulated until a real backend surface is added.
2. Keep the service-tokens module on an API-required placeholder until a real backend surface is added.
3. Communication/email surface is verified at route level; keep an eye on response-shape drift.
