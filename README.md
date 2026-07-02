# WPA Central Auth Admin Console

WPA Central Auth Admin Console is an enterprise-grade administration dashboard built for managing applications, client registries, user sessions, system policies, and administrative operations in the WPA Central Auth ecosystem.

---

## 1. Local Development Quickstart

### Prerequisites
- Node.js (v18+)
- Running instance of WPA Central Auth REST API

### Configuration
Create/verify `.env.local` in the root folder:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5010/api/v1
NEXT_PUBLIC_APP_NAME=WPA Central Auth Admin
NEXT_PUBLIC_APP_SHORT_NAME=WPA Auth
```

### Installation & Run
```bash
# Install dependencies
npm install

# Start development server on port 5012
npm run dev
```

---

## 2. Documentations Directory

- [Architecture & Design System](file:///D:/wpa/wpa_auth/wpa_auth_admin/docs/admin-ui-architecture.md)
- [Local Development Guide](file:///D:/wpa/wpa_auth/wpa_auth_admin/docs/local-development.md)
- [API Endpoint Coverage](file:///D:/wpa/wpa_auth/wpa_auth_admin/docs/api-endpoint-coverage.md)
- [Missing Backend Endpoints](file:///D:/wpa/wpa_auth/wpa_auth_admin/docs/missing-admin-api-endpoints.md)
- [Verification Report](file:///D:/wpa/wpa_auth/wpa_auth_admin/docs/verification-report.md)
