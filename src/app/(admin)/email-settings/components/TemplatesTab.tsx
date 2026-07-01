'use client'

interface TemplatesTabProps {
  clientId: string | null
  locale: string
}

const TEMPLATE_TYPES = [
  { id: 'welcome', name: 'Welcome Email', icon: '👋' },
  { id: 'verify', name: 'Email Verification', icon: '✅' },
  { id: 'reset', name: 'Password Reset', icon: '🔐' },
  { id: 'invite', name: 'User Invitation', icon: '📨' },
  { id: 'mfa', name: 'MFA Setup', icon: '📱' },
  { id: 'alert', name: 'Security Alert', icon: '⚠️' },
]

export default function TemplatesTab({ clientId, locale }: TemplatesTabProps) {
  return (
    <div>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#2c3e50' }}>
        Email Templates
      </h3>
      <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
        Manage email templates for {locale} locale {clientId ? '(selected client)' : '(global)'}.
      </p>

      <div style={{
        padding: '20px',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        border: '1px solid #90caf9',
        color: '#0d47a1',
        marginBottom: '30px',
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>🚀 Coming Soon</h4>
        <p style={{ margin: '0' }}>
          Template editor will allow you to customize the HTML, subject, and variables for each email type.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
      }}>
        {TEMPLATE_TYPES.map((template) => (
          <div
            key={template.id}
            style={{
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.backgroundColor = '#e3f2fd'
              el.style.borderColor = '#90caf9'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.backgroundColor = '#f8f9fa'
              el.style.borderColor = '#e9ecef'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>{template.icon}</span>
              <div>
                <h5 style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>
                  {template.name}
                </h5>
              </div>
            </div>
            <button
              disabled
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#e9ecef',
                color: '#7f8c8d',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'not-allowed',
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              Edit Template
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
