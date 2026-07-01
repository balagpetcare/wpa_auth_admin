'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type MenuItem = {
  label: string
  href: string
  icon: string
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Email Settings', href: '/email-settings', icon: '✉️' },
  { label: 'Admin Users', href: '/admin-users', icon: '👥' },
  { label: 'Roles & Permissions', href: '/roles', icon: '🔐' },
  { label: 'OAuth Clients', href: '/oauth-clients', icon: '🔑' },
  { label: 'Sessions', href: '/sessions', icon: '💾' },
  { label: 'Security Logs', href: '/security-logs', icon: '🛡️' },
  { label: 'Audit Logs', href: '/audit-logs', icon: '📋' },
  { label: 'My Account', href: '/my-account', icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <nav className="wpa-sidebar-nav" aria-label="Admin navigation">
      <ul className="navbar-nav" id="navbar-nav">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <li key={item.href} className="nav-item">
              <Link href={item.href} className={`nav-link${isActive ? ' active' : ''}`}>
                <span className="nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="nav-text">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
