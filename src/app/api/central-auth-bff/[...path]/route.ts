import { NextRequest, NextResponse } from 'next/server'
import { getCentralAuthAccessToken } from '@/lib/centralAuthSession'
import { centralAuthConfig } from '@/lib/centralAuthConfig'

export const dynamic = 'force-dynamic'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5010/api/v1'
const ALLOWED_PREFIXES = ['/admin/', '/auth/presence/']
const ALLOWED_EXACT_PATHS = new Set(['/admin', '/health', '/health/ready'])
const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])

function isAllowedPath(path: string) {
  return ALLOWED_EXACT_PATHS.has(path) || ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))
}

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (origin) return origin === request.nextUrl.origin
  return request.headers.get('sec-fetch-site') === 'same-origin'
}

async function proxy(request: NextRequest, segments: string[]) {
  const path = `/${segments.join('/')}`
  if (!isAllowedPath(path)) {
    return NextResponse.json({ success: false, message: 'BFF route is not allowed.' }, { status: 404 })
  }
  if (MUTATING_METHODS.has(request.method) && !isSameOrigin(request)) {
    return NextResponse.json({ success: false, message: 'Cross-origin request rejected.' }, { status: 403 })
  }

  const accessToken = await getCentralAuthAccessToken()
  if (!accessToken) {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 })
  }

  try {
    // The BFF independently verifies that this is an active admin session.
    // Endpoint-level authorization remains enforced by wpa-auth-api.
    const authz = await fetch(centralAuthConfig.meUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    if (!authz.ok) {
      return NextResponse.json(
        { success: false, message: authz.status === 403 ? 'Forbidden.' : 'Unauthorized.' },
        { status: authz.status === 403 ? 403 : 401 },
      )
    }

    const target = new URL(`${API_BASE_URL}${path}`)
    request.nextUrl.searchParams.forEach((value, key) => target.searchParams.append(key, value))
    const headers = new Headers()
    headers.set('Authorization', `Bearer ${accessToken}`)
    const contentType = request.headers.get('content-type')
    if (contentType) headers.set('content-type', contentType)

    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
      cache: 'no-store',
      redirect: 'manual',
    })
    const responseHeaders = new Headers()
    const upstreamContentType = upstream.headers.get('content-type')
    if (upstreamContentType) responseHeaders.set('content-type', upstreamContentType)
    responseHeaders.set('cache-control', 'no-store')
    return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders })
  } catch (err) {
    console.error('Central Auth BFF request failed:', err instanceof Error ? err.message : 'unknown error')
    return NextResponse.json({ success: false, message: 'Upstream service unavailable.' }, { status: 502 })
  }
}

type RouteContext = { params: Promise<{ path: string[] }> }

async function handle(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return proxy(request, path)
}

export const GET = handle
export const POST = handle
export const PATCH = handle
export const PUT = handle
export const DELETE = handle
