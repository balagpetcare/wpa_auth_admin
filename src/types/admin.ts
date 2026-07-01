export type CurrentAdmin = {
  id: string
  username: string | null
  email: string | null
  fullName?: string | null
  displayName?: string | null
  phone?: string | null
  avatarUrl: string | null
  status?: string
  roles?: Array<{ id: string; name: string }> | string[]
  jobTitle?: string | null
  department?: string | null
  organization?: string | null
  bio?: string | null
  notificationPreferences?: {
    securityAlerts: boolean
    adminActivityAlerts: boolean
    loginAlerts: boolean
  }
  interfacePreferences?: {
    language: string
    timezone: string
    dateFormat: string
    compactTableMode: boolean
  }
  createdAt?: string
  updatedAt?: string
  lastLoginAt?: string | null
  lastPasswordChangedAt?: string | null
}

export type AdminNotificationItem = {
  id: string
  title: string
  message: string
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SECURITY'
  category: 'SYSTEM' | 'SECURITY' | 'USER_MANAGEMENT' | 'AUTH' | 'SETTINGS' | 'BILLING' | 'INTEGRATION'
  actionUrl: string | null
  readAt: string | null
  createdAt: string
}
