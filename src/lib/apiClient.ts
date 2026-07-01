const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5010/api/v1'

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
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    })
  } catch (error: any) {
    throw new ApiError(0, 'NETWORK_ERROR', 'Unable to connect to API')
  }

  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new ApiError(res.status, body?.code ?? 'UNKNOWN_ERROR', body?.message ?? 'An error occurred')
  }

  return body as T
}

export function apiClient(accessToken?: string | null) {
  const headers: HeadersInit = {}
  if (accessToken && accessToken !== 'null' && accessToken !== 'undefined') {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  return {
    get: <T>(path: string) =>
      request<T>(path, { method: 'GET', headers }),

    post: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'POST', headers, body: body ? JSON.stringify(body) : undefined }),

    patch: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'PATCH', headers, body: body ? JSON.stringify(body) : undefined }),

    delete: <T>(path: string) =>
      request<T>(path, { method: 'DELETE', headers }),
  }
}

export const publicApi = apiClient()
