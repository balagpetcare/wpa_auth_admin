# WPA Central Auth Admin UI to API Coverage Audit

Audit date: 2026-07-02

Scope:
- API project: `wpa_auth_api`
- Admin UI project: `wpa_auth_admin`
- Base API prefix: `/api/v1`
- Root health endpoint: `/health`

## Executive Summary

- The API project exposes a large admin surface under `GET/POST/PATCH/DELETE /api/v1/admin/*`.
- The admin UI is partially aligned with those routes, but several pages still call wrong paths or depend on placeholder-backed features.
- The immediate production issue on `/admin-users` is a frontend path bug, not a missing backend route.
- The biggest risk areas are:
  - direct use of `apiClient.get('/admin-users')` in the dashboard page
  - service tokens page using an in-browser mock instead of real endpoints
  - notifications UI expecting a response shape that does not match the current backend
  - communication/email settings pages calling routes that are not mounted in the API

## Exact Root Cause of `/admin-users` 404

- Frontend call site: `wpa_auth_admin/src/features/admin-users/api.ts`
- Wrong path used: `GET /api/v1/admin-users`
- Real backend route: `GET /api/v1/admin/admin-users`
- Result: the browser requests a path that is not registered, so Express returns 404 `Not Found`.

The dashboard page has the same bug:
- `wpa_auth_admin/src/app/(admin)/dashboard/page.tsx` calls `GET /admin-users?limit=5`
- That is also missing the `/admin` segment.

## Real API Endpoints Found

### Root

| Method | Full Path | Route File | Handler | Auth | Permission | Response Shape |
|---|---|---|---|---|---|---|
| GET | `/health` | `src/server.ts` | inline handler | No | None | `{ status, timestamp, uptime }` |

### API prefix

The router is mounted at `config.API_PREFIX`, defaulting to `/api/v1` in `src/config/index.ts`.

### Auth

| Method | Full Path | Route File | Handler | Auth | Permission | Response Shape |
|---|---|---|---|---|---|---|
| POST | `/api/v1/auth/register` | `src/modules/auth/auth.routes.ts` | `registerUser` | No | None | `{ success: true, user }` |
| POST | `/api/v1/auth/login` | `src/modules/auth/auth.routes.ts` | `loginUser` | No | None | `{ success: true, ...result }` |
| POST | `/api/v1/auth/refresh` | `src/modules/auth/auth.routes.ts` | `refreshTokens` | No | None | `{ success: true, ...result }` |
| POST | `/api/v1/auth/logout` | `src/modules/auth/auth.routes.ts` | `logoutUser` | Yes | `authGuard` | `{ success: true, message }` |
| GET | `/api/v1/auth/me` | `src/modules/auth/auth.routes.ts` | `getCurrentUser` | Yes | `authGuard` | `{ success: true, user }` |
| POST | `/api/v1/auth/forgot-password` | `src/modules/auth/auth.routes.ts` | `forgotPassword` | No | None | `{ success: true, message }` |
| POST | `/api/v1/auth/reset-password` | `src/modules/auth/auth.routes.ts` | `resetPassword` | No | None | `{ success: true, message }` |
| POST | `/api/v1/auth/verify-email/request` | `src/modules/auth/auth.routes.ts` | `requestEmailVerification` | Yes | `authGuard` | `{ success: true, message }` |
| POST | `/api/v1/auth/verify-email/confirm` | `src/modules/auth/auth.routes.ts` | `confirmEmailVerification` | No | None | `{ success: true, message }` |
| GET | `/api/v1/auth/admin-invitations/verify` | `src/modules/auth/auth.routes.ts` | `verifyAdminInvitation` | No | None | `{ success: true, data }` |
| POST | `/api/v1/auth/admin-invitations/accept` | `src/modules/auth/auth.routes.ts` | `acceptAdminInvitation` | No | None | result object |
| GET | `/api/v1/auth/social/providers` | `src/modules/auth/social.routes.ts` | provider list | No | None | provider list |
| GET | `/api/v1/auth/social/:provider/start` | `src/modules/auth/social.routes.ts` | start flow | No | rate limited | redirect / auth flow |
| GET | `/api/v1/auth/social/:provider/callback` | `src/modules/auth/social.routes.ts` | callback flow | No | rate limited | redirect / auth flow |
| POST | `/api/v1/auth/social/:provider/mobile` | `src/modules/auth/social.routes.ts` | mobile flow | No | rate limited | auth result |

### Users

| Method | Full Path | Route File | Handler | Auth | Permission | Response Shape |
|---|---|---|---|---|---|---|
| GET | `/api/v1/users/me` | `src/modules/users/users.routes.ts` | `getCurrentUser` | Yes | `authGuard` | `{ success: true, user }` |

### OAuth

| Method | Full Path | Route File | Handler | Auth | Permission | Response Shape |
|---|---|---|---|---|---|---|
| GET | `/api/v1/oauth/authorize` | `src/modules/oauth/oauth.routes.ts` | authorize flow | Yes | `authGuard` | redirect / auth flow |
| POST | `/api/v1/oauth/token` | `src/modules/oauth/oauth.routes.ts` | token exchange | No | rate limited | token response |
| GET | `/api/v1/oauth/userinfo` | `src/modules/oauth/oauth.routes.ts` | userinfo | Yes | `authGuard` | user info |
| GET | `/api/v1/oauth/jwks` | `src/modules/oauth/oauth.routes.ts` | JWKS | No | None | JWKS JSON |
| POST | `/api/v1/oauth/introspect` | `src/modules/oauth/oauth.routes.ts` | introspect | No | rate limited | introspection JSON |
| POST | `/api/v1/oauth/revoke` | `src/modules/oauth/oauth.routes.ts` | revoke | No | rate limited | revoke response |

### Admin Auth

| Method | Full Path | Route File | Handler | Auth | Permission | Response Shape |
|---|---|---|---|---|---|---|
| POST | `/api/v1/admin/auth/login` | `src/modules/admin/admin.routes.ts` | shared auth login + admin check | No | None | `{ success: true, ...result }` |
| GET | `/api/v1/admin/auth/me` | `src/modules/admin/admin.routes.ts` | `getCurrentUser` | Yes | `authGuard + requireAdmin` | `{ success: true, user }` |
| POST | `/api/v1/admin/auth/logout` | `src/modules/admin/admin.routes.ts` | `logoutUser` | Yes | `authGuard + requireAdmin` | `{ success: true, message }` |

### Admin Users

| Method | Full Path | Route File | Handler | Auth | Permission | Response Shape |
|---|---|---|---|---|---|---|
| GET | `/api/v1/admin/users/summary` | `src/modules/admin/admin.routes.ts` | `getUsersSummary` | Yes | `authGuard + requireAdmin` | `{ success: true, summary }` |
| GET | `/api/v1/admin/users` | `src/modules/admin/admin.routes.ts` | `listUsers` | Yes | `authGuard + requireAdmin` | `{ success: true, data }` |
| GET | `/api/v1/admin/users/:id` | `src/modules/admin/admin.routes.ts` | `getUserById` | Yes | `authGuard + requireAdmin` | `{ success: true, user }` |
| PATCH | `/api/v1/admin/users/:id/status` | `src/modules/admin/admin.routes.ts` | `updateUserStatus` | Yes | `authGuard + requireAdmin` | `{ success: true, user }` |
| PATCH | `/api/v1/admin/users/:id` | `src/modules/admin/admin.routes.ts` | `updateUser` | Yes | `authGuard + requireAdmin` | `{ success: true, user }` |
| DELETE | `/api/v1/admin/users/:id` | `src/modules/admin/admin.routes.ts` | `deleteUserAccount` | Yes | `authGuard + requireAdmin` | `{ success: true, message, user }` |
| POST | `/api/v1/admin/users/:id/reset-password` | `src/modules/admin/admin.routes.ts` | `resetUserPasswordAdmin` | Yes | `authGuard + requireAdmin` | `{ success: true, ...result }` |
| POST | `/api/v1/admin/users/:id/revoke-sessions` | `src/modules/admin/admin.routes.ts` | `revokeUserSessions` | Yes | `authGuard + requireAdmin` | `{ success: true, ...result }` |
| GET | `/api/v1/admin/users/:id/sessions` | `src/modules/admin/admin.routes.ts` | `getUserSessions` | Yes | `authGuard + requireAdmin` | `{ success: true, sessions }` |
| GET | `/api/v1/admin/users/:id/audit-logs` | `src/modules/admin/admin.routes.ts` | `getUserAuditLogs` | Yes | `authGuard + requireAdmin` | `{ success: true, ...paginatedResponse }` |
| POST | `/api/v1/admin/users/:id/roles` | `src/modules/admin/admin.routes.ts` | `assignRoleToUser` | Yes | `authGuard + requireAdmin` | `{ success: true, message }` |
| DELETE | `/api/v1/admin/users/:id/roles/:roleId` | `src/modules/admin/admin.routes.ts` | `removeRoleFromUser` | Yes | `authGuard + requireAdmin` | `{ success: true, message }` |

### Roles and Permissions

| Method | Full Path | Route File | Handler | Auth | Permission | Response Shape |
|---|---|---|---|---|---|---|
| GET | `/api/v1/admin/roles` | `src/modules/admin/admin.routes.ts` | `listRoles` | Yes | `roles:read` | `{ success: true, roles }` |
| GET | `/api/v1/admin/roles/:id` | `src/modules/admin/admin.routes.ts` | `getRoleById` | Yes | `roles:read` | `{ success: true, role }` |
| POST | `/api/v1/admin/roles` | `src/modules/admin/admin.routes.ts` | `createRoleAudited` | Yes | `roles:manage` or `roles:write` | `{ success: true, role }` |
| PATCH | `/api/v1/admin/roles/:id` | `src/modules/admin/admin.routes.ts` | `updateRole` | Yes | `roles:manage` or `roles:write` | `{ success: true, role }` |
| DELETE | `/api/v1/admin/roles/:id` | `src/modules/admin/admin.routes.ts` | `deleteRole` | Yes | `roles:manage` or `roles:delete` | `{ success: true, message }` |
| POST | `/api/v1/admin/roles/:id/permissions` | `src/modules/admin/admin.routes.ts` | `addPermissionsToRole` | Yes | `roles:manage` | `{ success: true, role, message }` |
| PATCH | `/api/v1/admin/roles/:id/permissions` | `src/modules/admin/admin.routes.ts` | `replaceRolePermissions` | Yes | `roles:manage` | `{ success: true, role, message }` |
| DELETE | `/api/v1/admin/roles/:id/permissions/:permissionId` | `src/modules/admin/admin.routes.ts` | `removePermissionFromRole` | Yes | `roles:manage` | `{ success: true, role, message }` |
| GET | `/api/v1/admin/permissions` | `src/modules/admin/admin.routes.ts` | `listPermissions` | Yes | `roles:read` or `permissions:read` | `{ success: true, permissions }` |

### Clients / Applications

| Method | Full Path | Route File | Handler | Auth | Permission | Response Shape |
|---|---|---|---|---|---|---|
| GET | `/api/v1/admin/clients` | `src/modules/admin/admin.routes.ts` | `listClients` | Yes | `authGuard + requireAdmin` | `{ success: true, items/total/cursor... }` |
| POST | `/api/v1/admin/clients` | `src/modules/admin/admin.routes.ts` | `createClient` | Yes | `authGuard + requireAdmin` | `{ success: true, client, clientSecret }` |
| GET | `/api/v1/admin/clients/:id` | `src/modules/admin/admin.routes.ts` | `getClientById` | Yes | `authGuard + requireAdmin` | `{ success: true, client }` |
| PATCH | `/api/v1/admin/clients/:id` | `src/modules/admin/admin.routes.ts` | `updateClient` | Yes | `authGuard + requireAdmin` | `{ success: true, client }` |
| POST | `/api/v1/admin/clients/:id/rotate-secret` | `src/modules/admin/admin.routes.ts` | `rotateClientSecret` | Yes | `authGuard + requireAdmin` | `{ success: true, clientSecret, message }` |
| PATCH | `/api/v1/admin/clients/:id/status` | `src/modules/admin/admin.routes.ts` | `updateClientStatus` | Yes | `authGuard + requireAdmin` | `{ success: true, message }` |

### Audit Logs / Security Events / Dashboard

| Method | Full Path | Route File | Handler | Auth | Permission | Response Shape |
|---|---|---|---|---|---|---|
| GET | `/api/v1/admin/audit-logs` | `src/modules/admin/admin.routes.ts` | `listAuditLogs` | Yes | `authGuard + requireAdmin` | `{ success: true, ...paginatedResponse }` |
| GET | `/api/v1/admin/security-events` | `src/modules/admin/admin.routes.ts` | `listSecurityEvents` | Yes | `authGuard + requireAdmin` | `{ success: true, ...paginatedResponse }` |
| GET | `/api/v1/admin/dashboard/stats` | `src/modules/admin/admin.routes.ts` | `getDashboardStats` | Yes | `authGuard + requireAdmin` | `{ success: true, stats }` |

### Social Providers

| Method | Full Path | Route File | Handler | Auth | Permission | Response Shape |
|---|---|---|---|---|---|---|
| GET | `/api/v1/admin/social-providers` | `src/modules/admin/admin.routes.ts` | `listSocialProviders` | Yes | `authGuard + requireAdmin` | `{ success: true, providers }` |
| PATCH | `/api/v1/admin/social-providers/:provider` | `src/modules/admin/admin.routes.ts` | `updateSocialProvider` | Yes | `authGuard + requireAdmin` | `{ success: true, provider }` |

### Sessions

| Method | Full Path | Route File | Handler | Auth | Permission | Response Shape |
|---|---|---|---|---|---|---|
| GET | `/api/v1/admin/sessions` | `src/modules/admin/admin.routes.ts` | `listGlobalSessions` | Yes | `authGuard + requireAdmin` | `{ success: true, ...paginatedResponse }` |
| DELETE | `/api/v1/admin/sessions/:id` | `src/modules/admin/admin.routes.ts` | `revokeSession` | Yes | `authGuard + requireAdmin` | `{ success: true, session }` |

### OAuth Accounts

| Method | Full Path | Route File | Handler | Auth | Permission | Response Shape |
|---|---|---|---|---|---|---|
| GET | `/api/v1/admin/oauth-accounts` | `src/modules/admin/admin.routes.ts` | `listOAuthAccounts` | Yes | `authGuard + requireAdmin` | `{ success: true, ...paginatedResponse }` |
| DELETE | `/api/v1/admin/oauth-accounts/:id` | `src/modules/admin/admin.routes.ts` | `unlinkOAuthAccount` | Yes | `authGuard + requireAdmin` | `{ success: true, message }` |

### Account / Profile

| Method | Full Path | Route File | Handler | Auth | Permission | Response Shape |
|---|---|---|---|---|---|---|
| GET | `/api/v1/admin/account/me` | `src/modules/admin/admin.routes.ts` | `getMyAccount` | Yes | `authGuard + requireAdmin` | `{ success: true, account }` |
| PATCH | `/api/v1/admin/account/me` | `src/modules/admin/admin.routes.ts` | `updateMyAccount` | Yes | `authGuard + requireAdmin` | `{ success: true, account }` |
| POST | `/api/v1/admin/account/avatar` | `src/modules/admin/admin.routes.ts` | `updateMyAvatar` | Yes | `authGuard + requireAdmin` | `{ success: true, data, message }` |
| DELETE | `/api/v1/admin/account/avatar` | `src/modules/admin/admin.routes.ts` | `removeMyAvatar` | Yes | `authGuard + requireAdmin` | `{ success: true, data, message }` |
| POST | `/api/v1/admin/account/change-password` | `src/modules/admin/admin.routes.ts` | `changeMyPassword` | Yes | `authGuard + requireAdmin` | result object |

### Notifications

| Method | Full Path | Route File | Handler | Auth | Permission | Response Shape |
|---|---|---|---|---|---|---|
| GET | `/api/v1/admin/notifications` | `src/modules/admin/admin.routes.ts` | `listMyNotifications` | Yes | `authGuard + requireAdmin` | `{ success: true, data }` |
| GET | `/api/v1/admin/notifications/unread-count` | `src/modules/admin/admin.routes.ts` | `getMyUnreadNotificationCount` | Yes | `authGuard + requireAdmin` | `{ success: true, data }` |
| PATCH | `/api/v1/admin/notifications/read-all` | `src/modules/admin/admin.routes.ts` | `markAllNotificationsRead` | Yes | `authGuard + requireAdmin` | `{ success: true, data, message }` |
| PATCH | `/api/v1/admin/notifications/:notificationId/read` | `src/modules/admin/admin.routes.ts` | `markNotificationRead` | Yes | `authGuard + requireAdmin` | `{ success: true, data }` |
| DELETE | `/api/v1/admin/notifications/:notificationId` | `src/modules/admin/admin.routes.ts` | `dismissNotification` | Yes | `authGuard + requireAdmin` | `{ success: true, data, message }` |

### Email / Communication

Mounted routes:
- `router.use('/admin/communication', communicationRoutes);`
- `router.use('/admin', emailRoutes);`

Verified endpoints:

| Method | Full Path | Route File | Handler | Auth | Permission | Response Shape |
|---|---|---|---|---|---|---|
| GET | `/api/v1/admin/communication/providers` | `src/modules/communication/communication.routes.ts` | `listProviders` | Yes | `communication.providers.read` | `{ success: true, data: { items } }` |
| GET | `/api/v1/admin/communication/providers/:id` | `src/modules/communication/communication.routes.ts` | `formatProviderResponse` | Yes | `communication.providers.read` | `{ success: true, data }` |
| POST | `/api/v1/admin/communication/providers` | `src/modules/communication/communication.routes.ts` | `createOrUpdateProvider` | Yes | `communication.providers.create` | `{ success: true, data, message }` |
| PATCH | `/api/v1/admin/communication/providers/:id` | `src/modules/communication/communication.routes.ts` | `createOrUpdateProvider` | Yes | `communication.providers.update` | `{ success: true, data, message }` |
| DELETE | `/api/v1/admin/communication/providers/:id` | `src/modules/communication/communication.routes.ts` | `softDeleteProvider` | Yes | `communication.providers.delete` | `{ success: true, data, message }` |
| POST | `/api/v1/admin/communication/providers/:id/activate` | `src/modules/communication/communication.routes.ts` | `setProviderStatus` | Yes | `communication.providers.update` | `{ success: true, data, message }` |
| POST | `/api/v1/admin/communication/providers/:id/deactivate` | `src/modules/communication/communication.routes.ts` | `setProviderStatus` | Yes | `communication.providers.update` | `{ success: true, data, message }` |
| POST | `/api/v1/admin/communication/providers/:id/credentials` | `src/modules/communication/communication.routes.ts` | `upsertProviderCredential` | Yes | `communication.credentials.manage` | `{ success: true, data, message }` |
| PATCH | `/api/v1/admin/communication/providers/:id/credentials/:credentialId` | `src/modules/communication/communication.routes.ts` | `upsertProviderCredential` | Yes | `communication.credentials.manage` | `{ success: true, data, message }` |
| POST | `/api/v1/admin/communication/providers/:id/test-sms` | `src/modules/communication/communication.routes.ts` | `testProvider` | Yes | `communication.providers.test` | `{ success: boolean, data, message }` |
| POST | `/api/v1/admin/communication/providers/:id/test-email` | `src/modules/communication/communication.routes.ts` | `testProvider` | Yes | `communication.providers.test` | `{ success: boolean, data, message }` |
| GET | `/api/v1/admin/communication/routing-rules` | `src/modules/communication/communication.routes.ts` | `listRoutingRules` | Yes | `communication.routing.read` | `{ success: true, data: { items } }` |
| POST | `/api/v1/admin/communication/routing-rules` | `src/modules/communication/communication.routes.ts` | `upsertRoutingRule` | Yes | `communication.routing.manage` | `{ success: true, data, message }` |
| PATCH | `/api/v1/admin/communication/routing-rules/:id` | `src/modules/communication/communication.routes.ts` | `upsertRoutingRule` | Yes | `communication.routing.manage` | `{ success: true, data, message }` |
| DELETE | `/api/v1/admin/communication/routing-rules/:id` | `src/modules/communication/communication.routes.ts` | `deleteRoutingRule` | Yes | `communication.routing.manage` | `{ success: true, message }` |
| GET | `/api/v1/admin/communication/templates` | `src/modules/communication/communication.routes.ts` | `listOtpTemplates` | Yes | `communication.templates.read` | `{ success: true, data: { items } }` |
| POST | `/api/v1/admin/communication/templates` | `src/modules/communication/communication.routes.ts` | `upsertOtpTemplate` | Yes | `communication.templates.manage` | `{ success: true, data, message }` |
| PATCH | `/api/v1/admin/communication/templates/:id` | `src/modules/communication/communication.routes.ts` | `upsertOtpTemplate` | Yes | `communication.templates.manage` | `{ success: true, data, message }` |
| DELETE | `/api/v1/admin/communication/templates/:id` | `src/modules/communication/communication.routes.ts` | `deleteOtpTemplate` | Yes | `communication.templates.manage` | `{ success: true, message }` |
| GET | `/api/v1/admin/communication/delivery-logs` | `src/modules/communication/communication.routes.ts` | `getDeliveryLogs` | Yes | `communication.logs.read` | `{ success: true, data: { items } }` |
| GET | `/api/v1/admin/communication/provider-audit-logs` | `src/modules/communication/communication.routes.ts` | `getProviderAuditLogs` | Yes | `communication.logs.read` | `{ success: true, data: { items } }` |
| GET | `/api/v1/admin/communication/provider-health` | `src/modules/communication/communication.routes.ts` | `getProviderHealth` | Yes | `communication.health.read` | `{ success: true, data: { items } }` |

| Method | Full Path | Route File | Handler | Auth | Permission | Response Shape |
|---|---|---|---|---|---|---|
| GET | `/api/v1/admin/email-branding` | `src/modules/email/email.routes.ts` | branding fetch | Yes | `email_branding.read` | `{ success: true, data }` |
| PATCH | `/api/v1/admin/email-branding` | `src/modules/email/email.routes.ts` | branding update | Yes | `email_branding.update` | `{ success: true, data, message }` |
| GET | `/api/v1/admin/email-templates` | `src/modules/email/email.routes.ts` | list templates | Yes | `email_template.read` | `{ success: true, data: { items, total } }` |
| GET | `/api/v1/admin/email-templates/:id` | `src/modules/email/email.routes.ts` | get template | Yes | `email_template.read` | `{ success: true, data }` |
| PATCH | `/api/v1/admin/email-templates/:id` | `src/modules/email/email.routes.ts` | update template | Yes | `email_template.update` | `{ success: true, data, message }` |
| POST | `/api/v1/admin/email-templates/:id/preview` | `src/modules/email/email.routes.ts` | preview template | Yes | `email_template.preview` | `{ success: true, data }` |
| POST | `/api/v1/admin/email-templates/:id/send-test` | `src/modules/email/email.routes.ts` | send test email | Yes | `email_template.send_test` | `{ success: true, message, data }` |
| POST | `/api/v1/admin/email-templates/:id/reset-default` | `src/modules/email/email.routes.ts` | reset default template | Yes | `email_template.reset` | `{ success: true, data, message }` |
| GET | `/api/v1/admin/email-send-logs` | `src/modules/email/email.routes.ts` | list send logs | Yes | `email_logs.read` | `{ success: true, data: { items, total, limit, offset } }` |
| GET | `/api/v1/admin/email-templates/:id/versions` | `src/modules/email/email.routes.ts` | list versions | Yes | `email_template.read` | `{ success: true, data: { items } }` |
| POST | `/api/v1/admin/email-templates/:id/rollback/:versionId` | `src/modules/email/email.routes.ts` | rollback version | Yes | `email_template.rollback` | `{ success: true, data, message }` |
| POST | `/api/v1/admin/email-templates/validate` | `src/modules/email/email.routes.ts` | validate template | Yes | `email_template.create` | `{ success: true, data }` |
| GET | `/api/v1/admin/clients/:clientId/branding` | `src/modules/email/email.routes.ts` | client branding fetch | Yes | `email_branding.read` | `{ success: true, data }` |
| PATCH | `/api/v1/admin/clients/:clientId/branding` | `src/modules/email/email.routes.ts` | client branding update | Yes | `email_branding.update` | `{ success: true, data, message }` |
| POST | `/api/v1/admin/email-send-logs/:id/retry` | `src/modules/email/email.routes.ts` | retry failed email | Yes | `email_logs.manage` | `{ success: true, data, message }` |
| GET | `/api/v1/admin/email-queue` | `src/modules/email/email.routes.ts` | queue stats | Yes | `email_logs.read` | `{ success: true, data }` |
| POST | `/api/v1/admin/email-queue/process` | `src/modules/email/email.routes.ts` | process queue | Yes | `email_logs.manage` | `{ success: true, data, message }` |
| POST | `/api/v1/admin/email-queue/:queueId/retry` | `src/modules/email/email.routes.ts` | retry queue item | Yes | `email_logs.manage` | `{ success: true, message }` |

## Frontend API Calls Found

### `src/context/useAuthContext.tsx`

| Page/Component | Method | Path Used | Expected Shape | Match Status |
|---|---|---|---|---|
| Auth context | GET | `/admin/auth/me` | `{ success: boolean; user: AdminUser }` | MATCHED |
| Auth context | POST | `/admin/auth/login` | `{ success: boolean; ... }` | MATCHED |
| Auth context | POST | `/admin/auth/logout` | `{ success: boolean; ... }` | MATCHED |

### `src/app/(admin)/dashboard/page.tsx`

| Page/Component | Method | Path Used | Expected Shape | Match Status |
|---|---|---|---|---|
| Dashboard | GET | `/admin/dashboard/stats` | `{ success: boolean; stats }` | MATCHED |
| Dashboard | GET | `/admin/audit-logs?limit=5` | `{ success: boolean; logs }` | MATCHED |
| Dashboard | GET | `/admin-users?limit=5` | `{ success: boolean; data: { items } }` | WRONG_PATH |
| Dashboard | GET | `/admin/security-events?limit=5` | `{ success: boolean; events }` | MATCHED |
| Dashboard | GET | `/admin/permissions` | `{ success: boolean; permissions }` | MATCHED |

### `src/features/admin-users/api.ts`

| Page/Component | Method | Path Used | Expected Shape | Match Status |
|---|---|---|---|---|
| Admin users | GET | `/admin-users?...` | `{ success: boolean; data }` | WRONG_PATH |
| Admin users | GET | `/admin-invitations?...` | `{ success: boolean; data }` | WRONG_PATH |
| Admin users | POST | `/admin-invitations` | `{ success: boolean; invitation }` | WRONG_PATH |
| Admin users | POST | `/admin-invitations/:id/resend` | `{ success: boolean }` | WRONG_PATH |
| Admin users | POST | `/admin-invitations/:id/revoke` | `{ success: boolean }` | WRONG_PATH |
| Admin users | PATCH | `/admin/users/:id/status` | `{ success: boolean; user }` | MATCHED |
| Admin users | POST | `/admin/users/:id/reset-password` | `{ success: boolean; temporaryPassword? }` | MATCHED |
| Admin users | POST | `/admin/users/:id/revoke-sessions` | `{ success: boolean }` | MATCHED |
| Admin users | GET | `/admin/roles` | `{ success: boolean; roles }` | MATCHED |
| Admin users | POST | `/admin/users/:id/roles` | `{ success: boolean }` | MATCHED |
| Admin users | DELETE | `/admin/users/:id/roles/:roleId` | `{ success: boolean }` | MATCHED |

### `src/features/roles-permissions/api.ts`

All calls in this file match registered backend endpoints.

### `src/features/applications/api.ts`

All calls in this file match registered backend endpoints.

### `src/features/sessions/api.ts`

| Page/Component | Method | Path Used | Expected Shape | Match Status |
|---|---|---|---|---|
| Sessions | GET | `/admin/sessions?...` | `{ success: boolean; sessions }` | MATCHED |
| Sessions | DELETE | `/admin/sessions/:id` | `{ success: boolean }` | MATCHED |
| Sessions | GET | `/admin/settings` | `{ success: boolean; settings }` | MATCHED |

### `src/features/audit-logs/api.ts`

| Page/Component | Method | Path Used | Expected Shape | Match Status |
|---|---|---|---|---|
| Audit logs | GET | `/admin/audit-logs?...` | `{ success: boolean; logs; total }` | MATCHED |

### `src/features/system/api.ts`

| Page/Component | Method | Path Used | Expected Shape | Match Status |
|---|---|---|---|---|
| API health | GET | `/health` | `HealthStatus` | MATCHED |
| Environment / health settings | GET | `/admin/settings` | `{ success: boolean; settings }` | MATCHED |

### `src/features/service-tokens/api.ts`

| Page/Component | Method | Path Used | Expected Shape | Match Status |
|---|---|---|---|---|
| Service tokens | simulated local storage | none | local mock data | PLACEHOLDER_REQUIRED |

### `src/components/layout/TopNavigationBar/components/Notifications.tsx`

| Page/Component | Method | Path Used | Expected Shape | Match Status |
|---|---|---|---|---|
| Notifications dropdown | GET | `/admin/notifications` | `{ success: boolean; items?: Notification[]; unreadCount?: number }` | PARTIAL_MISMATCH |
| Notifications dropdown | PATCH | `/admin/notifications/read-all` | `{ success: boolean }` | MATCHED |

Observed issue:
- backend returns `{ success: true, data }`
- frontend expects top-level `items` and `unreadCount`
- the path is valid, but the response contract does not match

## Page-by-Page Module Status

### Completed UI Modules

- `/dashboard`
- `/admin-users`
- `/roles-permissions`
- `/applications`
- `/sessions`
- `/audit-logs`
- `/api-health`
- `/environment`

### Partially Completed UI Modules

- `/notifications` dropdown in the top bar
- `/profile` page
- `/email-settings`
- `/sms-otp-settings`

### Pending UI Modules

- `/service-tokens`
- likely portions of `/security-settings`
- any feature using not-yet-verified communication/email backend contracts

## Unsafe Pages

Pages currently unsafe because they call missing or mismatched endpoints directly:

- `src/app/(admin)/dashboard/page.tsx`
  - unsafe call: `GET /admin-users?limit=5`
  - reason: 404 path bug
- `src/features/admin-users/api.ts`
  - unsafe call: `GET /admin-users`
  - reason: 404 path bug
- `src/components/layout/TopNavigationBar/components/Notifications.tsx`
  - unsafe call: `GET /admin/notifications`
  - reason: response shape mismatch causes runtime breakage even though the route exists
- `src/features/service-tokens/api.ts`
  - unsafe by design because it is a mock and can drift from backend reality

## Missing Backend Endpoints

Backend endpoints that the admin UI expects but the current API source does not clearly provide:

- service tokens CRUD endpoints
  - UI has a whole module, but backend route coverage was not found in the audited API registration
- possible communication/email templates endpoints
  - mounted paths exist, but their handler coverage was not fully verified in this audit pass

## Mismatched Endpoints

| UI Call | Backend Reality | Status |
|---|---|---|
| `GET /api/v1/admin-users` | backend is `GET /api/v1/admin/admin-users` | WRONG_PATH |
| `GET /api/v1/admin-invitations` | backend is `GET /api/v1/admin/admin-invitations` | WRONG_PATH |
| `POST /api/v1/admin-invitations` | backend is `POST /api/v1/admin/admin-invitations` | WRONG_PATH |
| `GET /api/v1/admin/audit-logs` | backend exists | MATCHED |
| `GET /api/v1/admin/notifications` | backend exists but returns `data` wrapper, not `items/unreadCount` | PARTIAL_MISMATCH |

## Recommended Fix Priority

1. Fix all admin-users paths in `src/features/admin-users/api.ts` and the dashboard page.
2. Fix the notifications response contract in the top bar component or normalize it in the API client layer.
3. Replace service-tokens mock storage with real backend endpoints or keep it explicitly disabled as simulated.
4. Verify and, if needed, add missing communication/email backend routes or align frontend assumptions.
5. Add an automated route coverage test or contract test to stop path regressions like `/admin-users`.

## Suggested Next Commands

1. Fix `/admin-users` path usage:
   - `src/features/admin-users/api.ts`
   - `src/app/(admin)/dashboard/page.tsx`
2. Normalize notification response handling:
   - `src/components/layout/TopNavigationBar/components/Notifications.tsx`
3. Verify communication/email route handlers:
   - `wpa_auth_api/src/modules/communication/communication.routes.ts`
   - `wpa_auth_api/src/modules/email/email.routes.ts`
4. Add route coverage tests for `/admin/*` API paths.
