'use client'

interface PreviewTabProps {
  clientId: string | null
  locale: string
}

export default function PreviewTab({ clientId, locale }: PreviewTabProps) {
  return (
    <div>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#2c3e50' }}>
        Template Preview
      </h3>
      <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
        Preview how your emails will look in different email clients.
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
          Preview your templates in various email clients including Gmail, Outlook, Apple Mail, and more.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '30px',
      }}>
        {['Gmail', 'Outlook', 'Apple Mail', 'Yahoo', 'Mobile', 'Dark Mode'].map((client) => (
          <div
            key={client}
            style={{
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              textAlign: 'center',
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
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>📧</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>{client}</div>
          </div>
        ))}
      </div>

      <div style={{
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        padding: '20px',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', color: '#7f8c8d' }}>
          <p style={{ fontSize: '14px', margin: '0' }}>Select a template and client to preview</p>
        </div>
      </div>
    </div>
  )
}
