import { apiClient } from '@/lib/apiClient'
import { ListAuditLogsResponse } from './types'

export const auditLogsApi = {
  async listAuditLogs(params: {
    userId?: string
    action?: string
    limit?: number
    cursor?: string
  }): Promise<ListAuditLogsResponse> {
    const searchParams = new URLSearchParams()
    if (params.userId) searchParams.append('userId', params.userId)
    if (params.action) searchParams.append('action', params.action)
    if (params.limit) searchParams.append('limit', String(params.limit))
    if (params.cursor) searchParams.append('cursor', params.cursor)

    return apiClient.get<ListAuditLogsResponse>(`/admin/audit-logs?${searchParams.toString()}`)
  },
}
