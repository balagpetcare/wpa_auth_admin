export interface HealthStatus {
  status: string
  timestamp: string
  uptime: number
}

export interface SystemSettings {
  platformName: string
  publicAuthDomain: string
  adminPanelUrl: string
  supportEmail: string
  environment: string
  apiBaseUrl: string
  issuerUrl: string
  accessTokenTtl: number
  refreshTokenTtl: number
  authorizationCodeTtl: number
  serviceTokenTtl: number
  trustProxy: boolean
  jwksMode: string
  databaseStatus: string
  redisStatus: string
  smtpStatus: string
}
