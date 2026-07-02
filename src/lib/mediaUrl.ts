import avatar1 from '@/assets/images/users/avatar-1.jpg'

export const getMediaUrl = (url?: string | null): any => {
  if (!url) return avatar1

  // If it's already an absolute URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // If relative path, derive API origin while avoiding double /api/v1 prefixes.
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5010/api/v1'
  
  try {
    const parsed = new URL(apiBaseUrl)
    const origin = parsed.origin

    const cleanPath = url.startsWith('/') ? url : `/${url}`
    const normalizedPath = cleanPath.startsWith('/api/v1/') ? cleanPath.replace('/api/v1', '') : cleanPath
    return `${origin}${normalizedPath}`
  } catch (err) {
    return avatar1
  }
}
