# API Endpoint Coverage

Date: 2026-07-02

## Implemented Admin Surface

- `/api/v1/admin/users`
- `/api/v1/admin/users/:id`
- `/api/v1/admin/users/invite`
- `/api/v1/admin/users/:id/status`
- `/api/v1/admin/users/:id/roles`
- `/api/v1/admin/roles`
- `/api/v1/admin/permissions`
- `/api/v1/admin/roles/:id`
- `/api/v1/admin/roles/:id/permissions`

## Notification Contract

- Topbar notifications now normalize nested payloads from:
  - `/api/v1/admin/notifications`
  - `/api/v1/admin/notifications/unread-count`

## Still Simulated

- Service tokens module remains API-required placeholder-driven in the UI because no backend endpoint is implemented.

## Notes

- Permissions and auth guards are enforced by the API routes.
- Sensitive fields are excluded from the user responses.
