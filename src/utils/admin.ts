export function getAdminDisplayName(user?: {
  fullName?: string | null
  displayName?: string | null
  username?: string | null
  email?: string | null
}) {
  return user?.fullName || user?.displayName || user?.username || user?.email || 'Admin'
}

export function getAdminInitials(user?: {
  fullName?: string | null
  displayName?: string | null
  username?: string | null
  email?: string | null
}) {
  const source = getAdminDisplayName(user).trim()
  const words = source.split(/\s+/).filter(Boolean
  if (words.length >= 2) {
    return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

export function getRoleLabel(roles?: Array<{ name: string }> | string[]) {
  if (!roles?.length) return 'ADMIN'
  const firstRole = typeof roles[0] === 'string' ? roles[0] : roles[0]?.name
  return (firstRole || 'ADMIN').replace(/_/g, ' ').toUpperCase()
}
