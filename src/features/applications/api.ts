import { apiClient } from '@/lib/apiClient'
import { ClientApplication, ListClientsResponse } from './types'

export const applicationsApi = {
  async listClients(params: {
    search?: string
    status?: string
    limit?: number
    page?: number
  }): Promise<ListClientsResponse> {
    const searchParams = new URLSearchParams()
    if (params.search) searchParams.append('search', params.search)
    if (params.status) searchParams.append('status', params.status)
    if (params.limit) searchParams.append('limit', String(params.limit))
    if (params.page) searchParams.append('page', String(params.page))

    // Phase 2.6A fix: normalize the real { data, meta } response shape into
    // `.items` — see the note on ListClientsResponse in ./types.ts.
    const response = await apiClient.get<{ success: boolean; data: ClientApplication[]; meta?: any }>(
      `/admin/clients?${searchParams.toString()}`,
    )
    const items = response.data || []
    return { success: response.success, data: items, meta: response.meta, items }
  },

  async getClient(clientId: string): Promise<{ success: boolean; client: ClientApplication }> {
    return apiClient.get(`/admin/clients/${clientId}`)
  },

  async createClient(data: {
    name: string
    slug: string
    type: 'SPA' | 'WEB' | 'NATIVE'
    allowedOrigins?: string[]
    redirectUris?: string[]
    allowedScopes?: string[]
  }): Promise<{ success: boolean; client: ClientApplication; clientSecret?: string }> {
    return apiClient.post('/admin/clients', data)
  },

  async updateClient(
    clientId: string,
    data: {
      name?: string
      allowedOrigins?: string[]
      redirectUris?: string[]
      allowedScopes?: string[]
    }
  ): Promise<{ success: boolean; client: ClientApplication }> {
    return apiClient.patch(`/admin/clients/${clientId}`, data)
  },

  async updateClientStatus(clientId: string, status: string): Promise<{ success: boolean }> {
    return apiClient.patch(`/admin/clients/${clientId}/status`, { status })
  },

  async rotateSecret(clientId: string): Promise<{ success: boolean; clientSecret: string; message: string }> {
    return apiClient.post(`/admin/clients/${clientId}/rotate-secret`)
  },
}
