'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/apiClient'

type SecurityEvent = {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high'
  timestamp: string
  description?: string
}

export default function RecentSecurityEvents() {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          setLoading(false)
          return
        }

        try {
          const response = await apiClient(token).get<any>('/admin/security-events')
          if (response?.events) {
            setEvents(response.events.slice(0, 5))
          }
        } catch (apiError) {
          setError(true)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return { color: '#e74c3c', bgColor: '#ffebee' }
      case 'medium':
        return { color: '#f39c12', bgColor: '#fff3e0' }
      default:
        return { color: '#3498db', bgColor: '#e3f2fd' }
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return '🔴'
      case 'medium':
        return '🟡'
      default:
        return '🔵'
    }
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
        Recent Security Events
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
          Failed to load security events. The endpoint may not be available yet.
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#7f8c8d',
        }}>
          No recent security events found.
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {events.map((event) => {
            const { color, bgColor } = getSeverityColor(event.severity)
            return (
              <div
                key={event.id}
                style={{
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  borderLeft: `4px solid ${color}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                    {event.type}
                  </div>
                  {event.description && (
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                      {event.description}
                    </div>
                  )}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: bgColor,
                    color: color,
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                  }}>
                    {getSeverityIcon(event.severity)} {event.severity}
                  </span>
                  <div style={{ fontSize: '12px', color: '#7f8c8d', minWidth: '80px', textAlign: 'right' }}>
                    {new Date(event.timestamp).toLocaleDateString('en-US', {
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
        <a href="/security-logs" style={{
          color: '#3498db',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '500',
        }}>
          View All Security Logs →
        </a>
      </div>
    </div>
  )
}
