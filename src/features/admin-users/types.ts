export interface Role {
  id: string
  name: string
  description?: string
}

export interface AdminUser {
  id: string
  username: string
  email: string
  displayName?: string
  phone?: string
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED' | 'PENDING_VERIFICATION'
  createdAt: string
  lastLoginAt?: string
  lastPasswordChangedAt?: string
  roles: Role[]
  isLastSuperAdmin?: boolean
}

export interface AdminInvitation {
  id: string
  email: string
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'
  createdAt: string
  expiresAt: string
  acceptedAt?: string | null
  revokedAt?: string | null
  // Matches the real GET /admin/admin-invitations response shape
  // (adminService.listAdminInvitations): roles are plain Role objects, not
  // wrapped in `{ role }`.
  roles: Role[]
  invitedBy?: { id: string; username: string; email: string; displayName?: string | null }
}

export interface ListAdminUsersResponse {
  success: boolean
  data?: {
    items?: AdminUser[]
    users?: AdminUser[]
    data?: AdminUser[]
    pagination?: {
      nextCursor?: string | null
      cursor?: string | null
    }
    nextCursor?: string | null
  }
  items?: AdminUser[]
  users?: AdminUser[]
  dataItems?: AdminUser[]
}

export interface ListInvitationsResponse {
  success: boolean
  data?: {
    items?: AdminInvitation[]
    invitations?: AdminInvitation[]
    data?: AdminInvitation[]
    pagination?: {
      nextCursor?: string | null
      cursor?: string | null
    }
    nextCursor?: string | null
  }
  items?: AdminInvitation[]
  invitations?: AdminInvitation[]
}
