export interface AuditLog {
  id: string
  action: string
  resource?: string
  resourceId?: string
  ipAddress?: string
  metadata?: any
  createdAt: string
  user?: {
    id: string
    email: string
    username: string
  }
  client?: {
    id: string
    name: string
    slug: string
  }
}

export interface ListAuditLogsResponse {
  success: boolean
  logs: AuditLog[]
  total: number
  limit: number
  offset: number
}
