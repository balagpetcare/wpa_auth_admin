import { apiClient } from '@/lib/apiClient'
import { CommProvider, CommProviderCredential, RoutingRule, DeliveryLog, ProviderAuditLog, EmailTemplate, EmailBranding, ClientBranding } from './types'

export interface CreateProviderInput {
  name: string
  code: string
  type: 'SMS' | 'EMAIL'
  status?: 'ACTIVE' | 'INACTIVE' | 'TESTING'
  environment?: 'SANDBOX' | 'LIVE'
  isGlobal?: boolean
  countryCode?: string | null
  priority?: number
  supportedPurposes: string[]
  dailyLimit?: number | null
  monthlyLimit?: number | null
  rateLimitPerMinute?: number | null
}

export interface CreateCredentialInput {
  secrets: Record<string, string>
  apiBaseUrl?: string | null
  senderId?: string | null
  fromName?: string | null
  fromEmail?: string | null
  smtpHost?: string | null
  smtpPort?: number | null
  smtpSecure?: boolean | null
  isActive?: boolean
}

export interface CreateRoutingRuleInput {
  appId?: string | null
  channel: 'SMS' | 'EMAIL'
  countryCode?: string | null
  purpose: string
  language?: string | null
  providerId?: string | null
  fallbackProviderIds?: string[] | null
  priority?: number
  enabled?: boolean
  fallbackEnabled?: boolean
  environment?: 'SANDBOX' | 'LIVE' | null
  isActive?: boolean
}

// Phase 2.6A (docs/phase-2-6a-app-aware-communication-routing-ui.md):
// extended to cover the full backend surface — providers CRUD,
// credentials, activate/deactivate, routing rules CRUD, health, delivery
// logs, provider audit logs, and per-app branding/template overrides. Most
// of these backend routes already existed and were simply unused here.
export const communicationApi = {
  // ── Providers ──────────────────────────────────────────────────────────
  async listProviders(params?: { type?: 'SMS' | 'EMAIL' }): Promise<{ success: boolean; data: { items: CommProvider[] } }> {
    const searchParams = new URLSearchParams()
    if (params?.type) searchParams.append('type', params.type)
    return apiClient.get(`/admin/communication/providers?${searchParams.toString()}`)
  },

  async getProvider(providerId: string): Promise<{ success: boolean; data: CommProvider }> {
    return apiClient.get(`/admin/communication/providers/${providerId}`)
  },

  async createProvider(data: CreateProviderInput): Promise<{ success: boolean; data: CommProvider }> {
    return apiClient.post('/admin/communication/providers', data)
  },

  async updateProvider(providerId: string, data: Partial<CreateProviderInput>): Promise<{ success: boolean; data: CommProvider }> {
    return apiClient.patch(`/admin/communication/providers/${providerId}`, data)
  },

  async deleteProvider(providerId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/admin/communication/providers/${providerId}`)
  },

  async activateProvider(providerId: string): Promise<{ success: boolean }> {
    return apiClient.post(`/admin/communication/providers/${providerId}/activate`)
  },

  async deactivateProvider(providerId: string): Promise<{ success: boolean }> {
    return apiClient.post(`/admin/communication/providers/${providerId}/deactivate`)
  },

  // ── Credentials ────────────────────────────────────────────────────────
  // Secrets are write-only: the backend never returns encryptedSecrets or
  // raw values, only maskedSecretsPreview — see CommProviderCredential.
  async createCredential(providerId: string, data: CreateCredentialInput): Promise<{ success: boolean; data: CommProviderCredential }> {
    return apiClient.post(`/admin/communication/providers/${providerId}/credentials`, data)
  },

  async updateCredential(
    providerId: string,
    credentialId: string,
    data: Partial<CreateCredentialInput>,
  ): Promise<{ success: boolean; data: CommProviderCredential }> {
    return apiClient.patch(`/admin/communication/providers/${providerId}/credentials/${credentialId}`, data)
  },

  async testSmsProvider(providerId: string, to: string, message: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/admin/communication/providers/${providerId}/test-sms`, { to, message })
  },

  async testEmailProvider(providerId: string, to: string, subject: string, message: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/admin/communication/providers/${providerId}/test-email`, { to, subject, message })
  },

  // ── Routing Rules ──────────────────────────────────────────────────────
  async listRoutingRules(): Promise<{ success: boolean; data: { items: RoutingRule[] } }> {
    return apiClient.get('/admin/communication/routing-rules')
  },

  async createRoutingRule(data: CreateRoutingRuleInput): Promise<{ success: boolean; data: RoutingRule }> {
    return apiClient.post('/admin/communication/routing-rules', data)
  },

  async updateRoutingRule(ruleId: string, data: Partial<CreateRoutingRuleInput>): Promise<{ success: boolean; data: RoutingRule }> {
    return apiClient.patch(`/admin/communication/routing-rules/${ruleId}`, data)
  },

  async deleteRoutingRule(ruleId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/admin/communication/routing-rules/${ruleId}`)
  },

  // ── Health / Logs ──────────────────────────────────────────────────────
  async getProviderHealth(): Promise<{ success: boolean; data: { items: CommProvider[] } }> {
    return apiClient.get('/admin/communication/provider-health')
  },

  async getDeliveryLogs(params?: {
    channel?: 'SMS' | 'EMAIL'
    providerId?: string
    status?: string
    recipient?: string
    countryCode?: string
    limit?: number
    cursor?: string
  }): Promise<{ success: boolean; data: { items: DeliveryLog[]; nextCursor?: string | null; hasNextPage?: boolean; limit?: number } }> {
    const searchParams = new URLSearchParams()
    if (params?.channel) searchParams.append('channel', params.channel)
    if (params?.providerId) searchParams.append('providerId', params.providerId)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.recipient) searchParams.append('recipient', params.recipient)
    if (params?.countryCode) searchParams.append('countryCode', params.countryCode)
    if (params?.limit) searchParams.append('limit', String(params.limit))
    if (params?.cursor) searchParams.append('cursor', params.cursor)
    return apiClient.get(`/admin/communication/delivery-logs?${searchParams.toString()}`)
  },

  async getProviderAuditLogs(limit = 50, cursor?: string): Promise<{ success: boolean; data: { items: ProviderAuditLog[]; nextCursor?: string | null; hasNextPage?: boolean; limit?: number } }> {
    const searchParams = new URLSearchParams()
    searchParams.append('limit', String(limit))
    if (cursor) searchParams.append('cursor', cursor)
    return apiClient.get(`/admin/communication/provider-audit-logs?${searchParams.toString()}`)
  },

  // ── Email Branding (global default) ──────────────────────────────────
  async getEmailBranding(): Promise<{ success: boolean; data: EmailBranding }> {
    return apiClient.get('/admin/email-branding')
  },

  async updateEmailBranding(data: Partial<EmailBranding>): Promise<{ success: boolean; data: EmailBranding }> {
    return apiClient.patch('/admin/email-branding', data)
  },

  // ── App (Client) Branding ────────────────────────────────────────────
  async getClientBranding(clientId: string): Promise<{ success: boolean; data: ClientBranding | EmailBranding | null }> {
    return apiClient.get(`/admin/clients/${clientId}/branding`)
  },

  async updateClientBranding(clientId: string, data: Partial<ClientBranding>): Promise<{ success: boolean; data: ClientBranding }> {
    return apiClient.patch(`/admin/clients/${clientId}/branding`, data)
  },

  // ── Email Templates (branded emails; global + per-app overrides) ────
  async listEmailTemplates(clientId?: string): Promise<{ success: boolean; data: { items: EmailTemplate[] } }> {
    const searchParams = new URLSearchParams()
    if (clientId) searchParams.append('clientId', clientId)
    return apiClient.get(`/admin/email-templates?${searchParams.toString()}`)
  },

  async getEmailTemplate(templateId: string): Promise<{ success: boolean; data: any }> {
    return apiClient.get(`/admin/email-templates/${templateId}`)
  },

  async createEmailTemplateOverride(data: {
    key: string
    clientId?: string | null
    locale?: string
    name: string
    subject: string
    preheader?: string | null
    htmlBody: string
    textBody?: string | null
    variables?: { required?: string[]; optional?: string[] } | null
  }): Promise<{ success: boolean; data: any }> {
    return apiClient.post('/admin/email-templates', data)
  },

  async updateEmailTemplate(templateId: string, data: any): Promise<{ success: boolean; data: any }> {
    return apiClient.patch(`/admin/email-templates/${templateId}`, data)
  },

  async testEmailTemplate(templateId: string, testEmail: string, variables?: any): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/admin/email-templates/${templateId}/send-test`, { testEmail, variables })
  },
}
