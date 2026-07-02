export interface HealthStatus {
  status: string
  timestamp: string
  uptime: number
}

export interface ReadinessStatus {
  status: string
  timestamp: string
}

export interface OperationalSnapshot {
  health: {
    database: string
    redis: string
    queue?: string
  }
  queue: {
    depth: number
  }
  workers: Array<{
    name: string
    ttl: number
    online: boolean
  }>
  metrics: {
    counters: Record<string, number>
    latency: Record<string, number>
    lastHealth: {
      redis: string
      postgres: string
      updatedAt: string | null
    }
  }
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
