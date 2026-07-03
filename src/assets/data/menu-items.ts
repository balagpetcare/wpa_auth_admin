import { MenuItemType } from '@/types/menu'

export const MENU_ITEMS: MenuItemType[] = [
  {
    key: 'main-title',
    label: 'MAIN',
    isTitle: true,
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'solar:widget-5-bold-duotone',
    url: '/dashboard',
  },
  {
    key: 'identity-title',
    label: 'IDENTITY',
    isTitle: true,
  },
  {
    key: 'admin-users',
    label: 'Admin Users',
    icon: 'solar:users-group-two-rounded-bold-duotone',
    url: '/admin-users',
  },
  {
    // Phase 2 module (docs/phase-2-core-identity-admin-modules.md): platform
    // customer/end-user accounts, distinct from internal admin operators
    // above (Admin Users).
    key: 'end-users',
    label: 'End Users',
    icon: 'solar:user-id-bold-duotone',
    url: '/end-users',
  },
  {
    key: 'roles-permissions',
    label: 'Roles & Permissions',
    icon: 'solar:shield-keyhole-bold-duotone',
    url: '/roles-permissions',
  },
  {
    key: 'clients',
    label: 'Applications / Clients',
    // UI polish fix (docs/admin-panel-shell-ui-polish.md): the previous icon
    // id ('solar:laptop-phone-bold-duotone') does not exist in the Solar
    // icon set (404 from the Iconify API), so it silently rendered nothing.
    icon: 'solar:monitor-smartphone-bold-duotone',
    url: '/applications',
  },
  {
    key: 'oauth-oidc',
    label: 'OAuth / OIDC',
    icon: 'solar:key-minimalistic-square-3-bold-duotone',
    url: '/oauth',
  },
  {
    key: 'authentication-title',
    label: 'AUTHENTICATION',
    isTitle: true,
  },
  {
    key: 'social-login-providers',
    label: 'Social Login Providers',
    icon: 'solar:users-group-rounded-bold-duotone',
    url: '/authentication/social-providers',
  },
  {
    key: 'security-title',
    label: 'SECURITY',
    isTitle: true,
  },
  {
    key: 'sessions',
    label: 'Sessions',
    icon: 'solar:bookmark-opened-bold-duotone',
    url: '/sessions',
  },
  {
    key: 'service-tokens',
    label: 'Service Tokens',
    icon: 'solar:ticket-bold-duotone',
    url: '/service-tokens',
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
    key: 'security-settings',
    label: 'Security Settings',
    icon: 'solar:lock-bold-duotone',
    url: '/security-settings',
  },
  {
    key: 'communication-title',
    label: 'COMMUNICATION',
    isTitle: true,
  },
  {
    key: 'email-gateway',
    label: 'Email Gateway',
    icon: 'solar:letter-opened-bold-duotone',
    url: '/email-gateway',
  },
  {
    key: 'sms-gateway',
    label: 'SMS / OTP Gateway',
    icon: 'solar:chat-square-bold-duotone',
    url: '/sms-gateway',
  },
  // Phase 2.6A (docs/phase-2-6a-app-aware-communication-routing-ui.md):
  // admin UI foundation for the communication system's backend, which
  // already had provider/credential/routing-rule/health/log CRUD wired
  // but no dedicated UI beyond the basic settings pages above.
  {
    key: 'comm-providers',
    label: 'Communication Providers',
    icon: 'solar:server-square-bold-duotone',
    url: '/communication-providers',
  },
  {
    key: 'comm-routing-rules',
    label: 'Routing Rules',
    icon: 'solar:routing-2-bold-duotone',
    url: '/communication-routing-rules',
  },
  {
    key: 'comm-provider-health',
    label: 'Provider Health',
    icon: 'solar:heart-pulse-2-bold-duotone',
    url: '/communication-provider-health',
  },
  {
    key: 'comm-delivery-logs',
    label: 'Delivery Logs',
    icon: 'solar:clipboard-list-bold-duotone',
    url: '/communication-delivery-logs',
  },
  {
    key: 'comm-provider-audit-logs',
    label: 'Provider Audit Logs',
    icon: 'solar:document-text-bold-duotone',
    url: '/communication-provider-audit-logs',
  },
  {
    key: 'comm-app-branding',
    label: 'App Email Branding',
    icon: 'solar:palette-bold-duotone',
    url: '/communication-app-branding',
  },
  {
    key: 'comm-template-overrides',
    label: 'Template Overrides',
    icon: 'solar:document-add-bold-duotone',
    url: '/communication-template-overrides',
  },
  {
    key: 'system-title',
    label: 'SYSTEM',
    isTitle: true,
  },
  {
    key: 'api-health',
    label: 'API Health',
    icon: 'solar:heart-pulse-bold-duotone',
    url: '/api-health',
  },
  {
    key: 'environment',
    label: 'Environment',
    icon: 'solar:database-bold-duotone',
    url: '/environment',
  },
  // Phase 1 audit fix (docs/central-auth-api-admin-scalability-audit.md):
  // removed a 'settings' nav item pointing to /settings, which has no
  // corresponding page under src/app/(admin)/settings — it 404'd on click.
  // Existing settings screens (security-settings, email-settings,
  // sms-otp-settings, environment) remain linked above; a consolidated
  // system-settings page is tracked as a Phase 2 missing module, not a
  // Phase 1 fix.
]
