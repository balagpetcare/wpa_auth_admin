'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTitle } from '@/context/useTitleContext'

const routeTitleMap: Array<{ match: RegExp; title: string }> = [
  { match: /^\/dashboard$/, title: 'DASHBOARD' },
  { match: /^\/users$/, title: 'USERS MANAGEMENT' },
  { match: /^\/users\/[^/]+$/, title: 'USER DETAILS' },
  { match: /^\/admin-users$/, title: 'ADMIN TEAM' },
  { match: /^\/sessions$/, title: 'LOGIN SESSIONS' },
  { match: /^\/oauth-accounts$/, title: 'OAUTH ACCOUNTS' },
  { match: /^\/social-providers$/, title: 'SOCIAL PROVIDERS' },
  { match: /^\/audit-logs$/, title: 'AUDIT LOGS' },
  { match: /^\/security-events$/, title: 'SECURITY EVENTS' },
  { match: /^\/notifications$/, title: 'NOTIFICATIONS' },
  { match: /^\/communication\/sms-providers$/, title: 'SMS PROVIDERS' },
  { match: /^\/communication\/email-providers$/, title: 'EMAIL PROVIDERS' },
  { match: /^\/communication\/routing-rules$/, title: 'ROUTING RULES' },
  { match: /^\/communication\/otp-templates$/, title: 'OTP TEMPLATES' },
  { match: /^\/communication\/delivery-logs$/, title: 'DELIVERY LOGS' },
  { match: /^\/communication\/provider-health$/, title: 'PROVIDER HEALTH' },
  { match: /^\/communication\/audit-logs$/, title: 'COMMUNICATION AUDIT LOGS' },
  { match: /^\/settings$/, title: 'SYSTEM SETTINGS' },
  { match: /^\/account$/, title: 'MY ACCOUNT' },
]

const RouteTitleSync = () => {
  const pathname = usePathname()
  const { setTitle } = useTitle()

  useEffect(() => {
    const matched = routeTitleMap.find((item) => item.match.test(pathname
    if (matched) {
      setTitle(matched.title
    }
  }, [pathname, setTitle]

  return null
}

export default RouteTitleSync
