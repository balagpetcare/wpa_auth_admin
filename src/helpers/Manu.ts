export type MenuItemType = {
  key: string
  label: string
  url?: string
  parentKey?: string
  icon?: string
  children?: MenuItemType[]
}

export const MENU_ITEMS: MenuItemType[] = [
  { key: 'dashboard', label: 'Dashboard', url: '/dashboard', icon: '📊' },
  { key: 'email-settings', label: 'Email Settings', url: '/email-settings', icon: '✉️' },
  { key: 'admin-users', label: 'Admin Users', url: '/admin-users', icon: '👥' },
  { key: 'roles', label: 'Roles & Permissions', url: '/roles', icon: '🔐' },
  { key: 'oauth-clients', label: 'OAuth Clients', url: '/oauth-clients', icon: '🔑' },
  { key: 'sessions', label: 'Sessions', url: '/sessions', icon: '💾' },
  { key: 'security-logs', label: 'Security Logs', url: '/security-logs', icon: '🛡️' },
  { key: 'audit-logs', label: 'Audit Logs', url: '/audit-logs', icon: '📋' },
  { key: 'my-account', label: 'My Account', url: '/my-account', icon: '⚙️' },
]

export const getMenuItems = () => MENU_ITEMS
