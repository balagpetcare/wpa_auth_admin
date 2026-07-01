'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/apiClient'

type AuditLog = {
  id: string
  action: string
  actor?: string
  resource?: string
  timestamp: string
  status?: 'success' | 'failure'
}

export default function RecentAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
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
          const response = await apiClient(token).get<any>('/admin/audit-logs')
          if (response?.logs) {
            setLogs(response.logs.slice(0, 5))
          }
        } catch (apiError) {
          setError(true)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  const getStatusColor = (status?: string) => {
    if (status === 'failure') {
      return { color: '#e74c3c', icon: '❌' }
    }
    return { color: '#27ae60', icon: '✓' }
  }

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e9ecef',
    }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>
        Recent Audit Logs
      </h3>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7f8c8d' }}>
          <div style={{
            width: '30px',
            height: '30px',
            border: '3px solid #e9ecef',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto',
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#fff3e0',
          color: '#e65100',
          borderRadius: '6px',
          fontSize: '14px',
        }}>
          Failed to load audit logs. The endpoint may not be available yet.
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#7f8c8d',
        }}>
          No recent audit logs found.
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {logs.map((log) => {
            const { color, icon } = getStatusColor(log.status)
            return (
              <div
                key={log.id}
                style={{
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  borderLeft: `4px solid #3498db`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                    {log.action}
                  </div>
                  {log.actor && (
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                      By {log.actor}
                      {log.resource && ` on ${log.resource}`}
                    </div>
                  )}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  {log.status && (
                    <span style={{
                      color: color,
                      fontSize: '16px',
                    }}>
                      {icon}
                    </span>
                  )}
                  <div style={{ fontSize: '12px', color: '#7f8c8d', minWidth: '80px', textAlign: 'right' }}>
                    {new Date(log.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid #e9ecef',
        textAlign: 'center',
      }}>
        <a href="/audit-logs" style={{
          color: '#3498db',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '500',
        }}>
          View All Audit Logs →
        </a>
      </div>
    </div>
  )
}
