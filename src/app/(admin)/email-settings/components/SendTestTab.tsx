'use client'

import { useState } from 'react'

interface SendTestTabProps {
  clientId: string | null
  locale: string
}

export default function SendTestTab({ clientId, locale }: SendTestTabProps) {
  const [testEmail, setTestEmail] = useState('')
  const [templateType, setTemplateType] = useState('welcome')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null)

  const handleSendTest = async () => {
    if (!testEmail) {
      setResult({ success: false, message: 'Please enter an email address' })
      return
    }

    setSending(true)
    setResult(null)

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setResult({ success: false, message: 'Not authenticated' })
        return
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5010/api/v1'}/admin/email-settings/send-test`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: testEmail,
            templateType,
            clientId: clientId || undefined,
            locale,
          }),
        }
      )

      const data = await response.json()
      if (response.ok) {
        setResult({ success: true, message: 'Test email sent successfully!' })
        setTestEmail('')
      } else {
        setResult({ success: false, message: data.message || 'Failed to send test email' })
      }
    } catch (error: any) {
      setResult({ success: false, message: 'Error: ' + (error.message || 'Unknown error') })
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#2c3e50' }}>
        Send Test Email
      </h3>
      <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>
        Send a test email to yourself to verify your templates and settings.
      </p>

      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '24px',
        border: '1px solid #e9ecef',
        maxWidth: '600px',
      }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#2c3e50',
          }}>
            Template Type
          </label>
          <select
            value={templateType}
            onChange={(e) => setTemplateType(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            <option value="welcome">Welcome Email</option>
            <option value="verify">Email Verification</option>
            <option value="reset">Password Reset</option>
            <option value="invite">User Invitation</option>
            <option value="mfa">MFA Setup</option>
            <option value="alert">Security Alert</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#2c3e50',
          }}>
            Recipient Email
          </label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="your.email@example.com"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {result && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            borderRadius: '6px',
            backgroundColor: result.success ? '#e8f5e9' : '#ffebee',
            color: result.success ? '#2e7d32' : '#c62828',
            fontSize: '14px',
            border: `1px solid ${result.success ? '#c8e6c9' : '#ffcdd2'}`,
          }}>
            {result.success ? '✓' : '✗'} {result.message}
          </div>
        )}

        <button
          onClick={handleSendTest}
          disabled={sending || !testEmail}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: sending || !testEmail ? '#e9ecef' : '#3498db',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: sending || !testEmail ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!sending && testEmail) {
              const el = e.currentTarget as HTMLElement
              el.style.backgroundColor = '#2980b9'
            }
          }}
          onMouseLeave={(e) => {
            if (!sending && testEmail) {
              const el = e.currentTarget as HTMLElement
              el.style.backgroundColor = '#3498db'
            }
          }}
        >
          {sending ? '📧 Sending...' : '✉️ Send Test Email'}
        </button>
      </div>
    </div>
  )
}
