export type SocialProviderPlacement = 'MAIN' | 'MORE' | 'HIDDEN'
export type SocialProviderEnvironment = 'SANDBOX' | 'LIVE'
export type SocialProviderStatus = 'ACTIVE' | 'INACTIVE'

export interface SocialProviderReadinessCheck {
  key: string
  label: string
  status: 'BLOCK' | 'WARN' | 'OK'
  message: string
  guidance?: string
}

export interface SocialProviderReadiness {
  readyForProduction: boolean
  visibleOnLogin: boolean
  canActivate: boolean
  blockers: string[]
  warnings: string[]
  checks: SocialProviderReadinessCheck[]
  publicUrls: {
    homepageUrl: string
    privacyPolicyUrl: string
    termsUrl: string
    contactUrl: string
    supportUrl: string
    dataDeletionUrl: string
    accountDeletionUrl: string
  }
  providerSpecific: Record<string, unknown>
  lastTestAt?: string | null
  lastSuccessfulTestAt?: string | null
  lastTestStatus?: string | null
  lastTestError?: string | null
}

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
  providerMetadata?: Record<string, unknown> | null
  status: SocialProviderStatus
  environment: SocialProviderEnvironment
  placement: SocialProviderPlacement
  sortOrder: number
  showOnLogin: boolean
  createdAt: string
  updatedAt: string
  secretConfigured?: boolean
  readiness?: SocialProviderReadiness
  lastTestAt?: string | null
  lastSuccessfulTestAt?: string | null
  lastTestStatus?: string | null
  lastTestError?: string | null
}

export interface SocialProviderGroupResponse {
  success: boolean
  main: SocialProvider[]
  more: SocialProvider[]
}
