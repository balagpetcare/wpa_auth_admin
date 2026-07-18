import { apiClient } from '@/lib/apiClient'
import type { DeletionRequestDetail, DeletionRequestListResponse } from './types'

export const deletionApi = {
  listRequests(params?: {
    status?: string
    requestType?: string
    provider?: string
    requestSource?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<DeletionRequestListResponse> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.append('status', params.status)
    if (params?.requestType) searchParams.append('requestType', params.requestType)
    if (params?.provider) searchParams.append('provider', params.provider)
    if (params?.requestSource) searchParams.append('requestSource', params.requestSource)
    if (params?.search) searchParams.append('search', params.search)
    if (params?.page) searchParams.append('page', String(params.page))
    if (params?.limit) searchParams.append('limit', String(params.limit))
    return apiClient.get(`/admin/deletion-requests?${searchParams.toString()}`)
  },

  getRequest(id: string): Promise<{ success: boolean; data: DeletionRequestDetail }> {
    return apiClient.get(`/admin/deletion-requests/${id}`)
  },

  updateRequest(id: string, action: 'approve' | 'reject' | 'retry' | 'cancel', reason?: string): Promise<{ success: boolean; data: DeletionRequestDetail }> {
    return apiClient.patch(`/admin/deletion-requests/${id}`, { action, reason })
  },
}
