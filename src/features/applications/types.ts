export interface ClientApplication {
  id: string
  name: string
  slug: string
  type: 'SPA' | 'WEB' | 'NATIVE'
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED'
  allowedOrigins: string[]
  redirectUris: string[]
  allowedScopes: string[]
  createdAt: string
  updatedAt: string
}

// Phase 2.6A fix (docs/phase-2-6a-app-aware-communication-routing-ui.md):
// this previously declared { items, total, limit, offset } directly on the
// response, but GET /admin/clients actually responds via the shared
// paginatedResponse() helper as { success, data: ClientApplication[], meta:
// { total, page, limit, totalPages } } — the mismatch meant `response.items`
// was always undefined at runtime (silently broken, including in the
// pre-existing Applications admin page). Fixed to match the real shape;
// `items` is kept as a normalized alias so existing callers (including
// this fix's own new callers) can keep reading `response.items`.
export interface ListClientsResponse {
  success: boolean
  data: ClientApplication[]
  meta?: { total: number; page: number; limit: number; totalPages: number }
  items: ClientApplication[]
}
