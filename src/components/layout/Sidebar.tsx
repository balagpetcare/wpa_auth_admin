'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const MENU_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Email Settings', href: '/email-settings', icon: '📧' },
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
    <aside style={{
      width: '280px',
      backgroundColor: '#2c3e50',
      color: '#fff',
      padding: '0',
      overflowY: 'auto',
      borderRight: '1px solid #34495e',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Logo/Brand */}
      <div style={{
        padding: '25px 20px',
        borderBottom: '1px solid #34495e',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          backgroundColor: '#3498db',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '18px',
        }}>
          W
        </div>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', lineHeight: '1.2' }}>
            WPA Auth
          </div>
          <div style={{ fontSize: '11px', color: '#bdc3c7', marginTop: '2px' }}>
            Admin Panel
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{
        flex: 1,
        padding: '15px 0',
        overflowY: 'auto',
      }}>
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 20px',
                color: isActive ? '#3498db' : '#ecf0f1',
                textDecoration: 'none',
                borderLeft: isActive ? '3px solid #3498db' : 'none',
                backgroundColor: isActive ? '#34495e' : 'transparent',
                borderRadius: isActive ? '0' : '0',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                if (!isActive) {
                  el.style.backgroundColor = '#34495e'
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                if (!isActive) {
                  el.style.backgroundColor = 'transparent'
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span style={{ fontSize: '14px', fontWeight: isActive ? '600' : '500' }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '15px 20px',
        borderTop: '1px solid #34495e',
        fontSize: '12px',
        color: '#95a5a6',
        textAlign: 'center',
      }}>
        <div>WPA Auth Admin v1.0</div>
      </div>
    </aside>
  )
}
