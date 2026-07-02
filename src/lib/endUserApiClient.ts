// Phase 2.5 (docs/phase-2-5-public-auth-rs256-oidc.md): a separate, minimal
// client for the public end-user auth endpoints (/auth/register, /auth/login,
// /auth/refresh, /auth/me, /auth/forgot-password, /auth/reset-password,
// /auth/verify-email/*) and the OAuth authorize/consent endpoints when
// reached by an end user. Deliberately NOT sharing lib/apiClient.ts: that
// client is wired to the admin session (lib/authTokens.ts) and dispatches
// `wpa_auth_unauthorized`, which useAuthContext's admin AuthProvider listens
// to and reacts to by clearing the admin session and redirecting to the
// admin sign-in page — using it here would let an end user's 401 log an
// admin out, or vice versa. This client mirrors the same refresh-once /
// no-loop / fail-closed-on-403 design as lib/apiClient.ts, but is fully
// independent end to end (own token storage, own event name).
import {
  clearEndUserTokens,
  getEndUserAccessToken,
  getEndUserRefreshToken,
  setEndUserAccessToken,
  setEndUserRefreshToken,
} from './endUserTokens'

export class EndUserApiError extends Error {
  status: number
  code?: string
  data?: any

  constructor(message: string, status: number, code?: string, data?: any) {
    super(message)
    this.name = 'EndUserApiError'
    this.status = status
    this.code = code
    this.data = data
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5010/api/v1'

const getAuthHeaders = (): Record<string, string> => {
  const token = getEndUserAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function dispatchEndUserUnauthorized() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('wpa_enduser_unauthorized'))
  }
}

let refreshPromise: Promise<boolean> | null = null

async function refreshEndUserAccessToken(): Promise<boolean> {
  const refreshToken = getEndUserRefreshToken()
  if (!refreshToken) return false

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })
        if (!response.ok) return false

        const isJson = response.headers.get('content-type')?.includes('application/json')
        const data = isJson ? await response.json().catch(() => null) : null
        if (!data?.success || !data?.accessToken) return false

        setEndUserAccessToken(data.accessToken)
        if (data.refreshToken) setEndUserRefreshToken(data.refreshToken)
        return true
      } catch {
        return false
      }
    })().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

async function handleResponse<T>(response: Response): Promise<T> {
  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json() : null

  if (!response.ok) {
    const message = data?.message || response.statusText || 'An error occurred'
    const code = data?.code || undefined
    throw new EndUserApiError(message, response.status, code, data)
  }

  return data as T
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: any,
  options?: RequestInit,
  isRetry = false,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(method === 'POST' || method === 'PATCH' ? { 'Content-Type': 'application/json' } : {}),
    ...getAuthHeaders(),
    ...(options?.headers as Record<string, string>),
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401 && !isRetry) {
    const refreshed = await refreshEndUserAccessToken()
    if (refreshed) {
      return request<T>(method, path, body, options, true)
    }
    clearEndUserTokens()
    dispatchEndUserUnauthorized()
    return handleResponse<T>(response)
  }

  if (response.status === 401) {
    clearEndUserTokens()
    dispatchEndUserUnauthorized()
  }

  return handleResponse<T>(response)
}

export const endUserApiClient = {
  async get<T>(path: string, options?: RequestInit): Promise<T> {
    return request<T>('GET', path, undefined, options)
  },
  async post<T>(path: string, body?: any, options?: RequestInit): Promise<T> {
    return request<T>('POST', path, body, options)
  },
  async patch<T>(path: string, body?: any, options?: RequestInit): Promise<T> {
    return request<T>('PATCH', path, body, options)
  },
  async delete<T>(path: string, options?: RequestInit): Promise<T> {
    return request<T>('DELETE', path, undefined, options)
  },
}

export {
  clearEndUserTokens,
  getEndUserAccessToken,
  getEndUserRefreshToken,
  setEndUserAccessToken,
  setEndUserRefreshToken,
}
