import { apiClient } from '@/lib/apiClient'
import { HealthStatus, OperationalSnapshot, ReadinessStatus, SystemSettings } from './types'

export const systemApi = {
  async getHealth(): Promise<HealthStatus> {
    // Call the unversioned health endpoint
    return apiClient.get<HealthStatus>('/health')
  },

  async getReadiness(): Promise<ReadinessStatus> {
    return apiClient.get<ReadinessStatus>('/health/ready')
  },

  async getSettings(): Promise<{ success: boolean; settings: SystemSettings }> {
    return apiClient.get('/admin/settings')
  },

  async getOperationalSnapshot(): Promise<{ success: boolean; data: OperationalSnapshot }> {
    return apiClient.get('/admin/metrics/summary')
  },
}
