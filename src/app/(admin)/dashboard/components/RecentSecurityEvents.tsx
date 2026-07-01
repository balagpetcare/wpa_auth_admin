'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/apiClient'
import { Badge, Card, CardBody, CardHeader, CardTitle, Spinner } from 'react-bootstrap'

type SecurityEvent = {
  id: string
  type?: string
  severity?: 'low' | 'medium' | 'high'
  timestamp?: string
  description?: string
}

export default function RecentSecurityEvents() {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'ready' | 'empty' | 'unavailable'>('ready')

  useEffect(() => {
    const load = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      try {
        const response = await apiClient(token).get<any>('/admin/security-events')
        const list = Array.isArray(response?.events) ? response.events.slice(0, 5) : []
        setEvents(list)
        setStatus(list.length ? 'ready' : 'empty')
      } catch {
        setStatus('unavailable')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const severityVariant = (severity?: string) => {
    if (severity === 'high') return 'danger'
    if (severity === 'medium') return 'warning'
    return 'info'
  }

  return (
    <Card className="border-0 shadow-sm h-100">
      <CardHeader className="bg-transparent border-0 d-flex align-items-center justify-content-between p-4 pb-0">
        <div>
          <CardTitle as="h4" className="mb-1">
            Recent security events
          </CardTitle>
          <p className="text-muted mb-0">Latest security activity from the auth layer.</p>
        </div>
        <span className="fs-3 text-primary">🛡️</span>
      </CardHeader>
      <CardBody className="p-4">
        {loading && (
          <div className="py-5 text-center text-muted">
            <Spinner animation="border" size="sm" className="me-2" />
            Loading security events...
          </div>
        )}
        {!loading && status === 'unavailable' && (
          <div className="alert alert-soft-warning mb-0">
            Security events endpoint is unavailable. Showing no live data.
          </div>
        )}
        {!loading && status === 'empty' && (
          <div className="alert alert-soft-secondary mb-0">No recent security events were returned by the API.</div>
        )}
        {!loading && status === 'ready' && (
          <div className="table-responsive">
            <table className="table table-centered table-hover mb-0">
              <thead className="bg-light bg-opacity-50">
                <tr>
                  <th>Event</th>
                  <th>Severity</th>
                  <th className="text-end">Time</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <div className="fw-semibold text-dark">{event.type || 'Unknown event'}</div>
                      <div className="text-muted small">{event.description || 'No additional details provided'}</div>
                    </td>
                    <td>
                      <Badge bg={severityVariant(event.severity)} className="text-uppercase">
                        {event.severity || 'unknown'}
                      </Badge>
                    </td>
                    <td className="text-end text-muted small">
                      {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Unavailable'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
