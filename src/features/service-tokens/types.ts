export interface ServiceToken {
  id: string
  name: string
  serviceName: string
  scopes: string[]
  createdBy: string
  createdAt: string
  expiresAt: string | null
  lastUsedAt: string | null
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED'
}
