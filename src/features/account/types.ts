export interface AccountRole {
  id: string
  name: string
}

export interface NotificationPreferences {
  securityAlerts: boolean
  adminActivityAlerts: boolean
  loginAlerts: boolean
}

export interface InterfacePreferences {
  language: string
  timezone: string
  dateFormat: string
  compactTableMode: boolean
}

export interface AccountProfile {
  id: string
  username: string
  email: string
  fullName?: string | null
  phone?: string | null
  jobTitle?: string | null
  department?: string | null
  organization?: string | null
  bio?: string | null
  avatarUrl?: string | null
  status: string
  createdAt: string
  updatedAt: string
  lastLoginAt?: string | null
  lastPasswordChangedAt?: string | null
  roles: AccountRole[]
  notificationPreferences: NotificationPreferences
  interfacePreferences: InterfacePreferences
}

export interface UpdateAccountPayload {
  fullName?: string
  phone?: string
  jobTitle?: string
  department?: string
  organization?: string
  bio?: string
  notificationPreferences?: NotificationPreferences
  interfacePreferences?: InterfacePreferences
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface AuditLogEntry {
  id: string
  action: string
  resource?: string | null
  resourceId?: string | null
  ipAddress?: string | null
  createdAt: string
}
