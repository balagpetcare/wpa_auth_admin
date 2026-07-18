import { apiClient } from '@/lib/apiClient'
import { SocialProvider, SocialProviderGroupResponse } from './types'

export type SocialProviderPayload = Partial<Pick<SocialProvider,
  'displayName' | 'clientId' | 'authorizationUrl' | 'tokenUrl' | 'userInfoUrl' | 'redirectUri' | 'status' | 'environment' | 'placement' | 'sortOrder' | 'showOnLogin' | 'providerMetadata'
>> & {
  scopes?: string[]
  clientSecret?: string
  provider?: SocialProvider['provider']
}

export const socialProvidersApi = {
  listProviders(): Promise<SocialProviderGroupResponse> {
    return apiClient.get('/auth/social/providers')
  },
  listAdminProviders(): Promise<{ success: boolean; providers: SocialProvider[] }> {
    return apiClient.get('/admin/social-providers')
  },
  getAdminProvider(id: string): Promise<{ success: boolean; provider: SocialProvider }> {
    return apiClient.get(`/admin/social-providers/${id}`)
  },
  createProvider(data: SocialProviderPayload): Promise<{ success: boolean; provider: SocialProvider }> {
    return apiClient.post('/admin/social-providers', data)
  },
  updateProvider(id: string, data: SocialProviderPayload): Promise<{ success: boolean; provider: SocialProvider }> {
    return apiClient.patch(`/admin/social-providers/${id}`, data)
  },
  updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<{ success: boolean; provider: SocialProvider }> {
    return apiClient.patch(`/admin/social-providers/${id}/status`, { status })
  },
  testProvider(id: string): Promise<{ success: boolean; data: { configured: boolean; status: string; provider: string; readiness?: unknown; lastSuccessfulTestAt?: string | null } }> {
    return apiClient.post(`/admin/social-providers/${id}/test`)
  },
  deleteProvider(id: string): Promise<{ success: boolean; provider: SocialProvider }> {
    return apiClient.delete(`/admin/social-providers/${id}`)
  },
}
