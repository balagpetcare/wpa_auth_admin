import { apiClient } from '@/lib/apiClient'
import { HealthStatus, SystemSettings } from './types'

export const systemApi = {
  async getHealth(): Promise<HealthStatus> {
    // Call the unversioned health endpoint
    return apiClient.get<HealthStatus>('/health')
  },

  async getSettings(): Promise<{ success: boolean; settings: SystemSettings }> {
    return apiClient.get('/admin/settings')
  },
}
