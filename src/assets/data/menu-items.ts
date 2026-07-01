import { MenuItemType } from '@/types/menu'

export const MENU_ITEMS: MenuItemType[] = [
  {
    key: 'general',
    label: 'GENERAL',
    isTitle: true,
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'solar:widget-5-bold-duotone',
    url: '/dashboard',
  },
  {
    key: 'users',
    label: 'Users',
    icon: 'solar:users-group-two-rounded-bold-duotone',
    url: '/users',
  },
  {
    key: 'admin-team',
    label: 'Admin Team',
    icon: 'solar:shield-bold-duotone',
    url: '/admin-users',
  },
  {
    key: 'clients',
    label: 'Applications / Clients',
    icon: 'solar:server-square-bold-duotone',
    url: '/clients',
  },
  {
    key: 'roles-permissions',
    label: 'Roles & Permissions',
    icon: 'solar:user-speak-rounded-bold-duotone',
    url: '/roles',
  },
  {
    key: 'login-sessions',
    label: 'Login Sessions',
    icon: 'solar:login-2-bold-duotone',
    url: '/sessions',
  },
  {
    key: 'oauth-accounts',
    label: 'OAuth Accounts',
    icon: 'solar:link-bold-duotone',
    url: '/oauth-accounts',
  },
  {
    key: 'social-providers',
    label: 'Social Providers',
    icon: 'solar:global-bold-duotone',
    url: '/social-providers',
  },
  {
    key: 'audit-logs',
    label: 'Audit Logs',
    icon: 'solar:document-text-bold-duotone',
    url: '/audit-logs',
  },
  {
    key: 'security-events',
    label: 'Security Events',
    icon: 'solar:shield-warning-bold-duotone',
    url: '/security-events',
  },
  {
    key: 'notifications',
    label: 'Notifications',
    icon: 'solar:bell-bing-bold-duotone',
    url: '/notifications',
  },
  {
    key: 'communication',
    label: 'Communication',
    icon: 'solar:chat-round-line-bold-duotone',
    children: [
      {
        key: 'communication-sms-providers',
        label: 'SMS Providers',
        url: '/communication/sms-providers',
      },
      {
        key: 'communication-email-providers',
        label: 'Email Providers',
        url: '/communication/email-providers',
      },
      {
        key: 'communication-routing-rules',
        label: 'Routing Rules',
        url: '/communication/routing-rules',
      },
      {
        key: 'communication-otp-templates',
        label: 'OTP Templates',
        url: '/communication/otp-templates',
      },
      {
        key: 'communication-delivery-logs',
        label: 'Delivery Logs',
        url: '/communication/delivery-logs',
      },
      {
        key: 'communication-provider-health',
        label: 'Provider Health',
        url: '/communication/provider-health',
      },
      {
        key: 'communication-audit-logs',
        label: 'Audit Logs',
        url: '/communication/audit-logs',
      },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: 'solar:settings-bold-duotone',
    url: '/settings',
  },
]
