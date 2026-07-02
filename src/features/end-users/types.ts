// Phase 2 module (docs/phase-2-core-identity-admin-modules.md).
// Matches the response shape of adminService.listUsers() / getUserById()
// (GET /admin/end-users, GET /admin/end-users/:id) — safeUserSelect fields
// only, no password hash or other sensitive internals.

export interface EndUserRole {
  id: string
  name: string
}

export interface EndUser {
  id: string
  email: string
  phone?: string | null
  username?: string | null
  displayName?: string | null
  avatarUrl?: string | null
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED' | 'PENDING_VERIFICATION'
  emailVerifiedAt?: string | null
  phoneVerifiedAt?: string | null
  createdAt: string
  updatedAt: string
  lastLoginAt?: string | null
  lastSeenAt?: string | null
  lastPasswordChangedAt?: string | null
  roles: EndUserRole[]
  oauthProviders?: string[]
  isLastSuperAdmin?: boolean
}

export interface EndUserPresenceApp {
  clientId: string
  name: string
  slug: string
}

export interface EndUserPresence {
  onlineNow: boolean
  appsOnline: EndUserPresenceApp[]
  lastSeenAt?: string | null
  lastLoginAt?: string | null
  activeSessions: {
    total: number
    active: number
    activeSessions: Array<{
      id: string
      clientId: string
      createdAt: string
      lastActiveAt: string
      expiresAt: string
    }>
  }
}

export interface EndUserDetail extends EndUser {
  recentSessions?: Array<{ id: string; ipAddress?: string | null; userAgent?: string | null; createdAt: string; revokedAt?: string | null }>
  recentAuditLogs?: Array<{ id: string; action: string; createdAt: string }>
  recentSecurityEvents?: Array<{ id: string; type: string; severity: string; createdAt: string }>
}

export interface ListEndUsersResponse {
  success: boolean
  data?: {
    items?: EndUser[]
    pagination?: {
      limit?: number
      nextCursor?: string | null
      hasNextPage?: boolean
      totalExact?: number
    }
  }
}
