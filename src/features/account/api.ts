import { apiClient } from '@/lib/apiClient'
import { AccountProfile, AuditLogEntry, ChangePasswordPayload, UpdateAccountPayload } from './types'

export const accountApi = {
  async getMyAccount(): Promise<{ success: boolean; account: AccountProfile }> {
    return apiClient.get('/admin/account/me')
  },

  async updateMyAccount(payload: UpdateAccountPayload): Promise<{ success: boolean; account: AccountProfile }> {
    return apiClient.patch('/admin/account/me', payload)
  },

  async updateMyAvatar(file: File): Promise<{ success: boolean; data: { avatarUrl: string }; message: string }> {
    const formData = new FormData()
    formData.append('avatar', file)
    return apiClient.postForm('/admin/account/avatar', formData)
  },

  async removeMyAvatar(): Promise<{ success: boolean; data: { avatarUrl: null }; message: string }> {
    return apiClient.delete('/admin/account/avatar')
  },

  async changeMyPassword(payload: ChangePasswordPayload): Promise<{ success: boolean }> {
    return apiClient.post('/admin/account/change-password', payload)
  },

  async listMyActivity(userId: string, limit = 8): Promise<{ success: boolean; data: { items: AuditLogEntry[] } }> {
    return apiClient.get(`/admin/audit-logs?userId=${encodeURIComponent(userId)}&limit=${limit}`)
  },
}
