import { apiClient } from '@/lib/apiClient'
import { EndUserDetail, ListEndUsersResponse } from './types'

export const endUsersApi = {
  async listEndUsers(params: {
    q?: string
    status?: string
    emailVerified?: 'true' | 'false' | 'all'
    phoneVerified?: 'true' | 'false' | 'all'
    limit?: number
    cursor?: string
    page?: number
  }): Promise<ListEndUsersResponse> {
    const searchParams = new URLSearchParams()
    if (params.q) searchParams.append('q', params.q)
    if (params.status) searchParams.append('status', params.status)
    if (params.emailVerified) searchParams.append('emailVerified', params.emailVerified)
    if (params.phoneVerified) searchParams.append('phoneVerified', params.phoneVerified)
    if (params.limit) searchParams.append('limit', String(params.limit))
    if (params.cursor) searchParams.append('cursor', params.cursor)
    if (params.page) searchParams.append('page', String(params.page))

    return apiClient.get<ListEndUsersResponse>(`/admin/end-users?${searchParams.toString()}`)
  },

  async getEndUser(userId: string): Promise<{ success: boolean; user: EndUserDetail }> {
    return apiClient.get(`/admin/end-users/${userId}`)
  },

  async updateStatus(userId: string, status: string): Promise<{ success: boolean; user: EndUserDetail }> {
    return apiClient.patch(`/admin/end-users/${userId}/status`, { status })
  },

  async getSessions(userId: string): Promise<{ success: boolean; sessions: any[] }> {
    return apiClient.get(`/admin/end-users/${userId}/sessions`)
  },

  // GET .../audit-logs uses lib/pagination.ts's paginatedResponse(), which
  // returns `{ data: T[], meta: {...} }` (data is the array directly).
  async getAuditLogs(userId: string): Promise<{ success: boolean; data: any[]; meta?: { total: number; page: number; limit: number; totalPages: number } }> {
    return apiClient.get(`/admin/end-users/${userId}/audit-logs`)
  },
}
