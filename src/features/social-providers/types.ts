export type SocialProviderPlacement = 'MAIN' | 'MORE' | 'HIDDEN'
export type SocialProviderEnvironment = 'SANDBOX' | 'LIVE'
export type SocialProviderStatus = 'ACTIVE' | 'INACTIVE'

export interface SocialProvider {
  id: string
  provider: 'GOOGLE' | 'FACEBOOK' | 'APPLE' | 'MICROSOFT' | 'LINKEDIN' | 'TIKTOK' | 'X' | 'GITHUB' | 'INSTAGRAM'
  displayName: string
  clientId?: string | null
  clientSecretEncrypted?: string | null
  authorizationUrl: string
  tokenUrl: string
  userInfoUrl?: string | null
  scopes: string[]
  redirectUri: string
  status: SocialProviderStatus
  environment: SocialProviderEnvironment
  placement: SocialProviderPlacement
  sortOrder: number
  showOnLogin: boolean
  createdAt: string
  updatedAt: string
  secretConfigured?: boolean
}

export interface SocialProviderGroupResponse {
  success: boolean
  main: SocialProvider[]
  more: SocialProvider[]
}
