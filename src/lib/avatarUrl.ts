export function resolveAvatarUrl(url?: string | null): string | null {
  if (!url) return null

  const trimmed = url.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5010/api/v1'

  try {
    const parsed = new URL(apiBaseUrl)
    const origin = parsed.origin

    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    const normalizedPath = cleanPath.startsWith('/api/v1/') ? cleanPath.replace('/api/v1', '') : cleanPath
    return `${origin}${normalizedPath}`
  } catch {
    return null
  }
}
