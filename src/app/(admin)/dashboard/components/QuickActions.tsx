'use client'

import Link from 'next/link'

type QuickAction = {
  title: string
  description: string
  icon: string
  href: string
  color: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: 'Create User',
    description: 'Add a new admin user to the system',
    icon: '➕',
    href: '/admin-users',
    color: '#3498db',
  },
  {
    title: 'Email Settings',
    description: 'Configure email branding and templates',
    icon: '📧',
    href: '/email-settings',
    color: '#9b59b6',
  },
  {
    title: 'View Sessions',
    description: 'Monitor active user sessions',
    icon: '💾',
    href: '/sessions',
    color: '#27ae60',
  },
  {
    title: 'Security Logs',
    description: 'Check recent security events',
    icon: '🛡️',
    href: '/security-logs',
    color: '#e74c3c',
  },
]

export default function QuickActions() {
  return (
    <div style={{ marginBottom: '40px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>
        Quick Actions
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '16px',
      }}>
        {QUICK_ACTIONS.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              textDecoration: 'none',
              border: '1px solid #e9ecef',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
              el.style.transform = 'translateY(-4px)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
              el.style.transform = 'translateY(0)'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                backgroundColor: action.color + '20',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
              }}>
                {action.icon}
              </div>
              <h4 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '600',
                color: '#2c3e50',
              }}>
                {action.title}
              </h4>
            </div>
            <p style={{
              margin: 0,
              fontSize: '13px',
              color: '#7f8c8d',
              lineHeight: '1.4',
            }}>
              {action.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
