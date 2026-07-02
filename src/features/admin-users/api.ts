import { apiClient } from '@/lib/apiClient'
import {
  AdminUser,
  ListAdminUsersResponse,
  ListInvitationsResponse,
  Role
} from './types'

export const adminUsersApi = {
  async listAdminUsers(params: {
    q?: string
    role?: string
    status?: string
    page?: number
    limit?: number
    cursor?: string
  }): Promise<ListAdminUsersResponse> {
    const searchParams = new URLSearchParams()
    if (params.q) searchParams.append('q', params.q)
    if (params.role) searchParams.append('role', params.role)
    if (params.status) searchParams.append('status', params.status)
    if (params.page) searchParams.append('page', String(params.page))
    if (params.limit) searchParams.append('limit', String(params.limit))
    if (params.cursor) searchParams.append('cursor', params.cursor)

    return apiClient.get<ListAdminUsersResponse>(`/admin/users?${searchParams.toString()}`)
  },

  async inviteAdmin(data: {
    email: string
    roleIds: string[]
    message?: string
  }): Promise<{ success: boolean; invitation: any }> {
    return apiClient.post('/admin/users/invite', data)
  },

  async updateUserStatus(userId: string, status: string): Promise<{ success: boolean; user: AdminUser }> {
    return apiClient.patch(`/admin/users/${userId}/status`, { status })
  },

  async resetPassword(userId: string): Promise<{ success: boolean; temporaryPassword?: string }> {
    return apiClient.post(`/admin/users/${userId}/reset-password`)
  },

  async revokeUserSessions(userId: string): Promise<{ success: boolean }> {
    return apiClient.post(`/admin/users/${userId}/revoke-sessions`)
  },

  async listRoles(): Promise<{ success: boolean; roles: Role[] }> {
    return apiClient.get('/admin/roles')
  },

  async assignRoleToUser(userId: string, roleId: string): Promise<{ success: boolean }> {
    return apiClient.patch(`/admin/users/${userId}/roles`, { roleIds: [roleId] })
  },

  async removeRoleFromUser(userId: string, roleId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/admin/users/${userId}/roles/${roleId}`)
  },

  // Phase 2 (docs/phase-2-core-identity-admin-modules.md): the backend
  // already exposed GET/resend/revoke for admin-invitations as of the
  // Phase 1 permission fixes — only the frontend calls were missing.
  async listInvitations(params: { status?: string; q?: string; limit?: number; cursor?: string } = {}): Promise<ListInvitationsResponse> {
    const searchParams = new URLSearchParams()
    if (params.status) searchParams.append('status', params.status)
    if (params.q) searchParams.append('q', params.q)
    if (params.limit) searchParams.append('limit', String(params.limit))
    if (params.cursor) searchParams.append('cursor', params.cursor)
    return apiClient.get<ListInvitationsResponse>(`/admin/admin-invitations?${searchParams.toString()}`)
  },

  async resendInvitation(invitationId: string): Promise<{ success: boolean; inviteUrl?: string; message?: string }> {
    return apiClient.post(`/admin/admin-invitations/${invitationId}/resend`)
  },

  async revokeInvitation(invitationId: string): Promise<{ success: boolean; message?: string }> {
    return apiClient.post(`/admin/admin-invitations/${invitationId}/revoke`)
  },
}
