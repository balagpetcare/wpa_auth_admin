const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

if (!API_BASE && process.env.NODE_ENV !== 'production') {
  throw new Error('NEXT_PUBLIC_API_BASE_URL is missing. Please check your environment variables.')
}

const safeApiBase = API_BASE || 'http://localhost:5010/api/v1'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${safeApiBase}${path}`, {
      ...init,
      headers: init.body instanceof FormData
        ? { ...(init.headers ?? {}) }
        : {
            'Content-Type': 'application/json',
            ...(init.headers ?? {}),
          },
    })
  } catch (error: any) {
    throw new ApiError(0, 'NETWORK_ERROR', 'Unable to connect to WPA Auth API. Please check API server and NEXT_PUBLIC_API_BASE_URL.')
  }

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const body = isJson ? await res.json().catch(() => ({})) : {}

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      // Clean handling for auth errors
      throw new ApiError(res.status, body?.code ?? 'UNAUTHORIZED', body?.message ?? 'Authentication required or forbidden.')
    }
    throw new ApiError(res.status, body?.code ?? 'UNKNOWN_ERROR', body?.message ?? 'An unexpected error occurred.')
  }

  return body as T
}

export function apiClient(accessToken?: string | null) {
  const authHeader: Record<string, string> = {}
  
  if (accessToken && accessToken !== 'null' && accessToken !== 'undefined') {
    authHeader['Authorization'] = `Bearer ${accessToken}`
  }

  return {
    get: <T>(path: string) =>
      request<T>(path, { method: 'GET', headers: authHeader }),

    post: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'POST', headers: authHeader, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined }),

    patch: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'PATCH', headers: authHeader, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined }),

    delete: <T>(path: string) =>
      request<T>(path, { method: 'DELETE', headers: authHeader }),
  }
}

// Convenience: unauthenticated client for public endpoints
export const publicApi = apiClient()

// ─── Users API ───────────────────────────────────────────────────────────────

export const usersApi = (accessToken: string) => {
  const client = apiClient(accessToken)
  return {
    getUserDetail: (userId: string) => client.get<{ success: boolean; user: any }>(`/admin/users/${userId}`),
    updateUserStatus: (userId: string, status: 'ACTIVE' | 'SUSPENDED' | 'DELETED' | 'DISABLED') => 
      client.patch<{ success: boolean; user: any }>(`/admin/users/${userId}/status`, { status }),
    resetUserPassword: (userId: string) => 
      client.post<{ success: boolean; message: string }>(`/admin/users/${userId}/reset-password`),
    deleteOrDeactivateUser: (userId: string) => 
      client.delete<{ success: boolean; message: string; user: any }>(`/admin/users/${userId}`),
    revokeUserSessions: (userId: string) => 
      client.post<{ success: boolean; revokedCount: number }>(`/admin/users/${userId}/revoke-sessions`),
  }
}

export const adminTeamApi = (accessToken: string) => {
  const client = apiClient(accessToken)
  return {
    listAdminUsers: (params?: any) => 
      client.get<{ success: boolean; data: any }>(`/admin/admin-users?${new URLSearchParams(params).toString()}`),
    assignExistingUserAdmin: (body: { userId: string; roleIds: string[] }) => 
      client.post<{ success: boolean; message: string }>('/admin/admin-users/assign-existing', body),
    createAdminInvitation: (body: { email: string; roleIds: string[]; message?: string }) => 
      client.post<{ success: boolean; message: string; inviteUrl?: string; emailConfigured: boolean }>('/admin/admin-invitations', body),
    listAdminInvitations: (params?: any) => 
      client.get<{ success: boolean; data: any }>(`/admin/admin-invitations?${new URLSearchParams(params).toString()}`),
    resendAdminInvitation: (invitationId: string) =>
      client.post<{ success: boolean; message: string; inviteUrl?: string }>(`/admin/admin-invitations/${invitationId}/resend`),
    revokeAdminInvitation: (invitationId: string) => 
      client.post<{ success: boolean; message: string }>(`/admin/admin-invitations/${invitationId}/revoke`),
  }
}
