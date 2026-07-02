# Local Development Guide

Follow these guidelines to configure, run, and modify the WPA Central Auth Admin UI.

---

## 1. Mapped Ports & Core Environment

The application defaults to:
- Port: `5012`
- API target: `http://localhost:5010/api/v1`

Configure `.env.local` inside the project root:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5010/api/v1
NEXT_PUBLIC_APP_NAME=WPA Central Auth Admin
NEXT_PUBLIC_APP_SHORT_NAME=WPA Auth
```

---

## 2. Running the Build pipeline

```bash
# Start Nextjs in development server mode on port 5012
npm run dev

# Format code files using Prettier
npm run format

# Clean Next compiler build cache and bundle production build
Remove-Item -Recurse -Force .next
npm run build
```

---

## 3. Creating New Modules / Features

When introducing a new domain:
1. Declare types inside `src/features/<module-name>/types.ts`.
2. Add API helpers in `src/features/<module-name>/api.ts`.
3. Wrap page components at `src/app/(admin)/<route-name>/page.tsx`.
4. Ensure components utilize central loading skeletons, empty states, and permission checks.
