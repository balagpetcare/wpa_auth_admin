# WPA Central Auth Admin Feature Map

This document maps the administrative capabilities of the WPA Central Auth API to the corresponding pages and menu items within the new admin UI.

---

## 1. Authentication & Session Management

| API Endpoint | HTTP Method | Request Payload | Response Shape | Required Permission | Planned UI Page | Menu Location | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/admin/auth/login` | `POST` | `{ emailOrUsername, password, clientId }` | `{ success: true, user, token, refreshToken }` | None (Public) | `/auth/sign-in` | Auth (Sign In) | Existing (Template) |
| `/admin/auth/logout` | `POST` | `{ refreshToken }` | `{ success: true, message }` | `authGuard` + Admin role | Header button action | Top Bar | Existing (Template) |
| `/admin/auth/me` | `GET` | None | `{ success: true, user }` | `authGuard` + Admin role | Shared auth wrapper | Context wrapper | Ready |

---

## 2. Admin Dashboard & System Overview

| API Endpoint | HTTP Method | Request Payload | Response Shape | Required Permission | Planned UI Page | Menu Location | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/admin/dashboard/stats` | `GET` | None | `{ success: true, stats: { ... } }` | `authGuard` + Admin role | `/dashboard` | Dashboard | Ready |
| `/health` | `GET` | None | `{ status: "UP", timestamp, uptime }` | None | `/dashboard` widget | Dashboard | Ready |

---

## 3. Users Management

| API Endpoint | HTTP Method | Request Payload | Response Shape | Required Permission | Planned UI Page | Menu Location | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/admin/users/summary` | `GET` | None | `{ success: true, summary: { total, active, suspended, ... } }` | `authGuard` + Admin role | `/users` overview | Users | Ready |
| `/admin/users` | `GET` | Query params: `q, status, role, cursor, page, limit` | `{ success: true, data: { items, total } }` | `authGuard` + Admin role | `/users` | Users > User List | Ready |
| `/admin/users/:id` | `GET` | None | `{ success: true, user }` | `authGuard` + Admin role | `/users/[id]` | Users > Details | Ready |
| `/admin/users/:id/status` | `PATCH` | `{ status: UserStatus }` | `{ success: true, user }` | `authGuard` + Admin role | `/users/[id]` action | Users > Details | Ready |
| `/admin/users/:id` | `PATCH` | `{ displayName, avatarUrl, username }` | `{ success: true, user }` | `authGuard` + Admin role | `/users/[id]/edit` | Users > Edit | Ready |
| `/admin/users/:id` | `DELETE` | None | `{ success: true, user }` | `authGuard` + Admin role | `/users/[id]` action | Users > Details | Ready |
| `/admin/users/:id/reset-password` | `POST` | None | `{ success: true, message, temporaryPassword? }` | `authGuard` + Admin role | `/users/[id]` action | Users > Details | Ready |
| `/admin/users/:id/revoke-sessions` | `POST` | None | `{ success: true, revokedCount }` | `authGuard` + Admin role | `/users/[id]` action | Users > Details | Ready |
| `/admin/users/:id/sessions` | `GET` | None | `{ success: true, sessions: [...] }` | `authGuard` + Admin role | `/users/[id]` tab | Users > Details | Ready |
| `/admin/users/:id/audit-logs` | `GET` | Query params | `{ success: true, items, total }` | `authGuard` + Admin role | `/users/[id]` tab | Users > Details | Ready |

---

## 4. Roles & Permissions Management

| API Endpoint | HTTP Method | Request Payload | Response Shape | Required Permission | Planned UI Page | Menu Location | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/admin/roles` | `GET` | None | `{ success: true, roles: [...] }` | `roles:read` | `/role/role-list` | Roles > Role List | Ready |
| `/admin/roles/:id` | `GET` | None | `{ success: true, role }` | `roles:read` | `/role/[id]` | Roles > Detail | Ready |
| `/admin/roles` | `POST` | `{ name, description, permissionIds }` | `{ success: true, role }` | `roles:manage` | `/role/role-add` | Roles > Add Role | Ready |
| `/admin/roles/:id` | `PATCH` | `{ name, description, permissionIds }` | `{ success: true, role }` | `roles:manage` | `/role/role-edit` | Roles > Edit Role | Ready |
| `/admin/roles/:id` | `DELETE` | None | `{ success: true, message }` | `roles:manage` | `/role/role-list` action | Roles > Role List | Ready |
| `/admin/roles/:id/permissions` | `POST` | `{ permissionIds, permissionKeys }` | `{ success: true, role }` | `roles:manage` | `/role/[id]` action | Roles > Detail | Ready |
| `/admin/roles/:id/permissions` | `PATCH` | `{ permissionIds, permissionKeys }` | `{ success: true, role }` | `roles:manage` | `/role/[id]` action | Roles > Detail | Ready |
| `/admin/roles/:id/permissions/:permId` | `DELETE` | None | `{ success: true, role }` | `roles:manage` | `/role/[id]` action | Roles > Detail | Ready |
| `/admin/permissions` | `GET` | None | `{ success: true, permissions: [...] }` | `roles:read` \| `permissions:read` | `/permissions` | Roles > Permissions | Ready |
| `/admin/users/:id/roles` | `POST` | `{ roleId }` | `{ success: true }` | `authGuard` + Admin role | `/users/[id]` action | Users > Details | Ready |
| `/admin/users/:id/roles/:roleId` | `DELETE` | None | `{ success: true }` | `authGuard` + Admin role | `/users/[id]` action | Users > Details | Ready |

---

## 5. Clients & Applications (OAuth/OIDC)

| API Endpoint | HTTP Method | Request Payload | Response Shape | Required Permission | Planned UI Page | Menu Location | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/admin/clients` | `GET` | Query params | `{ success: true, items, total }` | `authGuard` + Admin role | `/products/product-list` (re-route) | Applications > Application List | Ready |
| `/admin/clients` | `POST` | `{ name, slug, type, allowedOrigins, redirectUris, allowedScopes }` | `{ success: true, client, clientSecret }` | `authGuard` + Admin role | `/products/product-add` (re-route) | Applications > Add App | Ready |
| `/admin/clients/:id` | `GET` | None | `{ success: true, client }` | `authGuard` + Admin role | `/products/[id]` (re-route) | Applications > Details | Ready |
| `/admin/clients/:id` | `PATCH` | `{ name, allowedOrigins, redirectUris, allowedScopes }` | `{ success: true, client }` | `authGuard` + Admin role | `/products/product-edit` (re-route) | Applications > Edit App | Ready |
| `/admin/clients/:id/status` | `PATCH` | `{ status: AuthClientStatus }` | `{ success: true }` | `authGuard` + Admin role | `/products/[id]` action | Applications > Details | Ready |
| `/admin/clients/:id/rotate-secret` | `POST` | None | `{ success: true, clientSecret }` | `authGuard` + Admin role | `/products/[id]` action | Applications > Details | Ready |
| `/admin/clients/:clientId/branding` | `GET` | None | `{ success: true, data }` | `email_branding.read` | `/products/[id]/branding` | Applications > Details | Ready |
| `/admin/clients/:clientId/branding` | `PATCH` | `{ brandName, primaryColor, logoUrl, ... }` | `{ success: true, data }` | `email_branding.update` | `/products/[id]/branding` | Applications > Details | Ready |

---

## 6. Audit & Security Logs

| API Endpoint | HTTP Method | Request Payload | Response Shape | Required Permission | Planned UI Page | Menu Location | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/admin/audit-logs` | `GET` | Query params | `{ success: true, items, total }` | `authGuard` + Admin role | `/pages/timeline` (re-route) | Logs > Audit Logs | Ready |
| `/admin/security-events` | `GET` | Query params | `{ success: true, items, total }` | `authGuard` + Admin role | `/pages/security` | Logs > Security Events | Ready |

---

## 7. Global Settings & Identity Providers

| API Endpoint | HTTP Method | Request Payload | Response Shape | Required Permission | Planned UI Page | Menu Location | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/admin/settings` | `GET` | None | `{ success: true, settings }` | `authGuard` + Admin role | `/settings` | System Settings | Ready |
| `/admin/social-providers` | `GET` | None | `{ success: true, providers }` | `authGuard` + Admin role | `/settings` (Social tab) | System Settings | Ready |
| `/admin/social-providers/:provider` | `PATCH` | `{ enabled, displayName, displayOrder }` | `{ success: true, provider }` | `authGuard` + Admin role | `/settings` (Social tab) | System Settings | Ready |

---

## 8. Admin Team & Invitation Management

| API Endpoint | HTTP Method | Request Payload | Response Shape | Required Permission | Planned UI Page | Menu Location | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/admin/admin-users` | `GET` | Query params | `{ success: true, data: { items } }` | `authGuard` + Admin role | `/seller/seller-list` (re-route) | Team > Admin Team | Ready |
| `/admin-users/assign-existing` | `POST` | `{ userId, roleIds }` | `{ success: true, message }` | `authGuard` + Admin role | `/seller/seller-add` (re-route) | Team > Promote User | Ready |
| `/admin-invitations` | `POST` | `{ email, roleIds, message }` | `{ success: true, invitation }` | `authGuard` + Admin role | `/seller/seller-add` (re-route) | Team > Invite Admin | Ready |
| `/admin-invitations` | `GET` | Query params | `{ success: true, data: { items } }` | `authGuard` + Admin role | `/seller/seller-list` (re-route) | Team > Invitations | Ready |
| `/admin-invitations/:id/resend` | `POST` | None | `{ success: true }` | `authGuard` + Admin role | `/seller/seller-list` action | Team > Invitations | Ready |
| `/admin-invitations/:id/revoke` | `POST` | None | `{ success: true }` | `authGuard` + Admin role | `/seller/seller-list` action | Team > Invitations | Ready |

---

## 9. Global Session & Account Links

| API Endpoint | HTTP Method | Request Payload | Response Shape | Required Permission | Planned UI Page | Menu Location | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/admin/sessions` | `GET` | Query params | `{ success: true, items, total }` | `authGuard` + Admin role | `/pages/sessions` | Sessions > All Sessions | Ready |
| `/admin/sessions/:id` | `DELETE` | None | `{ success: true }` | `authGuard` + Admin role | `/pages/sessions` action | Sessions > All Sessions | Ready |
| `/admin/oauth-accounts` | `GET` | Query params | `{ success: true, items, total }` | `authGuard` + Admin role | `/pages/oauth-accounts` | Sessions > OAuth Linkings | Ready |
| `/admin/oauth-accounts/:id` | `DELETE` | None | `{ success: true }` | `authGuard` + Admin role | `/pages/oauth-accounts` action | Sessions > OAuth Linkings | Ready |

---

## 10. Communication (SMS/OTP Gateway & Routing)

| API Endpoint | HTTP Method | Request Payload | Response Shape | Required Permission | Planned UI Page | Menu Location | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/admin/communication/providers` | `GET` | Query params | `{ success: true, data: { items } }` | `communication.providers.read` | `/coupons/coupons-list` (re-route) | Comm > Providers | Ready |
| `/admin/communication/providers/:id` | `GET` | None | `{ success: true, data }` | `communication.providers.read` | `/coupons/[id]` | Comm > Provider Details | Ready |
| `/admin/communication/providers` | `POST` | Provider schema | `{ success: true, data }` | `communication.providers.create` | `/coupons/coupons-add` | Comm > Create Provider | Ready |
| `/admin/communication/providers/:id` | `PATCH` | Partial provider | `{ success: true, data }` | `communication.providers.update` | `/coupons/edit/[id]` | Comm > Edit Provider | Ready |
| `/admin/communication/providers/:id` | `DELETE` | None | `{ success: true }` | `communication.providers.delete` | `/coupons/coupons-list` action | Comm > Providers | Ready |
| `/admin/communication/providers/:id/activate` | `POST` | None | `{ success: true }` | `communication.providers.update` | `/coupons/[id]` action | Comm > Provider Details | Ready |
| `/admin/communication/providers/:id/deactivate` | `POST` | None | `{ success: true }` | `communication.providers.update` | `/coupons/[id]` action | Comm > Provider Details | Ready |
| `/admin/communication/providers/:id/credentials` | `POST` | `{ secrets, apiBaseUrl, ... }` | `{ success: true, data }` | `communication.credentials.manage` | `/coupons/[id]` edit tab | Comm > Provider Details | Ready |
| `/admin/communication/providers/:id/test-sms` | `POST` | `{ to, message }` | `{ success: true \| false }` | `communication.providers.test` | `/coupons/[id]` test modal | Comm > Provider Details | Ready |
| `/admin/communication/providers/:id/test-email` | `POST` | `{ to, subject, message }` | `{ success: true \| false }` | `communication.providers.test` | `/coupons/[id]` test modal | Comm > Provider Details | Ready |
| `/admin/communication/routing-rules` | `GET` | None | `{ success: true, data: { items } }` | `communication.routing.read` | `/pages/routing-rules` | Comm > Routing Rules | Ready |
| `/admin/communication/routing-rules` | `POST` | Routing rule schema | `{ success: true, data }` | `communication.routing.manage` | `/pages/routing-rules` action | Comm > Routing Rules | Ready |
| `/admin/communication/templates` | `GET` | None | `{ success: true, data: { items } }` | `communication.templates.read` | `/pages/otp-templates` | Comm > OTP Templates | Ready |
| `/admin/communication/templates` | `POST` | Template schema | `{ success: true, data }` | `communication.templates.manage` | `/pages/otp-templates` action | Comm > OTP Templates | Ready |
| `/admin/communication/delivery-logs` | `GET` | Query params | `{ success: true, data: { items } }` | `communication.logs.read` | `/pages/comm-logs` | Comm > Delivery Logs | Ready |
| `/admin/communication/provider-health` | `GET` | None | `{ success: true, data: { items } }` | `communication.health.read` | `/pages/comm-health` | Comm > Channel Health | Ready |

---

## 11. Email System & Custom Templating

| API Endpoint | HTTP Method | Request Payload | Response Shape | Required Permission | Planned UI Page | Menu Location | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/admin/email-branding` | `GET` | None | `{ success: true, data }` | `email_branding.read` | `/category/category-list` (re-route) | Email > System Branding | Ready |
| `/admin/email-branding` | `PATCH` | Branding schema | `{ success: true, data }` | `email_branding.update` | `/category/category-list` action | Email > System Branding | Ready |
| `/admin/email-templates` | `GET` | None | `{ success: true, data: { items } }` | `email_template.read` | `/category/category-edit` (re-route) | Email > Email Templates | Ready |
| `/admin/email-templates/:id` | `GET` | None | `{ success: true, data }` | `email_template.read` | `/category/category-edit/:id` | Email > Edit Template | Ready |
| `/admin/email-templates/:id` | `PATCH` | Template update schema | `{ success: true, data }` | `email_template.update` | `/category/category-edit/:id` save | Email > Edit Template | Ready |
| `/admin/email-templates/:id/preview` | `POST` | `{ variables }` | `{ success: true, data: { rendered } }` | `email_template.preview` | `/category/category-edit/:id` preview | Email > Edit Template | Ready |
| `/admin/email-templates/:id/send-test` | `POST` | `{ testEmail, variables }` | `{ success: true, message }` | `email_template.send_test` | `/category/category-edit/:id` test | Email > Edit Template | Ready |
| `/admin/email-templates/:id/reset-default` | `POST` | None | `{ success: true, data }` | `email_template.reset` | `/category/category-edit/:id` reset | Email > Edit Template | Ready |
| `/admin/email-templates/:id/versions` | `GET` | None | `{ success: true, data: { items } }` | `email_template.read` | `/category/category-edit/:id` history | Email > Edit Template | Ready |
| `/admin/email-templates/:id/rollback/:verId`| `POST` | None | `{ success: true, data }` | `email_template.rollback` | `/category/category-edit/:id` rollback | Email > Edit Template | Ready |
| `/admin/email-send-logs` | `GET` | Query params | `{ success: true, data: { items, total } }` | `email_logs.read` | `/pages/email-logs` | Email > Delivery Logs | Ready |
| `/admin/email-send-logs/:id/retry` | `POST` | None | `{ success: true }` | `email_logs.manage` | `/pages/email-logs` action | Email > Delivery Logs | Ready |

---

## 12. Planned / Missing Backend Endpoints

These features are part of the target administrator experience, but currently lack corresponding routes/controllers in the `wpa_auth_api` backend:

1. **API Keys / Service Access Tokens Management**
   - *Database Support:* Schema contains `ApiKey` and `ServiceAccessToken` models.
   - *Status:* Missing admin controller and routes in `admin.routes.ts`.
   - *UI Impact:* Marked as **Planned** in the UI layout; options will show placeholder status or execute mocked local responses until backend endpoints are available.

2. **Security & Session Limits Configuration**
   - *Status:* Settings endpoint `/settings` returns configuration values, but `/settings` has no matching `PATCH`/`PUT` endpoint to update database settings from the Admin UI.
   - *UI Impact:* System Settings page will allow editing settings, but saves will be simulated or marked as read-only.
