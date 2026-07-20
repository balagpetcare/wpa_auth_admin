export class ApiError extends Error {
  status: number
  code?: string
  data?: any

  constructor(message: string, status: number, code?: string, data?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.data = data
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5010/api/v1'
const CENTRAL_AUTH_BFF_URL = '/api/central-auth-bff'
import { clearAuthTokens, getAccessToken, setAccessToken, setRefreshToken, getRefreshToken } from './authTokens'

const getAuthHeaders = (): Record<string, string> => {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function dispatchUnauthorized() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('wpa_auth_unauthorized'))
  }
}

// Phase 1 audit fix (docs/central-auth-api-admin-scalability-audit.md):
// previously only the /admin/auth/me call attempted a silent refresh on 401;
// every other endpoint force-logged-out immediately, even with a still-valid
// refresh token. Refresh is now centralized here so it applies to every
// request. `refreshPromise` is a shared lock so concurrent 401s from several
// in-flight requests trigger exactly one refresh call instead of racing.
let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
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

        setAccessToken(data.accessToken)
        if (data.refreshToken) setRefreshToken(data.refreshToken)
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
    throw new ApiError(message, response.status, code, data)
  }

  return data as T
}

interface RequestOptions extends RequestInit {
  body?: any
}

// Shared request path for all HTTP verbs. On a 401 (expired/invalid access
// token) it attempts exactly one silent refresh-and-retry; a 403 (a valid
// session lacking permission) is never treated as a refresh trigger — it is
// returned to the caller as-is via handleResponse, matching the existing
// error-shape contract (ApiError with status 403).
async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: any,
  options?: RequestOptions,
  isRetry = false,
  rawBody?: FormData,
): Promise<T> {
  const localAccessToken = getAccessToken()
  const headers: Record<string, string> = {
    ...(!rawBody && (method === 'POST' || method === 'PATCH') ? { 'Content-Type': 'application/json' } : {}),
    ...getAuthHeaders(),
    ...(options?.headers as Record<string, string>),
  }

  // Central-Auth-only sessions keep both tokens in HttpOnly cookies. When no
  // legacy local token exists, use the same-origin BFF; local login continues
  // to call the API directly as a temporary fallback.
  const requestBaseUrl = localAccessToken ? BASE_URL : CENTRAL_AUTH_BFF_URL
  const response = await fetch(`${requestBaseUrl}${path}`, {
    ...options,
    method,
    headers,
    body: rawBody ?? (body !== undefined ? JSON.stringify(body) : undefined),
  })

  if (response.status === 401 && !isRetry && localAccessToken) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return request<T>(method, path, body, options, true, rawBody)
    }
    clearAuthTokens()
    dispatchUnauthorized()
    return handleResponse<T>(response)
  }

  if (response.status === 401 || response.status === 403) {
    // Either the retried request still failed (refresh token itself is
    // invalid/expired) or this is a true permission-denied 403 — in both
    // cases we surface the error rather than looping. A 401 that survives a
    // retry means the session is unrecoverable, so tokens are cleared; a 403
    // just means the account is authenticated but not authorized, so the
    // session is left intact for the caller to handle (e.g. show a
    // "forbidden" message) instead of forcing a logout.
    if (response.status === 401) {
      clearAuthTokens()
      dispatchUnauthorized()
    }
  }

  return handleResponse<T>(response)
}

export const apiClient = {
  async get<T>(path: string, options?: RequestInit): Promise<T> {
    return request<T>('GET', path, undefined, options)
  },

  async post<T>(path: string, body?: any, options?: RequestInit): Promise<T> {
    return request<T>('POST', path, body, options)
  },

  async patch<T>(path: string, body?: any, options?: RequestInit): Promise<T> {
    return request<T>('PATCH', path, body, options)
  },

  async postForm<T>(path: string, formData: FormData, options?: RequestInit): Promise<T> {
    return request<T>('POST', path, undefined, options, false, formData)
  },

  async delete<T>(path: string, options?: RequestInit): Promise<T> {
    return request<T>('DELETE', path, undefined, options)
  },
}

export {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
}
