'use client'

interface BrandingTabProps {
  clientId: string | null
}

export default function BrandingTab({ clientId }: BrandingTabProps) {
  return (
    <div>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#2c3e50' }}>
        Email Branding Settings
      </h3>
      <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
        Configure your email branding for {clientId ? 'the selected client' : 'the global default'}.
      </p>

      <div style={{
        padding: '20px',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        border: '1px solid #90caf9',
        color: '#0d47a1',
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>🚀 Coming Soon</h4>
        <p style={{ margin: '0' }}>
          Email branding editor is currently under development. You'll be able to configure:
        </p>
        <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
          <li>Logo and company branding</li>
          <li>Primary and accent colors</li>
          <li>Footer information</li>
          <li>Brand-specific templates</li>
        </ul>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginTop: '30px',
      }}>
        <div style={{
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
        }}>
          <h5 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Logo</h5>
          <div style={{
            width: '100%',
            height: '120px',
            backgroundColor: '#e9ecef',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7f8c8d',
            fontSize: '14px',
          }}>
            Logo Preview
          </div>
        </div>

        <div style={{
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
        }}>
          <h5 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Primary Color</h5>
          <div style={{
            width: '100%',
            height: '50px',
            backgroundColor: '#3498db',
            borderRadius: '6px',
            marginBottom: '10px',
          }} />
          <input
            type="text"
            value="#3498db"
            disabled
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: '#fff',
            }}
          />
        </div>

        <div style={{
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
        }}>
          <h5 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Accent Color</h5>
          <div style={{
            width: '100%',
            height: '50px',
            backgroundColor: '#2ecc71',
            borderRadius: '6px',
            marginBottom: '10px',
          }} />
          <input
            type="text"
            value="#2ecc71"
            disabled
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: '#fff',
            }}
          />
        </div>
      </div>
    </div>
  )
}
