'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/apiClient'

interface LogsTabProps {
  clientId: string | null
  locale: string
}

type EmailLog = {
  id: string
  templateType: string
  recipient: string
  status: 'sent' | 'failed' | 'bounced'
  timestamp: string
  errorMessage?: string
}

export default function LogsTab({ clientId, locale }: LogsTabProps) {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          setLoading(false)
          return
        }

        try {
          const response = await apiClient(token).get<any>(
            `/admin/email-logs?clientId=${clientId || 'global'}&locale=${locale}`
          )
          if (response?.logs) {
            setLogs(response.logs)
          }
        } catch (apiError) {
          setError(true)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [clientId, locale])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return { color: '#27ae60', icon: '✓', bgColor: '#e8f5e9' }
      case 'failed':
        return { color: '#e74c3c', icon: '✗', bgColor: '#ffebee' }
      case 'bounced':
        return { color: '#f39c12', icon: '⚠️', bgColor: '#fff3e0' }
      default:
        return { color: '#7f8c8d', icon: '?', bgColor: '#f8f9fa' }
    }
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#2c3e50' }}>
        Email Logs
      </h3>
      <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
        View the history of emails sent using these templates.
      </p>

      {loading && (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#7f8c8d',
        }}>
          <div style={{
            width: '30px',
            height: '30px',
            border: '3px solid #e9ecef',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto',
          }} />
        </div>
      )}

      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#fff3e0',
          borderRadius: '6px',
          color: '#e65100',
          marginBottom: '20px',
        }}>
          Failed to load email logs. The endpoint may not be available yet.
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div style={{
          padding: '40px 20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          textAlign: 'center',
          color: '#7f8c8d',
        }}>
          No email logs found. Emails sent will appear here.
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div style={{
          overflowX: 'auto',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>Template</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>Recipient</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>Sent At</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const { color, icon, bgColor } = getStatusColor(log.status)
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: bgColor,
                        color: color,
                        borderRadius: '4px',
                        fontWeight: '500',
                        fontSize: '12px',
                      }}>
                        {icon} {log.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#2c3e50' }}>{log.templateType}</td>
                    <td style={{ padding: '12px', color: '#7f8c8d' }}>{log.recipient}</td>
                    <td style={{ padding: '12px', color: '#7f8c8d' }}>
                      {new Date(log.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
