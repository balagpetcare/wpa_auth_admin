import { apiClient } from '@/lib/apiClient'
import { ListSessionsResponse } from './types'

export const sessionsApi = {
  async listSessions(params: {
    search?: string
    status?: string
    userId?: string
    limit?: number
    cursor?: string
  }): Promise<ListSessionsResponse> {
    const searchParams = new URLSearchParams()
    if (params.search) searchParams.append('search', params.search)
    if (params.status) searchParams.append('status', params.status)
    if (params.userId) searchParams.append('userId', params.userId)
    if (params.limit) searchParams.append('limit', String(params.limit))
    if (params.cursor) searchParams.append('cursor', params.cursor)

    return apiClient.get<ListSessionsResponse>(`/admin/sessions?${searchParams.toString()}`)
  },

  async revokeSession(sessionId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/admin/sessions/${sessionId}`)
  },

  async getSecuritySettings(): Promise<{ success: boolean; settings: any }> {
    return apiClient.get('/admin/settings')
  },
}
