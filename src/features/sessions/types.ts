export interface ActiveSession {
  id: string
  userId: string
  token: string
  userAgent?: string
  ipAddress?: string
  status: string
  createdAt: string
  lastActiveAt?: string
  expiresAt: string
  user?: {
    username: string
    email: string
    displayName?: string
  }
}

export interface ListSessionsResponse {
  success: boolean
  data?: {
    items?: ActiveSession[]
    total?: number
    nextCursor?: string | null
    hasNextPage?: boolean
    limit?: number
  }
  sessions?: ActiveSession[]
  items?: ActiveSession[]
  nextCursor?: string | null
  hasNextPage?: boolean
  limit?: number
}
