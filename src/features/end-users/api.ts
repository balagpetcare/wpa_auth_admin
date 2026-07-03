import { apiClient } from '@/lib/apiClient'
import { EndUserDetail, EndUserPresence, ListEndUsersResponse } from './types'

export const endUsersApi = {
  async listEndUsers(params: {
    q?: string
    status?: string
    country?: string
    state?: string
    city?: string
    timezone?: string
    registrationSource?: string
    emailVerified?: 'true' | 'false' | 'all'
    phoneVerified?: 'true' | 'false' | 'all'
    hasEmail?: 'true' | 'false' | 'all'
    hasPhone?: 'true' | 'false' | 'all'
    loginActivity?: 'never' | 'today' | '7d' | '30d' | '90d' | '180d' | 'all'
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    createdFrom?: string
    createdTo?: string
    updatedFrom?: string
    updatedTo?: string
    lastLoginFrom?: string
    lastLoginTo?: string
    lastPasswordChangedFrom?: string
    lastPasswordChangedTo?: string
    externalRefId?: string
    email?: string
    phone?: string
    username?: string
    userId?: string
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<ListEndUsersResponse> {
    const searchParams = new URLSearchParams()
    if (params.q) searchParams.append('q', params.q)
    if (params.status) searchParams.append('status', params.status)
    if (params.country) searchParams.append('country', params.country)
    if (params.state) searchParams.append('state', params.state)
    if (params.city) searchParams.append('city', params.city)
    if (params.timezone) searchParams.append('timezone', params.timezone)
    if (params.registrationSource) searchParams.append('registrationSource', params.registrationSource)
    if (params.emailVerified) searchParams.append('emailVerified', params.emailVerified)
    if (params.phoneVerified) searchParams.append('phoneVerified', params.phoneVerified)
    if (params.hasEmail) searchParams.append('hasEmail', params.hasEmail)
    if (params.hasPhone) searchParams.append('hasPhone', params.hasPhone)
    if (params.loginActivity) searchParams.append('loginActivity', params.loginActivity)
    if (params.riskLevel) searchParams.append('riskLevel', params.riskLevel)
    if (params.createdFrom) searchParams.append('createdFrom', params.createdFrom)
    if (params.createdTo) searchParams.append('createdTo', params.createdTo)
    if (params.updatedFrom) searchParams.append('updatedFrom', params.updatedFrom)
    if (params.updatedTo) searchParams.append('updatedTo', params.updatedTo)
    if (params.lastLoginFrom) searchParams.append('lastLoginFrom', params.lastLoginFrom)
    if (params.lastLoginTo) searchParams.append('lastLoginTo', params.lastLoginTo)
    if (params.lastPasswordChangedFrom) searchParams.append('lastPasswordChangedFrom', params.lastPasswordChangedFrom)
    if (params.lastPasswordChangedTo) searchParams.append('lastPasswordChangedTo', params.lastPasswordChangedTo)
    if (params.externalRefId) searchParams.append('externalRefId', params.externalRefId)
    if (params.email) searchParams.append('email', params.email)
    if (params.phone) searchParams.append('phone', params.phone)
    if (params.username) searchParams.append('username', params.username)
    if (params.userId) searchParams.append('userId', params.userId)
    if (params.page) searchParams.append('page', String(params.page))
    if (params.pageSize) searchParams.append('limit', String(params.pageSize))
    if (params.sortBy) searchParams.append('sortBy', params.sortBy)
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder)

    return apiClient.get<ListEndUsersResponse>(`/admin/end-users?${searchParams.toString()}`)
  },

  async getEndUser(userId: string): Promise<{ success: boolean; user: EndUserDetail }> {
    return apiClient.get(`/admin/end-users/${userId}`)
  },

  async getPresence(userId: string): Promise<{ success: boolean; presence: EndUserPresence }> {
    return apiClient.get(`/admin/end-users/${userId}/presence`)
  },

  async updateStatus(userId: string, status: string): Promise<{ success: boolean; user: EndUserDetail }> {
    return apiClient.patch(`/admin/end-users/${userId}/status`, { status })
  },

  async getSessions(userId: string, params?: { cursor?: string; limit?: number }): Promise<{ success: boolean; data?: { items?: any[]; nextCursor?: string | null; hasNextPage?: boolean; limit?: number } }> {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.append('limit', String(params.limit))
    if (params?.cursor) searchParams.append('cursor', params.cursor)
    return apiClient.get(`/admin/end-users/${userId}/sessions?${searchParams.toString()}`)
  },

  // GET .../audit-logs uses lib/pagination.ts's paginatedResponse(), which
  // returns `{ data: T[], meta: {...} }` (data is the array directly).
  async getAuditLogs(userId: string, params?: { cursor?: string; limit?: number }): Promise<{ success: boolean; data?: { items?: any[]; nextCursor?: string | null; hasNextPage?: boolean; limit?: number } }> {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.append('limit', String(params.limit))
    if (params?.cursor) searchParams.append('cursor', params.cursor)
    return apiClient.get(`/admin/end-users/${userId}/audit-logs?${searchParams.toString()}`)
  },
}
