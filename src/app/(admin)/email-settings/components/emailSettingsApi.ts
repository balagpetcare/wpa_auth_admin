import { apiClient } from '@/lib/apiClient'

export type EmailClient = {
  id: string
  name: string
  slug?: string
  clientId?: string
}

export type EmailTemplate = {
  id: string
  key: string
  name: string
  subject?: string
  preheader?: string
  locale?: string
  clientName?: string
  active?: boolean
  updatedAt?: string
  headerColor?: string
  htmlBody?: string
  textBody?: string
  variables?: string[]
}

export type EmailLog = {
  id: string
  templateKey?: string
  recipient?: string
  status?: 'sent' | 'failed' | 'bounced'
  clientName?: string
  locale?: string
  timestamp?: string
  errorMessage?: string
}

async function tryGet<T>(paths: string[]) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  const client = apiClient(token)
  for (const path of paths) {
    try {
      const data = await client.get<T>(path)
      return { data, path, available: true }
    } catch {
      continue
    }
  }
  return { data: null as T | null, path: undefined, available: false }
}

async function trySend<T>(paths: string[], body: unknown) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  const client = apiClient(token)
  for (const path of paths) {
    try {
      const data = await client.post<T>(path, body)
      return { data, path, available: true }
    } catch {
      continue
    }
  }
  return { data: null as T | null, path: undefined, available: false }
}

export const emailApi = {
  clients: () => tryGet<{ data?: { items?: EmailClient[] }; items?: EmailClient[]; clients?: EmailClient[] }>(['/admin/clients']),
  branding: (clientId: string | null) =>
    tryGet<any>([
      `/admin/email-settings/branding?clientId=${clientId || 'global'}`,
      `/admin/email-settings/settings?clientId=${clientId || 'global'}`,
      `/admin/email-settings?clientId=${clientId || 'global'}`,
    ]),
  templates: (clientId: string | null, locale: string) =>
    tryGet<{ templates?: EmailTemplate[]; items?: EmailTemplate[] }>([
      `/admin/email-settings/templates?clientId=${clientId || 'global'}&locale=${locale}`,
      `/admin/email-settings/template-list?clientId=${clientId || 'global'}&locale=${locale}`,
    ]),
  preview: (clientId: string | null, locale: string, templateKey: string) =>
    tryGet<any>([
      `/admin/email-settings/preview?clientId=${clientId || 'global'}&locale=${locale}&templateKey=${templateKey}`,
      `/admin/email-settings/template-preview?clientId=${clientId || 'global'}&locale=${locale}&templateKey=${templateKey}`,
    ]),
  logs: (clientId: string | null, locale: string, templateKey?: string, status?: string, date?: string) =>
    tryGet<{ logs?: EmailLog[]; items?: EmailLog[] }>([
      `/admin/email-logs?clientId=${clientId || 'global'}&locale=${locale}${templateKey ? `&templateKey=${templateKey}` : ''}${status ? `&status=${status}` : ''}${date ? `&date=${date}` : ''}`,
    ]),
  saveBranding: (clientId: string | null, payload: unknown) =>
    trySend<any>([
      '/admin/email-settings/branding',
      '/admin/email-settings/settings',
      '/admin/email-settings',
    ], { clientId: clientId || 'global', ...(payload as Record<string, unknown>) }),
  saveTemplate: (payload: unknown) =>
    trySend<any>([
      '/admin/email-settings/templates',
      '/admin/email-settings/template',
    ], payload),
  validateTemplate: (payload: unknown) =>
    trySend<any>([
      '/admin/email-settings/templates/validate',
      '/admin/email-settings/validate-template',
    ], payload),
  resetTemplate: (payload: unknown) =>
    trySend<any>([
      '/admin/email-settings/templates/reset',
      '/admin/email-settings/reset-template',
    ], payload),
  rollbackTemplate: (payload: unknown) =>
    trySend<any>([
      '/admin/email-settings/templates/rollback',
      '/admin/email-settings/rollback-template',
    ], payload),
  sendTest: (payload: unknown) =>
    trySend<any>([
      '/admin/email-settings/send-test',
    ], payload),
  retryLog: (payload: unknown) =>
    trySend<any>([
      '/admin/email-logs/retry',
    ], payload),
}
