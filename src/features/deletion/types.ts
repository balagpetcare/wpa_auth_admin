export type DeletionRequestType = 'ACCOUNT' | 'DATA'
export type DeletionRequestStatus = 'PENDING_REVIEW' | 'SCHEDULED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'FAILED'
export type DeletionRequestSource = 'AUTHENTICATED_WEB' | 'PUBLIC_WEB' | 'EMAIL_REQUEST' | 'META_CALLBACK' | 'ADMIN'
export type DeletionRequestProvider = 'GOOGLE' | 'FACEBOOK' | 'APPLE' | 'MICROSOFT' | 'LINKEDIN' | 'TIKTOK' | 'X' | 'GITHUB' | 'INSTAGRAM'

export interface DeletionRequestListItem {
  id: string
  confirmationCode: string
  requestType: DeletionRequestType
  provider?: DeletionRequestProvider | null
  requestSource: DeletionRequestSource
  status: DeletionRequestStatus
  requestedAt: string
  gracePeriodDeadlineAt?: string | null
  processedAt?: string | null
  cancelledAt?: string | null
  reviewedAt?: string | null
  failureReason?: string | null
  userId?: string | null
  emailHash?: string | null
  emailReference?: string | null
}

export interface DeletionRequestEvent {
  id: string
  eventType: string
  actorSource: string
  actorUserId?: string | null
  actorAdminId?: string | null
  createdAt: string
  metadata?: unknown
}

export interface DeletionRequestUser {
  id: string
  email?: string | null
  username?: string | null
  displayName?: string | null
  status: string
  createdAt: string
  updatedAt: string
  lastLoginAt?: string | null
}

export interface DeletionRequestDetail extends DeletionRequestListItem {
  sourceIp?: string | null
  sourceUserAgent?: string | null
  auditMetadata?: unknown
  user?: DeletionRequestUser | null
  events?: DeletionRequestEvent[]
  processing?: Record<string, unknown>
}

export interface DeletionRequestListResponse {
  success: boolean
  data: {
    items: DeletionRequestListItem[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}
