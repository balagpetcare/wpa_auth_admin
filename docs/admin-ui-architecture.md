# Admin UI Architecture & Security Profile

This document details the architectural guidelines, layout wrappers, and security controls built into the WPA Central Auth Admin UI.

---

## 1. Directory Structure

```
wpa_auth_admin/
├── src/
│   ├── app/                    # NextJS App Router Layouts
│   │   ├── (admin)/            # Protected Administration pages
│   │   └── (other)/            # Public pages (Auth sign-in, locks)
│   ├── components/             # Reusable layout components
│   ├── context/                # Authentication & context states
│   ├── features/               # Modularized domain logic
│   │   ├── admin-users/        # Operations directory API & types
│   │   ├── applications/       # Client applications API & types
│   │   ├── audit-logs/         # Audit activity tracking
│   │   ├── communication/      # Email & SMS gateways
│   │   ├── roles-permissions/  # RBAC mappings
│   │   └── service-tokens/     # API-required M2M integrations
│   └── lib/                    # HTTP Fetch wrappers
```

---

## 2. Authentication & Authorization Flow

- **Session Handlers:** Token storage is managed inside browser variables (`localStorage` or cookies depending on config).
- **Redirection Logic:**
  - `AuthProtectionWrapper` checks for access token variables. Unauthenticated users are redirected instantly to `/auth/sign-in`.
  - Redirect loops are blocked by utilizing `router.replace` instead of `router.push`.
- **Role-Based Guards:** Dynamic menu checking hides segments in `AppMenu.tsx` if the active operator's JWT profile lacks required permission scopes.

---

## 3. Cryptographic Security Mappings

- **Client Secrets Reveal:** Secrets generated during client application configuration or rotation are shown exactly once in the UI. No plaintext secrets are saved inside localStorage.
- **Service Tokens M2M:** Warnings are explicitly triggered inside the console if the operator attempts to generate a service token with a *Never Expire* lifetime.
