// Phase 2.6A (docs/phase-2-6a-app-aware-communication-routing-ui.md):
// extended to cover the full backend surface (providers, credentials,
// routing rules, health, delivery logs, provider audit logs) — most of
// these routes already existed on the backend and were simply unused by
// the frontend before this pass.

export interface CommProviderCredential {
  id: string
  providerId: string
  maskedSecretsPreview?: Record<string, string> | null
  apiBaseUrl?: string | null
  senderId?: string | null
  fromName?: string | null
  fromEmail?: string | null
  smtpHost?: string | null
  smtpPort?: number | null
  smtpSecure?: boolean | null
  usernamePreview?: string | null
  lastTestStatus: 'NOT_TESTED' | 'PASSED' | 'FAILED' | 'BLOCKED'
  lastTestedAt?: string | null
  lastTestMessage?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  // encryptedSecrets is intentionally never present on the frontend type —
  // the backend always strips it before responding.
}

export type CommProviderDetail = CommProvider & {
  credentials?: CommProviderCredential[]
}

export interface CommProvider {
  id: string
  name: string
  code: string
  type: 'SMS' | 'EMAIL'
  status: 'ACTIVE' | 'INACTIVE' | 'TESTING'
  environment: 'SANDBOX' | 'LIVE'
  isGlobal: boolean
  countryCode?: string | null
  priority: number
  supportedPurposes: string[]
  dailyLimit?: number | null
  monthlyLimit?: number | null
  rateLimitPerMinute?: number | null
  failureCount: number
  successCount: number
  lastSuccessAt?: string | null
  lastFailureAt?: string | null
  lastFailureMessage?: string | null
  healthStatus: 'UNKNOWN' | 'HEALTHY' | 'DEGRADED' | 'DOWN'
  createdAt: string
  updatedAt: string
  credentials?: CommProviderCredential[]
}

export interface RoutingRule {
  id: string
  appId?: string | null
  app?: { id: string; name: string; slug: string } | null
  channel: 'SMS' | 'EMAIL'
  countryCode?: string | null
  purpose: string
  language?: string | null
  providerId?: string | null
  provider?: { id: string; name: string; code: string; type: string } | null
  fallbackProviderIds?: string[] | null
  priority: number
  enabled: boolean
  fallbackEnabled: boolean
  environment?: 'SANDBOX' | 'LIVE' | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type DeliveryLogStatus =
  | 'QUEUED'
  | 'PENDING'
  | 'SENT'
  | 'FAILED'
  | 'RETRIED'
  | 'RETRY_SCHEDULED'
  | 'RETRYING'
  | 'DEAD_LETTER'
  | 'CANCELLED'
  | 'BLOCKED'

export interface ProviderAttemptChainEntry {
  attemptNo: number
  providerId: string | null
  providerCode: string | null
  success: boolean
  errorCode?: string | null
  errorMessage?: string | null
  at: string
}

export interface DeliveryLog {
  id: string
  channel: 'SMS' | 'EMAIL'
  purpose: string
  recipient: string
  countryCode?: string | null
  providerId?: string | null
  provider?: { id: string; name: string; code: string } | null
  status: DeliveryLogStatus
  attemptNo: number
  errorCode?: string | null
  errorMessage?: string | null
  sentAt?: string | null
  failedAt?: string | null
  createdAt: string
  retryCount: number
  maxRetries: number
  nextRetryAt?: string | null
  lastRetryAt?: string | null
  lastErrorCode?: string | null
  lastErrorMessage?: string | null
  isRetryable: boolean
  retryPolicyKey?: string | null
  providerAttemptChain?: ProviderAttemptChainEntry[] | null
  cancelledAt?: string | null
  deadLetterAt?: string | null
  nonRetryableReason?: string | null
}

export interface DeliveryLogDetail extends DeliveryLog {
  messagePreview?: { subject?: string; text?: string; message?: string } | null
  auditTrail?: Array<{
    id: string
    action: string
    createdAt: string
    actorAdmin?: { id: string; email?: string | null; username?: string | null } | null
    metadata?: Record<string, unknown> | null
  }>
}

export interface ProviderAuditLog {
  id: string
  actorAdminId?: string | null
  action: string
  providerId?: string | null
  metadata?: Record<string, unknown> | null
  ipAddress?: string | null
  createdAt: string
}

export interface EmailTemplate {
  id: string
  key: string
  name: string
  subject: string
  preheader?: string
  isActive: boolean
  clientId?: string | null
  locale: string
  version: number
  updatedAt: string
}

export interface EmailBranding {
  id: string
  brandName: string
  supportEmail?: string
  websiteUrl?: string
  primaryColor?: string
  textColor?: string
  logoUrl?: string
  replyTo?: string | null
}

export interface ClientBranding {
  id: string
  clientId: string
  logoUrl?: string | null
  logoAltText?: string | null
  brandColor?: string | null
  accentColor?: string | null
  senderName?: string | null
  senderEmail?: string | null
  replyTo?: string | null
  supportEmail?: string | null
  supportPhone?: string | null
  websiteUrl?: string | null
  privacyUrl?: string | null
  termsUrl?: string | null
  unsubscribeUrl?: string | null
  footerText?: string | null
  isActive: boolean
}
